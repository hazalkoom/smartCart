import requests
import time
import uuid
import pytest

BASE_URL = "http://localhost:5000/api/v1"
TEST_USER = {
    "email": f"test-user-{int(time.time())}@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
}

OWNER_LOGIN = {
    "email": "owner@test.com",
    "password": "password123"
}

shared_data = {
    "customer_token": None,
    "owner_token": None,
    "category_id": None,
    "category_slug": None
}

def print_test_result(test_name, success, response):
    status_code = response.status_code if hasattr(response, 'status_code') else 'N/A'
    
    if success:
        print(f"✅ PASSED: {test_name} (Status: {status_code})")
    else:
        print(f"❌ FAILED: {test_name} (Status: {status_code})")
        try:
            print(f"   Response: {response.json()}")
        except requests.exceptions.JSONDecodeError:
            print(f"   Response: {response.text}")
    print("-" * 30)


# ---------------------------------------------------------------------------
# Isolation fixture — ensures each test file can run independently.
# When a file needs an owner token, a product, or a category it can declare
#   `@pytest.fixture(autouse=True)` that calls `ensure_test_data()`.
# If the backend is unreachable this is silently skipped.
# ---------------------------------------------------------------------------

def _unique():
    return uuid.uuid4().hex[:8]

def ensure_test_data():
    """
    Ensures shared_data contains a valid owner_token, category_id and a
    product_id.  Safe to call multiple times — existing valid data is reused.
    """
    # 1. Owner token
    if not shared_data.get('owner_token'):
        try:
            res = requests.post(f"{BASE_URL}/auth/login", json=OWNER_LOGIN, timeout=5)
            if res.status_code == 200:
                shared_data['owner_token'] = res.json()['data']['token']
        except requests.exceptions.ConnectionError:
            return  # server not running — let the real test fail later

    owner_headers = {"Authorization": f"Bearer {shared_data['owner_token']}"}

    # 2. Category
    if not shared_data.get('category_id'):
        cat_name = f"AutoCat-{_unique()}"
        try:
            res = requests.post(
                f"{BASE_URL}/categories",
                json={"name": cat_name},
                headers=owner_headers,
                timeout=5,
            )
            if res.status_code == 201:
                data = res.json()['data']
                shared_data['category_id'] = data['_id']
                shared_data['category_slug'] = data.get('slug', '')
        except requests.exceptions.ConnectionError:
            return

    # 3. Product
    if not shared_data.get('product_id'):
        prod_data = {
            "name": f"AutoProd-{_unique()}",
            "price": 50.00,
            "sku": f"AUT-{_unique()}",
            "stock": 200,
            "categoryId": shared_data.get('category_id', ''),
            "description": "Auto-generated for test isolation",
        }
        try:
            res = requests.post(
                f"{BASE_URL}/products",
                json=prod_data,
                headers=owner_headers,
                timeout=5,
            )
            if res.status_code == 201:
                data = res.json()['data']
                shared_data['product_id'] = data['_id']
                shared_data['product_slug'] = data.get('slug', '')
                shared_data['product_sku'] = data.get('sku', prod_data['sku'])
        except requests.exceptions.ConnectionError:
            return

    # 4. Customer token
    if not shared_data.get('customer_token'):
        email = f"autocust-{_unique()}@test.com"
        try:
            requests.post(
                f"{BASE_URL}/auth/register",
                json={"email": email, "password": "password123",
                      "firstName": "Auto", "lastName": "Customer"},
                timeout=5,
            )
            res = requests.post(
                f"{BASE_URL}/auth/login",
                json={"email": email, "password": "password123"},
                timeout=5,
            )
            if res.status_code == 200:
                shared_data['customer_token'] = res.json()['data']['token']
        except requests.exceptions.ConnectionError:
            return