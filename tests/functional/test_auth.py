import requests
import pytest
from tests.test_config import BASE_URL, print_test_result
from tests.helpers.api_assertions import (
    assert_error,
    assert_success,
    create_email_verification_token,
    unique_suffix,
)

auth_url = f"{BASE_URL}/auth"


@pytest.fixture(scope='module')
def auth_ctx():
    user = {
        "email": f"test-user-{unique_suffix()}@example.com",
        "password": "password123",
        "firstName": "Test",
        "lastName": "User",
    }
    return {
        'user': user,
        'user_id': None,
        'token': None,
        'reset_token': None,
        'old_password': user['password'],
        'new_password': None,
    }


def _login_and_store_token(ctx):
    res = requests.post(
        f"{auth_url}/login",
        json={"email": ctx['user']['email'], "password": ctx['user']['password']},
    )
    body = assert_success(res, 200, "auth login helper")
    ctx['token'] = body['data']['token']
    ctx['user_id'] = body['data'].get('_id')
    return ctx['token']


def _verify_user_email(user_id):
    token = create_email_verification_token(user_id)
    res = requests.post(f"{auth_url}/verify-email/{token}")
    assert_success(res, 200, "verify email helper")

@pytest.mark.run(order=1)
def test_register(auth_ctx):
    print("\n--- 🧪 Running Register Tests ---")
    
    # Scenario 1: Successful Registration
    res_success = requests.post(f"{auth_url}/register", json=auth_ctx['user'])
    success = res_success.status_code == 201 and res_success.json()['success'] == True
    print_test_result("Register - 1: Success (201)", success, res_success)
    assert success
    assert 'data' in res_success.json() and 'email' in res_success.json()['data']
    assert res_success.json()['data'].get('isEmailVerified') is False

    auth_ctx['user_id'] = res_success.json()['data'].get('_id')
    _verify_user_email(auth_ctx['user_id'])

    # Scenario 2: Duplicate Registration
    res_duplicate = requests.post(f"{auth_url}/register", json=auth_ctx['user'])
    success = res_duplicate.status_code == 400 and res_duplicate.json()['error']['code'] == 'USER_EXISTS'
    print_test_result("Register - 2: Duplicate User (400)", success, res_duplicate)
    assert success

    # Scenario 3: Missing Password
    missing_pass = auth_ctx['user'].copy()
    missing_pass.pop("password")
    missing_pass['email'] = f"new-email-{unique_suffix()}@example.com"
    res_missing = requests.post(f"{auth_url}/register", json=missing_pass)
    success = res_missing.status_code == 400 and res_missing.json()['error']['code'] == 'VALIDATION_ERROR'
    print_test_result("Register - 3: Missing Password (400)", success, res_missing)
    assert success


@pytest.mark.run(order=2)

def test_login(auth_ctx):
    print("\n--- 🧪 Running Login Tests ---")

    # Scenario 1: Successful Login
    # --- THIS IS THE CORRECTED LINE ---
    login_data = {"email": auth_ctx['user']['email'], "password": auth_ctx['user']['password']}
    
    res_success = requests.post(f"{auth_url}/login", json=login_data)
    success = res_success.status_code == 200 and res_success.json()['success'] == True
    if success:
        auth_ctx['token'] = res_success.json()['data']['token']
        auth_ctx['user_id'] = res_success.json()['data'].get('_id')
    print_test_result("Login - 1: Success (200)", success, res_success)
    assert success
    assert res_success.json()['data'].get('isEmailVerified') is True

    # Scenario 2: Wrong Password
    wrong_pass_data = {"email": auth_ctx['user']['email'], "password": "wrongpassword"}
    res_wrong_pass = requests.post(f"{auth_url}/login", json=wrong_pass_data)
    success = res_wrong_pass.status_code == 401 and res_wrong_pass.json()['error']['code'] == 'INVALID_CREDENTIALS'
    print_test_result("Login - 2: Wrong Password (401)", success, res_wrong_pass)
    assert success

    # Scenario 3: Non-existent User
    non_existent_data = {"email": "nouser@example.com", "password": "password123"}
    res_no_user = requests.post(f"{auth_url}/login", json=non_existent_data)
    success = res_no_user.status_code == 401 and res_no_user.json()['error']['code'] == 'INVALID_CREDENTIALS'
    print_test_result("Login - 3: Non-existent User (401)", success, res_no_user)
    assert success

