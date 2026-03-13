import requests
import pytest
import sys
import os
import uuid


sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from tests.test_config import BASE_URL, print_test_result
from tests.helpers.api_assertions import assert_error, assert_status, auth_header
# -------------------------------------------------------------------------

auth_url = f"{BASE_URL}/auth"
product_url = f"{BASE_URL}/products"


def _unique_email(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:8]}@example.com"


@pytest.fixture(scope='module')
def customer_token():
    email = _unique_email('security_customer')
    register_payload = {
        "email": email,
        "password": "password123",
        "firstName": "Security",
        "lastName": "Customer",
    }
    requests.post(f"{auth_url}/register", json=register_payload)
    res_login = requests.post(f"{auth_url}/login", json={"email": email, "password": "password123"})
    assert_status(res_login, 200, "security fixture customer login")
    return res_login.json()['data']['token']


@pytest.fixture(scope='module')
def reset_user_email():
    email = _unique_email('security_reset')
    payload = {
        "email": email,
        "password": "password123",
        "firstName": "Reset",
        "lastName": "User",
    }
    res = requests.post(f"{auth_url}/register", json=payload)
    assert res.status_code in [201, 400]
    return email

@pytest.mark.run(order=95)
def test_security_rbac(customer_token):
    print("\n--- 🛡️ Running Security (RBAC) Tests ---")
    
    headers = auth_header(customer_token)

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
    assert_error(res, 403, 'FORBIDDEN', 'not authorized', 'rbac create product forbidden')
    assert success

    # Scenario 2: Customer trying to Delete a Product
    fake_id = "654321654321654321654321"
    res_delete = requests.delete(f"{product_url}/{fake_id}", headers=headers)
    
    success_delete = res_delete.status_code == 403
    print_test_result("Security - 2: Customer cannot Delete Product (403)", success_delete, res_delete)
    assert_error(res_delete, 403, 'FORBIDDEN', 'not authorized', 'rbac delete product forbidden')
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
    
    res = requests.post(f"{auth_url}/login", json=injection_payload)
    is_safe = res.status_code in [400, 401]
    print_test_result("Security - 3: NoSQL Injection Blocked", is_safe, res)
    assert is_safe


@pytest.mark.run(order=96.1)
def test_reset_token_tampering(reset_user_email):
    """
    Security Test: Modifying even one character of a reset token should fail.
    """
    print("\n--- 🛡️ Running Password Reset Security Tests ---")
    
    # First, get a valid reset token
    res_forgot = requests.post(f"{auth_url}/forgot-password", json={"email": reset_user_email})
    
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
    email = _unique_email('security_replay')
    requests.post(
        f"{auth_url}/register",
        json={"email": email, "password": "password123", "firstName": "Replay", "lastName": "User"},
    )
    
    # Get a fresh reset token
    res_forgot = requests.post(f"{auth_url}/forgot-password", json={"email": email})
    
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
    
    # Must fail validation with an explicit client error.
    is_safe = res.status_code == 400
    print_test_result("Security - Forgot Password NoSQL Injection Blocked", is_safe, res)
    if is_safe:
        assert_error(res, 400, 'VALIDATION_ERROR', 'valid email', 'forgot password injection')
    assert is_safe


@pytest.mark.run(order=96.4)
def test_reset_password_nosql_injection():
    """
    Security Test: NoSQL injection attempt on reset-password endpoint.
    """
    # Try injecting through the token parameter
    injection_token = "abc' || '1'=='1"
    
    res = requests.post(f"{auth_url}/reset-password/{injection_token}", json={"password": "hacked"})
    
    # Must fail with invalid token handling.
    is_safe = res.status_code == 400
    print_test_result("Security - Reset Password Injection Blocked", is_safe, res)
    if is_safe:
        assert_error(res, 400, 'VALIDATION_ERROR', 'Invalid token', 'reset password injection')
    assert is_safe
