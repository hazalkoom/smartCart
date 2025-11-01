import requests
import time

BASE_URL = "http://localhost:5000/api/v1"
TEST_USER = {
    "email": f"test-user-{int(time.time())}@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
}
global_token = ""

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