@pytest.mark.run(order=3)
def test_get_me(auth_ctx):
    print("\n--- 🧪 Running Get Me (Protected) Tests ---")
    
    token = auth_ctx['token'] or _login_and_store_token(auth_ctx)

    # Scenario 1: Successful Get Me
    headers = {"Authorization": f"Bearer {token}"}
    res_success = requests.get(f"{auth_url}/me", headers=headers)
    success = res_success.status_code == 200 and res_success.json()['data']['email'] == auth_ctx['user']['email']
    print_test_result("Get Me - 1: Success (200)", success, res_success)
    assert success

    # Scenario 2: Invalid Token
    headers_invalid = {"Authorization": "Bearer 12345abcdef"}
    res_invalid = requests.get(f"{auth_url}/me", headers=headers_invalid)
    success = res_invalid.status_code == 401 and res_invalid.json()['error']['code'] == 'TOKEN_INVALID'
    print_test_result("Get Me - 2: Invalid Token (401)", success, res_invalid)
    assert success

    # Scenario 3: No Token
    res_no_token = requests.get(f"{auth_url}/me")
    success = res_no_token.status_code == 401 and res_no_token.json()['error']['code'] == 'TOKEN_MISSING'
    print_test_result("Get Me - 3: No Token (401)", success, res_no_token)
    assert success


@pytest.mark.run(order=4)
def test_update_details(auth_ctx):
    print("\n--- 🧪 Running Update Details Tests ---")
    
    token = auth_ctx['token'] or _login_and_store_token(auth_ctx)
    
    headers = {"Authorization": f"Bearer {token}"}

    # Scenario 1: Successful Update (Name Only)
    update_data = {
        "firstName": "UpdatedName", 
        "lastName": "UpdatedLast"
    }
    
    res = requests.put(f"{auth_url}/updatedetails", json=update_data, headers=headers)
    
    success = res.status_code == 200 and res.json()['success'] is True
    data = res.json().get('data', {})
    
    # Check if response data matches what we sent
    matches = data.get('firstName') == "UpdatedName" and data.get('lastName') == "UpdatedLast"
    
    print_test_result("Update - 1: Success (200)", success and matches, res)
    assert success and matches

    # Scenario 2: Verify Persistence (Call /me to check if it really changed)
    res_me = requests.get(f"{auth_url}/me", headers=headers)
    persisted = res_me.json()['data']['firstName'] == "UpdatedName"
    print_test_result("Update - 2: Persistence Check", persisted, res_me)
    assert persisted

    # Scenario 3: Attempt to update Email (Should be ignored based on your service logic)
    # We send an email update, but since you removed email from the allowed fields in authService,
    # the name should update (or stay same), but the email should NOT change.
    original_email = res_me.json()['data']['email']
    hack_attempt = {
        "firstName": "Hacker",
        "email": "hacker@test.com"
    }
    
    res_hack = requests.put(f"{auth_url}/updatedetails", json=hack_attempt, headers=headers)
    
    # Request should succeed (200) because we update the name
    # BUT the email in the response should still be the ORIGINAL email
    email_unchanged = res_hack.json()['data']['email'] == original_email
    name_changed = res_hack.json()['data']['firstName'] == "Hacker"
    
    print_test_result("Update - 3: Email Update Ignored (Security Check)", email_unchanged and name_changed, res_hack)
    assert email_unchanged


@pytest.mark.run(order=4.05)
def test_verify_email_invalid_token():
    res = requests.post(f"{auth_url}/verify-email/invalid-token")
    assert_error(res, 400, 'VALIDATION_ERROR', 'Invalid or expired verification token', 'verify email invalid token')


@pytest.mark.run(order=4.06)
def test_resend_verification_happy_path():
    email = f"resend_user_{unique_suffix()}@example.com"
    res_reg = requests.post(
        f"{auth_url}/register",
        json={"email": email, "password": "password123", "firstName": "Resend", "lastName": "User"},
    )
    assert res_reg.status_code == 201

    res_login = requests.post(f"{auth_url}/login", json={"email": email, "password": "password123"})
    body = assert_success(res_login, 200, "resend verification login")
    token = body['data']['token']

    res = requests.post(f"{auth_url}/resend-verification", headers={"Authorization": f"Bearer {token}"})
    assert_success(res, 200, "resend verification")


@pytest.mark.run(order=4.1)
def test_forgot_password_happy_path(auth_ctx):
    print("\n--- 🧪 Running Forgot Password Tests ---")
    
    # Use the TEST_USER email from earlier tests
    res = requests.post(f"{auth_url}/forgot-password", json={"email": auth_ctx['user']['email']})
    
    success = res.status_code == 200 and res.json().get('success') == True
    print_test_result("Forgot Password - 1: Success (200)", success, res)
    assert success
    assert res.json().get('resetToken') is None


@pytest.mark.run(order=4.2)
def test_forgot_password_invalid_email():
    # Test with non-existent email — should return 200 (prevents user enumeration)
    res = requests.post(f"{auth_url}/forgot-password", json={"email": "nonexistent@nowhere.com"})
    
    success = res.status_code == 200 and res.json().get('success') == True
    print_test_result("Forgot Password - 2: Invalid Email Returns 200 (Anti-Enumeration)", success, res)
    assert success
    # Crucially, no resetToken should be in the response for non-existent email
    assert res.json().get('resetToken') is None, "Token should NOT be returned for non-existent email"
