import requests
import pytest
import time
from test_config import BASE_URL, TEST_USER, print_test_result, shared_data

auth_url = f"{BASE_URL}/auth"

@pytest.mark.run(order=1)
def test_register():
    print("\n--- 🧪 Running Register Tests ---")
    
    # Scenario 1: Successful Registration
    res_success = requests.post(f"{auth_url}/register", json=TEST_USER)
    success = res_success.status_code == 201 and res_success.json()['success'] == True
    print_test_result("Register - 1: Success (201)", success, res_success)
    assert success

    # Scenario 2: Duplicate Registration
    res_duplicate = requests.post(f"{auth_url}/register", json=TEST_USER)
    success = res_duplicate.status_code == 400 and res_duplicate.json()['error']['code'] == 'USER_EXISTS'
    print_test_result("Register - 2: Duplicate User (400)", success, res_duplicate)
    assert success

    # Scenario 3: Missing Password
    missing_pass = TEST_USER.copy()
    missing_pass.pop("password")
    missing_pass['email'] = f"new-email-{int(time.time())}@example.com"
    res_missing = requests.post(f"{auth_url}/register", json=missing_pass)
    success = res_missing.status_code == 400 and res_missing.json()['error']['code'] == 'VALIDATION_ERROR'
    print_test_result("Register - 3: Missing Password (400)", success, res_missing)
    assert success


@pytest.mark.run(order=2)

def test_login():
    print("\n--- 🧪 Running Login Tests ---")

    # Scenario 1: Successful Login
    # --- THIS IS THE CORRECTED LINE ---
    login_data = {"email": TEST_USER['email'], "password": TEST_USER['password']}
    
    res_success = requests.post(f"{auth_url}/login", json=login_data)
    success = res_success.status_code == 200 and res_success.json()['success'] == True
    if success:
        shared_data['token'] = res_success.json()['data']['token'] # Save token
    print_test_result("Login - 1: Success (200)", success, res_success)
    assert success

    # Scenario 2: Wrong Password
    wrong_pass_data = {"email": TEST_USER['email'], "password": "wrongpassword"}
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
def test_get_me():
    print("\n--- 🧪 Running Get Me (Protected) Tests ---")
    
    token = shared_data['token']
    assert token is not None, "Login failed, no token to run Get Me test"

    # Scenario 1: Successful Get Me
    headers = {"Authorization": f"Bearer {token}"}
    res_success = requests.get(f"{auth_url}/me", headers=headers)
    success = res_success.status_code == 200 and res_success.json()['data']['email'] == TEST_USER['email']
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
