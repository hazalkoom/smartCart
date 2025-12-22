import csv
import os
import random
from locust import HttpUser, task, between

# --- CONFIG ---
CSV_PATH = os.path.join(os.path.dirname(__file__), "data/users.csv")

# Load users into memory
user_credentials = []
try:
    with open(CSV_PATH) as f:
        reader = csv.reader(f)
        next(reader)  # Skip header
        for row in reader:
            user_credentials.append(row)
except FileNotFoundError:
    print(f"❌ CRITICAL: Could not find {CSV_PATH}. Run generate_users.py first.")
    exit(1)

class SmartCartUser(HttpUser):
    wait_time = between(1, 5)

    def on_start(self):
        """
        Runs once per simulated user.
        """
        # 1. Get Credentials (Robust Method)
        if len(user_credentials) > 0:
            # Try to get a unique user first
            self.email, self.password = user_credentials.pop()
        else:
            # If we ran out of unique users (e.g., others failed and respawned),
            # RELOAD the list from the file or just stop. 
            # For stability, we will just STOP this extra user to avoid errors.
            print("⚠️ No unique users left. Stopping this runner.")
            self.stop()
            return

        # 2. Login
        try:
            response = self.client.post("/api/v1/auth/login", json={
                "email": self.email,
                "password": self.password
            })

            if response.status_code == 200:
                json_response = response.json()
                
                # --- FIX: Token is inside 'data' object ---
                # We use .get("data", {}) to avoid crashing if data is missing
                self.token = json_response.get("data", {}).get("token")
                
                if self.token:
                    self.client.headers.update({"Authorization": f"Bearer {self.token}"})
                else:
                    print(f"❌ Token not found in response for {self.email}")
                    self.stop()
            else:
                print(f"❌ Login failed for {self.email}: {response.status_code}")
                self.stop()
                
        except Exception as e:
            print(f"❌ specific error: {e}")
            self.stop()

    @task(3)
    def get_products(self):
        self.client.get("/api/v1/products")

    @task(2)
    def get_categories(self):
        self.client.get("/api/v1/categories")

    @task(1)
    def view_cart(self):
        # This requires Auth. If token failed, this will 401.
        self.client.get("/api/v1/cart")

    @task(1)
    def health_check(self):
        self.client.get("/api/v1/health")