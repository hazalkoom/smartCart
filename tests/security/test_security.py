import requests
import pytest
import sys
import os


sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from tests.test_config import BASE_URL, print_test_result, shared_data
# -------------------------------------------------------------------------

auth_url = f"{BASE_URL}/auth"
product_url = f"{BASE_URL}/products"

@pytest.mark.run(order=51)
def test_security_rbac():
    print("\n--- 🛡️ Running Security (RBAC) Tests ---")
    
    # We rely on the token generated in test_auth.py (functional tests)
    token = shared_data.get('token')
    
    # If running standalone, you might not have a token. 
    # This check prevents a crash, but you should run functional tests first.
    if not token:
        pytest.skip("Skipping Security Tests: No token found. Run functional/test_auth.py first.")
    
    headers = {"Authorization": f"Bearer {token}"}

    # Scenario 1: Customer trying to Create Product (Should be Forbidden)
    new_product = {
        "name": "Hacker Product",
        "price": 100,
        "sku": "HACK-001",
        "stock": 10,
        "description": "This should not exist",
        "categoryId": "654321654321654321654321" # Fake ID
    }
    
    res = requests.post(product_url, json=new_product, headers=headers)
    
    # Expect 403 Forbidden (Authorized but not Admin/Owner)
    success = res.status_code == 403
    print_test_result("Security - 1: Customer cannot Create Product (403)", success, res)
    assert success

    # Scenario 2: Customer trying to Delete a Product
    fake_id = "654321654321654321654321"
    res_delete = requests.delete(f"{product_url}/{fake_id}", headers=headers)
    
    success_delete = res_delete.status_code == 403
    print_test_result("Security - 2: Customer cannot Delete Product (403)", success_delete, res_delete)
    assert success_delete


@pytest.mark.run(order=52)
def test_security_injection():
    print("\n--- 💉 Running Security (Injection) Tests ---")
    
    # Scenario 1: NoSQL Injection Attempt on Login
    # Attacker sends a query operator ($gt) instead of a string
    injection_payload = {
        "email": {"$gt": ""},
        "password": "anything"
    }
    
    try:
        res = requests.post(f"{auth_url}/login", json=injection_payload)
        # It MUST NOT be 200 OK. Ideally 400, 401, or 422.
        is_safe = res.status_code != 200
        print_test_result("Security - 3: NoSQL Injection Blocked", is_safe, res)
        assert is_safe
    except Exception as e:
        # If the server drops the connection, that's technically safe (no login), but messy.
        print(f"Server refused connection (Safe): {e}")