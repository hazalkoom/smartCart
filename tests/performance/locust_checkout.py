import csv
import os
import random
from locust import HttpUser, task, between

# --- CONFIG ---
# We use the same users.csv file
CSV_PATH = os.path.join(os.path.dirname(__file__), "data/users.csv")

user_credentials = []
try:
    with open(CSV_PATH) as f:
        reader = csv.reader(f)
        next(reader) 
        for row in reader:
            user_credentials.append(row)
except FileNotFoundError:
    print(f"❌ CRITICAL: Could not find {CSV_PATH}. Run generate_users.py first.")
    exit(1)

class SmartCartUser(HttpUser):
    wait_time = between(1, 5)
    token = None
    products = [] # We will store product IDs here

    def on_start(self):
        # 1. Credentials Strategy
        if len(user_credentials) > 0:
            self.email, self.password = user_credentials.pop()
        else:
            print("⚠️ No unique users left. Stopping.")
            self.stop()
            return

        # 2. Login
        try:
            res = self.client.post("/api/v1/auth/login", json={
                "email": self.email, "password": self.password
            })
            if res.status_code == 200:
                # Extract token from: { success: true, data: { token: ... } }
                self.token = res.json().get("data", {}).get("token")
                
                if self.token:
                    self.client.headers.update({"Authorization": f"Bearer {self.token}"})
                    # 3. Fetch Products immediately so we know what to buy later
                    self.fetch_products_cache()
                else:
                    print(f"❌ Token missing for {self.email}")
                    self.stop()
            else:
                self.stop()
        except Exception as e:
            print(f"❌ Login error: {e}")
            self.stop()

    def fetch_products_cache(self):
        """
        Helper function: Hit the API once to get a list of valid Product IDs.
        """
        try:
            res = self.client.get("/api/v1/products")
            if res.status_code == 200:
                # Assuming response is: { results: 10, data: [ { _id: "...", ...} ] }
                # Adjust this line if your API structure is different!
                json_data = res.json()
                data_list = json_data.get("data", [])
                
                # Filter to ensure we only keep valid items with IDs
                self.products = [p for p in data_list if "_id" in p]
        except:
            pass

    @task(3) 
    def browse_products(self):
        # Standard browsing behavior
        self.client.get("/api/v1/products")

    @task(1)
    def view_categories(self):
        self.client.get("/api/v1/categories")

    @task(1)
    def view_cart(self):
        self.client.get("/api/v1/cart")

    @task(2) 
    def checkout_flow(self):
        """
        The Money Maker: Pick item -> Add -> Checkout
        """
        # If we failed to get products earlier, try again or skip
        if not self.products:
            self.fetch_products_cache()
            return

        # 1. Pick a random product from the list we fetched
        product = random.choice(self.products)
        product_id = product.get("_id") 

        # 2. Add to Cart
        # In the checkout_flow task...
        cart_res = self.client.post("/api/v1/cart/items", json={
            "productId": product_id,
            "quantity": 1,
            "color": "black" 
        })

        # --- DEBUG UPDATE ---
        if cart_res.status_code == 400:
            # Print the error message to the terminal so we can read it
            print(f"⚠️ Cart 400 Error: {cart_res.text}")
        # --------------------

        # 3. If Added successfully, try to Checkout
        if cart_res.status_code in [200, 201]:
            self.client.post("/api/v1/orders", json={
                "shippingAddress": {
                    "street": "123 Stress Test Blvd",
                    "city": "Performance City",
                    "country": "Egypt",
                    "zip": "12345"
                }
            })