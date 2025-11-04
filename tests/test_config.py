import requests
import time

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