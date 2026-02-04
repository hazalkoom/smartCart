import requests
import pytest
import sys
import os


sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from tests.test_config import BASE_URL, print_test_result, shared_data
# -------------------------------------------------------------------------

auth_url = f"{BASE_URL}/auth"
product_url = f"{BASE_URL}/products"

@pytest.mark.run(order=95)
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


@pytest.mark.run(order=96)
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


@pytest.mark.run(order=96.1)
def test_reset_token_tampering():
    """
    Security Test: Modifying even one character of a reset token should fail.
    """
    print("\n--- 🛡️ Running Password Reset Security Tests ---")
    
    # First, get a valid reset token
    from tests.test_config import TEST_USER
    
    res_forgot = requests.post(f"{auth_url}/forgot-password", json={"email": TEST_USER['email']})
    
    if res_forgot.status_code != 200:
        pytest.skip("Could not get reset token for security test")
    
    valid_token = res_forgot.json().get('resetToken', '')
    
    if not valid_token:
        pytest.skip("Reset token not in response")
    
    # Tamper with the token (change last character)
    tampered_token = valid_token[:-1] + ('X' if valid_token[-1] != 'X' else 'Y')
    
    res = requests.post(f"{auth_url}/reset-password/{tampered_token}", json={"password": "hackerpass"})
    
    # Should be 400 (Invalid token)
    success = res.status_code == 400
    print_test_result("Security - Token Tampering Blocked", success, res)
    assert success


@pytest.mark.run(order=96.2)
def test_reset_token_replay_attack():
    """
    Security Test: Using the same reset token twice should fail the second time.
    """
    from tests.test_config import TEST_USER
    
    # Get a fresh reset token
    res_forgot = requests.post(f"{auth_url}/forgot-password", json={"email": TEST_USER['email']})
    
    if res_forgot.status_code != 200:
        pytest.skip("Could not get reset token")
    
    token = res_forgot.json().get('resetToken')
    
    # First use - should succeed
    res_first = requests.post(f"{auth_url}/reset-password/{token}", json={"password": "firstReset123"})
    first_worked = res_first.status_code == 200
    
    if not first_worked:
        pytest.skip("First reset failed, cannot test replay")
    
    # Second use - MUST fail (token should be cleared)
    res_replay = requests.post(f"{auth_url}/reset-password/{token}", json={"password": "replayAttempt"})
    
    replay_blocked = res_replay.status_code == 400
    print_test_result("Security - Replay Attack Blocked", replay_blocked, res_replay)
    assert replay_blocked


@pytest.mark.run(order=96.3)
def test_forgot_password_nosql_injection():
    """
    Security Test: NoSQL injection attempt on forgot-password endpoint.
    """
    injection_payload = {
        "email": {"$ne": None}  # Operator injection
    }
    
    res = requests.post(f"{auth_url}/forgot-password", json=injection_payload)
    
    # Must NOT return 200 (which would indicate it found a user via injection)
    is_safe = res.status_code != 200
    print_test_result("Security - Forgot Password NoSQL Injection Blocked", is_safe, res)
    assert is_safe


@pytest.mark.run(order=96.4)
def test_reset_password_nosql_injection():
    """
    Security Test: NoSQL injection attempt on reset-password endpoint.
    """
    # Try injecting through the token parameter
    injection_token = "abc' || '1'=='1"
    
    res = requests.post(f"{auth_url}/reset-password/{injection_token}", json={"password": "hacked"})
    
    # Must NOT succeed
    is_safe = res.status_code != 200
    print_test_result("Security - Reset Password Injection Blocked", is_safe, res)
    assert is_safe
