import requests
import pytest
import uuid
from tests.test_config import BASE_URL, OWNER_LOGIN

auth_url = f"{BASE_URL}/auth"
product_url = f"{BASE_URL}/products"
category_url = f"{BASE_URL}/categories"

shared_profile_data = {}

def get_unique_id():
    return uuid.uuid4().hex[:8]

@pytest.mark.run(order=4.5)
def test_profile_setup():
    print("\n--- 🧪 Setup Profile (Wishlist/Address) Tests ---")
    
    # 1. Create a fresh user
    email = f"profile_{get_unique_id()}@test.com"
    requests.post(f"{auth_url}/register", json={
        "email": email, "password": "password123", "firstName": "Pro", "lastName": "File"
    })
    res_login = requests.post(f"{auth_url}/login", json={"email": email, "password": "password123"})
    assert res_login.status_code == 200
    shared_profile_data['user_header'] = {"Authorization": f"Bearer {res_login.json()['data']['token']}"}

    # 2. Login Owner to create a product for wishlist
    res_owner = requests.post(f"{auth_url}/login", json=OWNER_LOGIN)
    owner_header = {"Authorization": f"Bearer {res_owner.json()['data']['token']}"}

    # 3. Create Category & Product
    res_cat = requests.post(category_url, json={"name": f"ProfCat_{get_unique_id()}"}, headers=owner_header)
    cat_id = res_cat.json()['data']['_id']

    res_prod = requests.post(product_url, json={
        "name": f"ProfProd_{get_unique_id()}", "price": 100, "sku": f"PROF-{get_unique_id()}",
        "stock": 10, "categoryId": cat_id, "description": "For wishlist"
    }, headers=owner_header)
    
    assert res_prod.status_code == 201
    shared_profile_data['product_id'] = res_prod.json()['data']['_id']

@pytest.mark.run(order=4.6)
def test_add_address():
    headers = shared_profile_data['user_header']
    payload = {
        "alias": "Home", "street": "123 Test St", "city": "Cairo",
        "postalCode": "12345", "country": "Egypt", "isDefault": True
    }
    res = requests.post(f"{auth_url}/addresses", json=payload, headers=headers)
    assert res.status_code == 201
    
    # Save address ID
    addresses = res.json()['data']
    shared_profile_data['address_id'] = addresses[-1]['_id']

@pytest.mark.run(order=4.7)
def test_delete_address():
    headers = shared_profile_data['user_header']
    addr_id = shared_profile_data['address_id']
    res = requests.delete(f"{auth_url}/addresses/{addr_id}", headers=headers)
    assert res.status_code == 200
    
    # Verify it is gone
    assert len(res.json()['data']) == 0

@pytest.mark.run(order=4.8)
def test_toggle_wishlist_add():
    headers = shared_profile_data['user_header']
    prod_id = shared_profile_data['product_id']
    res = requests.post(f"{auth_url}/wishlist", json={"productId": prod_id}, headers=headers)
    
    assert res.status_code == 200
    assert prod_id in res.json()['data']

@pytest.mark.run(order=4.9)
def test_get_wishlist_populated():
    headers = shared_profile_data['user_header']
    res = requests.get(f"{auth_url}/wishlist", headers=headers)
    
    assert res.status_code == 200
    items = res.json()['data']
    assert len(items) == 1
    
    # Check if populated (should have 'name' property, not just ID string)
    assert 'name' in items[0]

@pytest.mark.run(order=4.91)
def test_toggle_wishlist_remove():
    headers = shared_profile_data['user_header']
    prod_id = shared_profile_data['product_id']
    
    # Sending it a second time should remove it
    res = requests.post(f"{auth_url}/wishlist", json={"productId": prod_id}, headers=headers)
    assert res.status_code == 200
    assert prod_id not in res.json()['data']