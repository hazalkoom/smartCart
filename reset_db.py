import requests

# Config
BASE_URL = "http://localhost:5000/api/v1"
LOGIN = {"email": "owner@test.com", "password": "password123"}

def clean_slate():
    print("🧹 Starting Database Cleanup...")
    
    # 1. Login
    res = requests.post(f"{BASE_URL}/auth/login", json=LOGIN)
    if res.status_code != 200:
        print("❌ Could not login as Owner. Is the server running?")
        return
    token = res.json()['data']['token']
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Delete All Products
    prods = requests.get(f"{BASE_URL}/products?limit=1000").json()['data']
    print(f"Found {len(prods)} products. Deleting...")
    for p in prods:
        requests.delete(f"{BASE_URL}/products/{p['_id']}", headers=headers)

    # 3. Delete All Categories
    cats = requests.get(f"{BASE_URL}/categories").json()['data']
    print(f"Found {len(cats)} categories. Deleting...")
    for c in cats:
        requests.delete(f"{BASE_URL}/categories/{c['_id']}", headers=headers)

    print("✨ Database Cleaned! Now run your tests.")

if __name__ == "__main__":
    clean_slate()