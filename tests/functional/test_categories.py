import requests
import pytest
from tests.test_config import BASE_URL, OWNER_LOGIN, print_test_result
from tests.helpers.api_assertions import (
    assert_error,
    assert_status,
    assert_success,
    auth_header,
    unique_suffix,
)

category_url = f"{BASE_URL}/categories"


@pytest.fixture(scope='module')
def category_ctx():
    res = requests.post(f"{BASE_URL}/auth/login", json=OWNER_LOGIN)
    body = assert_success(res, 200, "category setup owner login")
    owner_headers = auth_header(body['data']['token'])

    customer_email = f"customer-{unique_suffix()}@example.com"
    register_payload = {
        "email": customer_email,
        "password": "password123",
        "firstName": "Temp",
        "lastName": "Customer",
    }
    res_register = requests.post(f"{BASE_URL}/auth/register", json=register_payload)
    assert_status(res_register, 201, "category setup customer register")

    res_login = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": customer_email, "password": "password123"},
    )
    login_body = assert_success(res_login, 200, "category setup customer login")
    customer_headers = auth_header(login_body['data']['token'])

    return {
        'owner_headers': owner_headers,
        'customer_headers': customer_headers,
        'category_id': None,
        'category_slug': None,
    }


@pytest.mark.run(order=13)
def test_get_owner_token(category_ctx):
    assert category_ctx['owner_headers'].get('Authorization', '').startswith('Bearer '), (
        "Could not get owner token. Did you create 'owner@test.com' in MongoDB?"
    )


@pytest.mark.run(order=14)
def test_get_all_categories_public():
    res = requests.get(category_url)
    success = res.status_code == 200 and 'count' in res.json()
    print_test_result("GET - 1: Get All (Public)", success, res)
    assert success


@pytest.mark.run(order=15)
def test_category_security_no_token():
    res = requests.post(category_url, json={"name": "No Token Test"})
    success = res.status_code == 401 and res.json()['error']['code'] == 'TOKEN_MISSING'
    print_test_result("Security - 1: POST without token (401)", success, res)
    assert success


@pytest.mark.run(order=16)
def test_category_security_customer_role(category_ctx):
    res = requests.post(category_url, json={"name": "Customer Test"}, headers=category_ctx['customer_headers'])
    success = res.status_code == 403 and res.json()['error']['code'] == 'FORBIDDEN'
    print_test_result("Security - 2: POST with Customer token (403)", success, res)
    assert success


@pytest.mark.run(order=17)
def test_create_category_validation(category_ctx):
    res_missing = requests.post(category_url, json={"name": ""}, headers=category_ctx['owner_headers'])
    success_missing = res_missing.status_code == 400 and "name is required" in res_missing.json()['error']['message']
    print_test_result("POST - 1: Validation (Missing Name)", success_missing, res_missing)
    assert success_missing

    long_name = "a" * 51
    res_long = requests.post(category_url, json={"name": long_name}, headers=category_ctx['owner_headers'])
    success_long = res_long.status_code == 400 and "more than 50" in res_long.json()['error']['message']
    print_test_result("POST - 2: Validation (Long Name)", success_long, res_long)
    assert success_long


@pytest.mark.run(order=18)
def test_create_category_logic(category_ctx):
    category_data = {"name": f"Test Electronics {unique_suffix()}", "description": "A test category"}
    res = requests.post(category_url, json=category_data, headers=category_ctx['owner_headers'])
    success = res.status_code == 201 and res.json()['data']['name'] == category_data['name']
    print_test_result("POST - 3: Happy Path (Create)", success, res)
    assert success

    category_ctx['category_id'] = res.json()['data']['_id']
    category_ctx['category_slug'] = res.json()['data']['slug']

    res_dup = requests.post(category_url, json=category_data, headers=category_ctx['owner_headers'])
    success_dup = res_dup.status_code == 400 and "already exists" in res_dup.json()['error']['message']
    print_test_result("POST - 4: Logic (Duplicate Name)", success_dup, res_dup)
    assert success_dup


@pytest.mark.run(order=19)
def test_get_single_category_public(category_ctx):
    slug = category_ctx['category_slug']
    assert slug, "Create test failed, no slug to test GET"

    res = requests.get(f"{category_url}/{slug}")
    success = res.status_code == 200 and res.json()['data']['slug'] == slug
    print_test_result("GET - 2: Get Single (Happy Path)", success, res)
    assert success

    res_404 = requests.get(f"{category_url}/does-not-exist")
    success_404 = res_404.status_code == 404 and res_404.json()['error']['code'] == 'NOT_FOUND'
    print_test_result("GET - 3: Get Single (Not Found)", success_404, res_404)
    assert success_404


@pytest.mark.run(order=20)
def test_update_category_logic(category_ctx):
    category_id = category_ctx['category_id']
    assert category_id, "Create test failed, no ID to test PUT"

    update_data = {"name": f"Test Gadgets {unique_suffix()}", "description": "Updated desc"}
    res = requests.put(f"{category_url}/{category_id}", json=update_data, headers=category_ctx['owner_headers'])
    success = res.status_code == 200 and res.json()['data']['name'] == update_data['name']
    print_test_result("PUT - 1: Happy Path (Update)", success, res)
    assert success

    fake_id = "605d5b1d9c3e1a001f7b8b1a"
    res_404 = requests.put(f"{category_url}/{fake_id}", json=update_data, headers=category_ctx['owner_headers'])
    success_404 = res_404.status_code == 404 and res_404.json()['error']['code'] == 'NOT_FOUND'
    print_test_result("PUT - 2: Logic (Not Found)", success_404, res_404)
    assert success_404


@pytest.mark.run(order=21)
def test_delete_category(category_ctx):
    category_id = category_ctx['category_id']
    assert category_id, "Create test failed, no ID to test DELETE"

    res = requests.delete(f"{category_url}/{category_id}", headers=category_ctx['owner_headers'])
    success = res.status_code == 200 and res.json()['success'] is True
    print_test_result("DELETE - 1: Happy Path", success, res)
    assert success

    res_404 = requests.delete(f"{category_url}/{category_id}", headers=category_ctx['owner_headers'])
    success_404 = res_404.status_code == 404 and res_404.json()['error']['code'] == 'NOT_FOUND'
    print_test_result("DELETE - 2: Logic (Not Found)", success_404, res_404)
    assert success_404
