import requests
import pytest

from tests.test_config import BASE_URL
from tests.helpers.api_assertions import assert_status, assert_success, auth_header, unique_suffix

auth_url = f"{BASE_URL}/auth"
products_url = f"{BASE_URL}/products"


@pytest.fixture(scope='module')
def advanced_user_creds():
    email = f"advanced_{unique_suffix()}@test.com"
    password = "password123"
    res_reg = requests.post(
        f"{auth_url}/register",
        json={"email": email, "password": password, "firstName": "Adv", "lastName": "User"},
    )
    assert_status(res_reg, 201, "advanced register baseline user")
    return {'email': email, 'password': password}


@pytest.mark.run(order=100)
def test_security_xss_injection():
    xss_payload = {
        "email": f"xss_{unique_suffix()}@test.com",
        "password": "password123",
        "firstName": "<script>alert('hacked')</script>",
        "lastName": "<img src=x onerror=alert(1)>",
    }
    res = requests.post(f"{auth_url}/register", json=xss_payload)
    assert "application/json" in res.headers.get("Content-Type", "")
    assert res.status_code in [201, 400]


@pytest.mark.run(order=101)
def test_security_hpp_parameter_pollution():
    res_hpp = requests.get(f"{products_url}?sort=price&sort=name")
    assert res_hpp.status_code != 500


@pytest.mark.run(order=102)
def test_security_method_tampering():
    res = requests.put(f"{auth_url}/login", json={"email": "a", "password": "b"})
    assert res.status_code in [404, 405]


@pytest.mark.run(order=103)
def test_security_directory_traversal():
    res = requests.get(f"{BASE_URL}/../../.env")
    assert res.status_code != 200


@pytest.mark.run(order=103.1)
def test_security_sensitive_data_exposure(advanced_user_creds):
    res = requests.post(f"{auth_url}/login", json=advanced_user_creds)
    body = assert_success(res, 200, "advanced login for leakage check")
    data = body['data']
    assert 'password' not in data
    assert 'passwordHash' not in data
    assert '__v' not in data


@pytest.mark.run(order=103.2)
def test_security_jwt_tampering(advanced_user_creds):
    res = requests.post(f"{auth_url}/login", json=advanced_user_creds)
    body = assert_success(res, 200, "advanced login for jwt tampering")
    valid_token = body['data']['token']
    tampered_token = valid_token[:-1] + ('A' if valid_token[-1] != 'A' else 'B')

    res_tampered = requests.get(f"{auth_url}/me", headers=auth_header(tampered_token))
    assert_status(res_tampered, 401, "tampered jwt should be rejected")