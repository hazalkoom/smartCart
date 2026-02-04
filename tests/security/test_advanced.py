import requests
import pytest
from tests.test_config import BASE_URL, print_test_result, shared_data

auth_url = f"{BASE_URL}/auth"
products_url = f"{BASE_URL}/products"

@pytest.mark.run(order=100)
def test_security_xss_injection():
    """
    Attempt to inject malicious JavaScript into user fields.
    The server should either sanitize it OR store it but return it as JSON (not executable HTML).
    """
    print("\n--- 🛡️ Running Advanced Security Tests ---")
    
    xss_payload = {
        "email": "xss_attacker@test.com",
        "password": "password123",
        # The Attack:
        "firstName": "<script>alert('hacked')</script>", 
        "lastName": "<img src=x onerror=alert(1)>"
    }
    
    # Register with XSS payload
    res = requests.post(f"{auth_url}/register", json=xss_payload)
    
    # CRITICAL: Content-Type must be JSON. If it's HTML, the browser executes the script.
    assert "application/json" in res.headers["Content-Type"]
    
    if res.status_code == 201:
        # --- FIX: User data is directly inside 'data' ---
        data = res.json()['data'] 
        
        # Optional: Print to verify how the server stored it
        # print(f"Stored Name: {data.get('firstName')}")
        
        print_test_result("Security - XSS: API handles script tags gracefully", True, res)
    else:
        # If the server rejected it (400), that is also a PASS (Sanitization)
        is_rejection = res.status_code == 400
        print_test_result("Security - XSS: Server rejected payload", is_rejection, res)
        assert is_rejection

@pytest.mark.run(order=101)
def test_security_hpp_parameter_pollution():
    """
    HTTP Parameter Pollution (HPP) Attack.
    Sending duplicate parameters: ?sort=price&sort=name
    """
    res_hpp = requests.get(f"{products_url}?sort=price&sort=name")
    
    # The server should NOT crash (500).
    is_safe = res_hpp.status_code != 500
    
    print_test_result("Security - HPP: Server survived duplicate params", is_safe, res_hpp)
    assert is_safe

@pytest.mark.run(order=102)
def test_security_method_tampering():
    """
    Try to use an invalid HTTP method on a known route.
    """
    # Try PUT on Login (Should be POST)
    res = requests.put(f"{auth_url}/login", json={"email": "a", "password": "b"})
    
    # Should be 404 (Not Found) or 405 (Method Not Allowed)
    success = res.status_code in [404, 405]
    
    print_test_result("Security - Method: Invalid Verb Blocked", success, res)
    assert success

@pytest.mark.run(order=103)
def test_security_directory_traversal():
    """
    Attempt to access system files via URL manipulation.
    """
    # Try to go up directories to access .env
    res = requests.get(f"{BASE_URL}/../../.env")
    
    success = res.status_code != 200
    print_test_result("Security - Traversal: Path manipulation blocked", success, res)
    assert success

# --- NEW TESTS ADDED BELOW ---

@pytest.mark.run(order=103.1)
def test_security_sensitive_data_exposure():
    """
    Verify API does not leak password hashes or internal DB versions (__v).
    """
    # Login to get fresh data
    login_data = {"email": "xss_attacker@test.com", "password": "password123"}
    res = requests.post(f"{auth_url}/login", json=login_data)
    
    if res.status_code == 200:
        data = res.json()['data']
        
        # Check for leaks
        has_password = 'password' in data or 'passwordHash' in data
        has_version = '__v' in data
        
        is_safe = not has_password and not has_version
        if not is_safe:
            print(f"⚠️ LEAK: Data keys found: {data.keys()}")
            
        print_test_result("Security - Leakage: No passwords/__v returned", is_safe, res)
        assert is_safe
    else:
        # If login failed (maybe XSS test failed earlier), skip
        pytest.skip("Skipping Data Leak test - Login failed")

@pytest.mark.run(order=103.2)
def test_security_jwt_tampering():
    """
    Verify that modifying the JWT token (even slightly) causes 401.
    """
    # 1. Get a valid token
    login_data = {"email": "xss_attacker@test.com", "password": "password123"}
    res = requests.post(f"{auth_url}/login", json=login_data)
    
    if res.status_code == 200:
        valid_token = res.json()['data']['token']
        
        # 2. Tamper with it (change last character)
        tampered_token = valid_token[:-1] + ('A' if valid_token[-1] != 'A' else 'B')
        
        # 3. Try to access protected route
        headers = {"Authorization": f"Bearer {tampered_token}"}
        res_tampered = requests.get(f"{auth_url}/me", headers=headers)
        
        # 4. Expect 401 or 500 (ideally 401)
        # Note: JsonWebTokenError usually throws, middleware should catch as 401
        is_blocked = res_tampered.status_code == 401
        
        print_test_result("Security - JWT: Tampered token blocked", is_blocked, res_tampered)
        assert is_blocked
    else:
        pytest.skip("Skipping JWT test - Login failed")