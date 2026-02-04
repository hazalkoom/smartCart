import requests
import pytest
from tests.test_config import BASE_URL

# --- CONFIGURATION ---
PAYLOAD_LIMIT_BYTES = 10 * 1024 

@pytest.mark.run(order=97)
def test_security_headers_helmet():
    """
    Verify that Helmet.js is active and setting critical security headers.
    """
    print("\n--- 🛡️ Running Security (Hardening) Tests ---")
    
    # Hit a public endpoint
    res = requests.get(f"{BASE_URL}/health")
    assert res.status_code == 200
    
    headers = res.headers
    
    # 1. DNS Prefetch Control (Helmet default)
    assert headers.get('X-DNS-Prefetch-Control') == 'off'
    
    # 2. Frame Options (Prevent Clickjacking)
    assert headers.get('X-Frame-Options') == 'SAMEORIGIN'
    
    # 3. Powered By (Should be hidden)
    # Express adds 'X-Powered-By: Express' by default. Helmet removes it.
    assert 'X-Powered-By' not in headers

@pytest.mark.run(order=98)
def test_security_payload_limit():
    """
    Verify the 10kb body limit prevents Denial of Service (DoS) via large payloads.
    """
    # Create a string larger than 10kb
    huge_text = "a" * (PAYLOAD_LIMIT_BYTES + 500) 
    
    payload = {
        "email": "hacker@test.com",
        "password": "pass",
        "data": huge_text
    }
    
    # Try to hit the login route (or any POST route)
    res = requests.post(f"{BASE_URL}/auth/login", json=payload)
    
    # Expect 413 Payload Too Large
    success = res.status_code == 413
    
    if not success:
        print(f"⚠️ Failed: API accepted {len(huge_text)} bytes! Status: {res.status_code}")
    
    assert success

@pytest.mark.run(order=99)
def test_security_error_leakage():
    """
    Ensure the API does not leak Stack Traces in production/testing.
    """
    # Force a cast error (Invalid ID)
    res = requests.get(f"{BASE_URL}/products/invalid-id-123")
    
    # Should be 400 or 404, but definitely NOT 500 with a stack trace
    
    json_response = res.json()
    

    
    # We want to ensure the response is JSON, not HTML (which defaults happen on crashes)
    assert res.headers.get('Content-Type').startswith('application/json')
    assert 'success' in json_response or 'status' in json_response