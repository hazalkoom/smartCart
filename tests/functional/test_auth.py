import requests
import pytest
import time
from tests.test_config import BASE_URL, TEST_USER, print_test_result, shared_data

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


@pytest.mark.run(order=4)
def test_update_details():
    print("\n--- 🧪 Running Update Details Tests ---")
    
    token = shared_data.get('token')
    assert token is not None, "Login failed, no token to run Update test"
    
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


@pytest.mark.run(order=4.1)
def test_forgot_password_happy_path():
    print("\n--- 🧪 Running Forgot Password Tests ---")
    
    # Use the TEST_USER email from earlier tests
    res = requests.post(f"{auth_url}/forgot-password", json={"email": TEST_USER['email']})
    
    success = res.status_code == 200 and res.json().get('success') == True
    print_test_result("Forgot Password - 1: Success (200)", success, res)
    assert success
    
    # Save the reset token for the next test
    reset_token = res.json().get('resetToken')
    assert reset_token is not None, "Reset token not returned in response"
    shared_data['reset_token'] = reset_token
    shared_data['old_password'] = TEST_USER['password']


@pytest.mark.run(order=4.2)
def test_forgot_password_invalid_email():
    # Test with non-existent email
    res = requests.post(f"{auth_url}/forgot-password", json={"email": "nonexistent@nowhere.com"})
    
    # Should fail (400 or 404)
    success = res.status_code in [400, 404]
    print_test_result("Forgot Password - 2: Invalid Email (400/404)", success, res)
    assert success


@pytest.mark.run(order=4.3)
def test_reset_password_happy_path():
    print("\n--- 🧪 Running Reset Password Tests ---")
    
    reset_token = shared_data.get('reset_token')
    assert reset_token is not None, "No reset token found. Run forgot_password test first."
    
    new_password = "newSecurePassword123"
    
    res = requests.post(f"{auth_url}/reset-password/{reset_token}", json={"password": new_password})
    
    success = res.status_code == 200 and res.json().get('success') == True
    print_test_result("Reset Password - 1: Success (200)", success, res)
    assert success
    
    # Save new password for verification
    shared_data['new_password'] = new_password


@pytest.mark.run(order=4.4)
def test_login_with_new_password():
    print("\n--- 🧪 Verifying Password Change ---")
    
    new_password = shared_data.get('new_password')
    old_password = shared_data.get('old_password')
    
    assert new_password is not None, "New password not set"
    
    # Scenario 1: Login with NEW password should WORK
    res_new = requests.post(f"{auth_url}/login", json={"email": TEST_USER['email'], "password": new_password})
    new_works = res_new.status_code == 200 and res_new.json().get('success') == True
    print_test_result("Password Verify - 1: New Password Works", new_works, res_new)
    assert new_works
    
    # Update the shared token with new login
    if new_works:
        shared_data['token'] = res_new.json()['data']['token']
    
    # Scenario 2: Login with OLD password should FAIL
    res_old = requests.post(f"{auth_url}/login", json={"email": TEST_USER['email'], "password": old_password})
    old_fails = res_old.status_code == 401
    print_test_result("Password Verify - 2: Old Password Fails", old_fails, res_old)
    assert old_fails
