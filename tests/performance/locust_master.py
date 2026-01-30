import csv
import os
import random
import time
from locust import HttpUser, task, between, events

# --- 1. ROBUST CSV LOADING ---
user_credentials = []

# List of places to look for users.csv
possible_paths = [
    "users.csv",                                      # Root
    "tests/performance/users.csv",                    # Standard location
    "tests/performance/data/users.csv",               # Data folder
    os.path.join(os.path.dirname(__file__), "users.csv"), # Next to script
    os.path.join(os.path.dirname(__file__), "../../users.csv"), # 2 levels up
]

csv_found = False
for path in possible_paths:
    if os.path.exists(path):
        try:
            with open(path) as f:
                reader = csv.reader(f)
                next(reader)  # Skip header
                for row in reader:
                    if row and len(row) >= 2:
                        user_credentials.append(row)
            print(f"✅ Loaded {len(user_credentials)} users from: {path}")
            csv_found = True
            break
        except Exception as e:
            print(f"⚠️ Found {path} but failed to read: {e}")

if not csv_found:
    print("⚠️ No users.csv found. Will use AUTO-REGISTRATION fallback.")

class SmartCartUser(HttpUser):
    # Wait 1-3 seconds between actions
    wait_time = between(1, 3)
    
    token = None
    products = [] 

    def on_start(self):
        """
        Runs when a user spawns. 
        Tries to load from CSV. If empty, Registers a new user on the fly.
        """
        self.email = None
        self.password = None

        # --- STRATEGY: CSV or AUTO-REGISTER ---
        if len(user_credentials) > 0:
            # Plan A: Use CSV
            self.email, self.password = user_credentials.pop()
            self.login()
        else:
            # Plan B: Auto-Register (Fallback)
            self.auto_register_and_login()

    def auto_register_and_login(self):
        """
        Generates a random user, registers them, and logs them in.
        """
        unique_id = f"{int(time.time())}_{random.randint(10000, 99999)}"
        self.email = f"load_{unique_id}@test.com"
        self.password = "password123"
        
        # 1. Register
        reg_res = self.client.post("/api/v1/auth/register", json={
            "email": self.email, "password": self.password,
            "firstName": "Load", "lastName": "Tester"
        }, name="/auth/register (Setup)")
        
        if reg_res.status_code in [200, 201]:
            # 2. Login
            self.login()
        else:
            print(f"❌ Auto-Reg Failed: {reg_res.status_code}")
            self.stop()

    def login(self):
        try:
            res = self.client.post("/api/v1/auth/login", json={
                "email": self.email, "password": self.password
            }, name="/auth/login")

            if res.status_code == 200:
                self.token = res.json().get("data", {}).get("token")
                if self.token:
                    self.client.headers.update({"Authorization": f"Bearer {self.token}"})
                else:
                    print(f"❌ Login ok but no token for {self.email}")
                    self.stop()
            else:
                # If 401, maybe CSV data is stale? Try Auto-Reg instead of dying.
                if res.status_code == 401:
                    print(f"⚠️ CSV Login failed for {self.email}. Retrying with Auto-Reg...")
                    self.auto_register_and_login()
                else:
                    self.stop()
                
        except Exception as e:
            print(f"❌ Login Exception: {e}")
            self.stop()

    @task(5)
    def browse_products(self):
        """
        High Frequency: Browsing
        """
        with self.client.get("/api/v1/products", catch_response=True, name="/products") as response:
            if response.status_code == 200:
                data = response.json()
                if data.get('data'):
                    self.products = data['data']
            elif response.status_code == 404:
                # No products? That's fine, just mark valid
                response.success()
            else:
                response.failure(f"Status {response.status_code}")

    @task(2)
    def view_cart(self):
        self.client.get("/api/v1/cart", name="/cart")

    @task(1) 
    def checkout_flow(self):
        """
        Critical Path: Buy Item -> Pay
        """
        # A. Need Products first
        if not self.products:
            self.browse_products()
            if not self.products: return

        product = random.choice(self.products)
        product_id = product.get("_id") 

        # B. Add to Cart
        cart_res = self.client.post("/api/v1/cart/items", json={
            "productId": product_id,
            "quantity": 1
        }, name="/cart/items")

        if cart_res.status_code != 200:
            return 

        # C. Create Order
        order_res = self.client.post("/api/v1/orders", json={
            "shippingAddress": {
                "street": "Load Test St", "city": "Cairo", "country": "Egypt"
            }
        }, name="/orders")

        if order_res.status_code == 201:
            order_data = order_res.json().get('data', {})
            # Handle if order is nested in data.order or just data
            order_id = order_data.get('order', {}).get('_id') or order_data.get('_id')

            if order_id:
                # D. PAY (Card)
                self.client.post(f"/api/v1/orders/{order_id}/pay", json={
                    "paymentMethod": "card"
                }, name="/orders/:id/pay")