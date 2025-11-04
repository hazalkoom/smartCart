import requests
import pytest
import time
from test_config import BASE_URL, OWNER_LOGIN, print_test_result, shared_data

category_url = f"{BASE_URL}/categories"
owner_headers = {}

@pytest.mark.run(order=4)
def test_get_owner_token():
    global owner_headers
    
    res = requests.post(f"{BASE_URL}/auth/login", json=OWNER_LOGIN)
    
    success = res.status_code == 200 and 'data' in res.json() and 'token' in res.json()['data']
    if success:
        owner_token = res.json()['data']['token']
        owner_headers = {"Authorization": f"Bearer {owner_token}"}
        shared_data['owner_token'] = owner_token
    
    print_test_result("Category - 0: Get Owner Token", success, res)
    assert success, "Could not get owner token. Did you create 'owner@test.com' in MongoDB?"


@pytest.mark.run(order=5)
def test_get_all_categories_public():
    res = requests.get(category_url)
    success = res.status_code == 200 and 'count' in res.json()
    print_test_result("GET - 1: Get All (Public)", success, res)
    assert success

@pytest.mark.run(order=6)
def test_category_security_no_token():
    res = requests.post(category_url, json={"name": "No Token Test"})
    success = res.status_code == 401 and res.json()['error']['code'] == 'TOKEN_MISSING'
    print_test_result("Security - 1: POST without token (401)", success, res)
    assert success

@pytest.mark.run(order=7)
def test_category_security_customer_role():
    customer_email = f"customer-{int(time.time())}@example.com"
    
    register_payload = {
        "email": customer_email, 
        "password": "password123", 
        "firstName": "Temp",
        "lastName": "Customer"
    }
    res_register = requests.post(f"{BASE_URL}/auth/register", json=register_payload)

    assert res_register.status_code == 201, "Failed to register temporary customer"
    
    res_login = requests.post(f"{BASE_URL}/auth/login", json={
        "email": customer_email, "password": "password123"
    })
    
    assert res_login.status_code == 200 and 'data' in res_login.json(), "Login failed"
    customer_token = res_login.json()['data']['token']
    customer_headers = {"Authorization": f"Bearer {customer_token}"}
    
    res = requests.post(category_url, json={"name": "Customer Test"}, headers=customer_headers)
    success = res.status_code == 403 and res.json()['error']['code'] == 'FORBIDDEN'
    print_test_result("Security - 2: POST with Customer token (403)", success, res)
    assert success

@pytest.mark.run(order=8)
def test_create_category_validation():
    # Scenario 1: Missing name
    res_missing = requests.post(category_url, json={"name": ""}, headers=owner_headers)
    success_missing = res_missing.status_code == 400 and "name is required" in res_missing.json()['error']['message']
    print_test_result("POST - 1: Validation (Missing Name)", success_missing, res_missing)
    assert success_missing
    
    # Scenario 2: Long name
    long_name = "a" * 51
    res_long = requests.post(category_url, json={"name": long_name}, headers=owner_headers)
    success_long = res_long.status_code == 400 and "more than 50" in res_long.json()['error']['message']
    print_test_result("POST - 2: Validation (Long Name)", success_long, res_long)
    assert success_long

@pytest.mark.run(order=9)
def test_create_category_logic():
    # Scenario 1: Happy Path
    category_data = {"name": "Test Electronics", "description": "A test category"}
    res = requests.post(category_url, json=category_data, headers=owner_headers)
    success = res.status_code == 201 and res.json()['data']['name'] == "Test Electronics"
    print_test_result("POST - 3: Happy Path (Create)", success, res)
    assert success
    
    # Save the new ID and slug for later tests
    shared_data['category_id'] = res.json()['data']['_id']
    shared_data['category_slug'] = res.json()['data']['slug']

    # Scenario 2: Duplicate Name
    res_dup = requests.post(category_url, json=category_data, headers=owner_headers)
    success_dup = res_dup.status_code == 400 and "already exists" in res_dup.json()['error']['message']
    print_test_result("POST - 4: Logic (Duplicate Name)", success_dup, res_dup)
    assert success_dup

@pytest.mark.run(order=10)
def test_get_single_category_public():
    slug = shared_data.get('category_slug')
    assert slug, "Create test failed, no slug to test GET"
    
    # Scenario 1: Happy Path
    res = requests.get(f"{category_url}/{slug}")
    success = res.status_code == 200 and res.json()['data']['slug'] == slug
    print_test_result("GET - 2: Get Single (Happy Path)", success, res)
    assert success
    
    # Scenario 2: Not Found
    res_404 = requests.get(f"{category_url}/does-not-exist")
    success_404 = res_404.status_code == 404 and res_404.json()['error']['code'] == 'NOT_FOUND'
    print_test_result("GET - 3: Get Single (Not Found)", success_404, res_404)
    assert success_404

@pytest.mark.run(order=11)
def test_update_category_logic():
    category_id = shared_data.get('category_id')
    assert category_id, "Create test failed, no ID to test PUT"
    
    # Scenario 1: Happy Path
    update_data = {"name": "Test Gadgets", "description": "Updated desc"}
    res = requests.put(f"{category_url}/{category_id}", json=update_data, headers=owner_headers)
    success = res.status_code == 200 and res.json()['data']['name'] == "Test Gadgets"
    print_test_result("PUT - 1: Happy Path (Update)", success, res)
    assert success
    
    # Scenario 2: Not Found
    fake_id = "605d5b1d9c3e1a001f7b8b1a"
    res_404 = requests.put(f"{category_url}/{fake_id}", json=update_data, headers=owner_headers)
    success_404 = res_404.status_code == 404 and res_404.json()['error']['code'] == 'NOT_FOUND'
    print_test_result("PUT - 2: Logic (Not Found)", success_404, res_404)
    assert success_404

@pytest.mark.run(order=12)
def test_delete_category():
    category_id = shared_data.get('category_id')
    assert category_id, "Create test failed, no ID to test DELETE"
    
    # Scenario 1: Happy Path
    res = requests.delete(f"{category_url}/{category_id}", headers=owner_headers)
    success = res.status_code == 200 and res.json()['success'] == True
    print_test_result("DELETE - 1: Happy Path", success, res)
    assert success
    
    # Scenario 2: Not Found (deleting the same ID again)
    res_404 = requests.delete(f"{category_url}/{category_id}", headers=owner_headers)
    success_404 = res_404.status_code == 404 and res_404.json()['error']['code'] == 'NOT_FOUND'
    print_test_result("DELETE - 2: Logic (Not Found)", success_404, res_404)
    assert success_404