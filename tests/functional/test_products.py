import requests
import pytest
import time
import uuid
from tests.test_config import BASE_URL, OWNER_LOGIN, print_test_result, shared_data

product_url = f"{BASE_URL}/products"
category_url = f"{BASE_URL}/categories" 
owner_headers = {}
temp_customer_headers = {}

# --- Helper: Unique Generator ---
def get_unique_id():
    return uuid.uuid4().hex[:8]

# --- Helper Tests ---
@pytest.mark.run(order=22)
def test_product_setup_get_owner_token():
    global owner_headers
    if not shared_data.get('owner_token'):
        res = requests.post(f"{BASE_URL}/auth/login", json=OWNER_LOGIN)
        assert res.status_code == 200, f"Owner login failed: {res.text}"
        shared_data['owner_token'] = res.json()['data']['token']
    
    owner_headers = {"Authorization": f"Bearer {shared_data['owner_token']}"}
    print("Product tests are using the Owner token.")

@pytest.mark.run(order=23)
def test_product_setup_get_customer_token():
    global temp_customer_headers
    customer_email = f"cust_prod_{get_unique_id()}@example.com"
    register_payload = { "email": customer_email, "password": "password123", "firstName": "Product", "lastName": "Tester" }
    
    requests.post(f"{BASE_URL}/auth/register", json=register_payload)
    
    res_login = requests.post(f"{BASE_URL}/auth/login", json={"email": customer_email, "password": "password123"})
    assert res_login.status_code == 200
    
    customer_token = res_login.json()['data']['token']
    temp_customer_headers = {"Authorization": f"Bearer {customer_token}"}
    print("Product tests created a temporary customer.")

@pytest.mark.run(order=24)
def test_product_setup_create_category():
    category_name = f"Test Product Category {get_unique_id()}"
    res = requests.post(category_url, json={"name": category_name}, headers=owner_headers)
    assert res.status_code == 201, f"Failed to create category. Response: {res.text}"
    
    shared_data['product_test_category_id'] = res.json()['data']['_id']
    print(f"Product tests created category: {category_name}")

# --- 2. Security Tests ---

@pytest.mark.run(order=25)
def test_product_security_post_no_token():
    res = requests.post(product_url, json={})
    assert res.status_code == 401 and res.json()['error']['code'] == 'TOKEN_MISSING'

@pytest.mark.run(order=25)
def test_product_security_post_customer_token():
    res = requests.post(product_url, json={}, headers=temp_customer_headers)
    assert res.status_code == 403 and res.json()['error']['code'] == 'FORBIDDEN'

@pytest.mark.run(order=25)
def test_product_security_put_no_token():
    res = requests.put(f"{product_url}/fake-id", json={})
    assert res.status_code == 401 and res.json()['error']['code'] == 'TOKEN_MISSING'

@pytest.mark.run(order=25)
def test_product_security_put_customer_token():
    res = requests.put(f"{product_url}/fake-id", json={}, headers=temp_customer_headers)
    assert res.status_code == 403 and res.json()['error']['code'] == 'FORBIDDEN'

@pytest.mark.run(order=25)
def test_product_security_delete_no_token():
    res = requests.delete(f"{product_url}/fake-id")
    assert res.status_code == 401 and res.json()['error']['code'] == 'TOKEN_MISSING'

@pytest.mark.run(order=25)
def test_product_security_delete_customer_token():
    res = requests.delete(f"{product_url}/fake-id", headers=temp_customer_headers)
    assert res.status_code == 403 and res.json()['error']['code'] == 'FORBIDDEN'

# --- 3. Validation Tests ---

@pytest.mark.run(order=26)
def test_create_product_validation_missing_fields():
    res = requests.post(product_url, json={}, headers=owner_headers)
    assert res.status_code == 400
    msg = res.json()['error']['message']
    assert "name" in msg.lower() or "price" in msg.lower()

@pytest.mark.run(order=26)
def test_create_product_validation_bad_data():
    res = requests.post(product_url, json={
        "name": "Test", "description": "Test", "price": -10,
        "sku": "BAD", "stock": "fifty", "categoryId": "123"
    }, headers=owner_headers)
    assert res.status_code == 400
    
    msg = res.json()['error']['message']
    assert "Price must be a positive number" in msg
    assert "Stock must be a positive integer" in msg

@pytest.mark.run(order=26)
def test_update_product_validation_bad_data():
    res = requests.put(f"{product_url}/fake-id", json={"price": -99, "stock": "not-a-number"}, headers=owner_headers)
    assert res.status_code == 400
    msg = res.json()['error']['message']
    assert "Price must be a positive number" in msg
    assert "Stock must be a positive integer" in msg

# --- 4. Logic Tests ---

@pytest.mark.run(order=27)
def test_create_product_logic_bad_category():
    res = requests.post(product_url, json={
        "name": "Test", "description": "Test", "price": 100,
        "sku": f"SKU-404-{get_unique_id()}", "stock": 10, "categoryId": "605d5b1d9c3e1a001f7b8b1a"
    }, headers=owner_headers)
    assert res.status_code == 404
    assert res.json()['error']['message'] == 'Category not found'

@pytest.mark.run(order=28)
def test_create_product_happy_path():
    assert 'product_test_category_id' in shared_data
    
    unique_sku = f"SG-LAP-{get_unique_id()}"
    unique_name = f"SuperGamer Laptop {get_unique_id()}"
    
    product_data = {
        "name": unique_name,
        "description": "A high-end gaming laptop.",
        "price": 1499.99,
        "sku": unique_sku,
        "stock": 50,
        "categoryId": shared_data['product_test_category_id']
    }
    res = requests.post(product_url, json=product_data, headers=owner_headers)
    assert res.status_code == 201, f"Create failed. Response: {res.text}"
    
    shared_data['product_id'] = res.json()['data']['_id']
    shared_data['product_slug'] = res.json()['data']['slug']
    shared_data['product_sku'] = unique_sku 

@pytest.mark.run(order=29)
def test_create_product_logic_duplicate_sku():
    product_data = {
        "name": "CopyCat", "description": "Desc", "price": 999,
        "sku": shared_data['product_sku'],
        "stock": 10, "categoryId": shared_data['product_test_category_id']
    }
    res = requests.post(product_url, json=product_data, headers=owner_headers)
    assert res.status_code == 400
    msg = res.json()['error']['message']
    assert "SKU already exists" in msg or "duplicate key" in msg

# --- 5. Read Tests ---

@pytest.mark.run(order=30)
def test_get_all_products_public():
    res = requests.get(product_url)
    assert res.status_code == 200
    my_id = shared_data['product_id']
    found = any(p['_id'] == my_id for p in res.json()['data'])
    assert found, f"Created product {my_id} not found in getAll list"


@pytest.mark.run(order=30.1)
def test_get_products_pagination():
    """
    Gap Analysis Test: Verify pagination parameters work correctly.
    """
    # Test with page and limit
    res = requests.get(f"{product_url}?page=1&limit=5")
    assert res.status_code == 200
    
    data = res.json()
    
    # Should return at most 5 products
    products = data.get('data', [])
    assert len(products) <= 5, f"Expected at most 5 products, got {len(products)}"
    
    # Check if pagination info is in response (depends on implementation)
    # Common patterns: pagination object, count, total, page info
    has_pagination = (
        'pagination' in data or 
        'count' in data or 
        'total' in data or 
        'totalPages' in data
    )
    
    # Test page 2 (may be empty if not enough products)
    res_page2 = requests.get(f"{product_url}?page=2&limit=5")
    assert res_page2.status_code == 200


@pytest.mark.run(order=30)
def test_get_single_product_public_happy_path():
    slug = shared_data['product_slug']
    res = requests.get(f"{product_url}/{slug}")
    assert res.status_code == 200
    assert res.json()['data']['slug'] == slug

@pytest.mark.run(order=30)
def test_get_single_product_public_not_found():
    res = requests.get(f"{product_url}/does-not-exist-{get_unique_id()}")
    assert res.status_code == 404

# --- 6. Update Tests ---

@pytest.mark.run(order=31)
def test_update_product_logic_not_found():
    fake_id = "605d5b1d9c3e1a001f7b8b1a"
    res = requests.put(f"{product_url}/{fake_id}", json={}, headers=owner_headers)
    assert res.status_code == 404
    assert res.json()['error']['message'] == 'Product not found'

@pytest.mark.run(order=32)
def test_update_product_logic_duplicate_sku():
    sku_b = f"SKU-SECOND-{get_unique_id()}"
    product_b_data = {
        "name": f"Second Laptop {get_unique_id()}",
        "price": 100, 
        "sku": sku_b, 
        "stock": 10,
        "categoryId": shared_data['product_test_category_id'], 
        "description": "desc"
    }
    res_create = requests.post(product_url, json=product_b_data, headers=owner_headers)
    assert res_create.status_code == 201
    
    product_id_a = shared_data['product_id']
    
    res_update = requests.put(f"{product_url}/{product_id_a}", json={"sku": sku_b}, headers=owner_headers)
    assert res_update.status_code == 400
    assert "SKU already exists" in res_update.json()['error']['message']

@pytest.mark.run(order=33)
def test_update_product_happy_path():
    product_id = shared_data['product_id']
    new_name = f"SuperGamer Laptop v2 {get_unique_id()}"
    
    # We do NOT send costPrice here to ensure the backend preserves it correctly
    update_data = {"name": new_name, "price": 1599.99}
    
    res = requests.put(f"{product_url}/{product_id}", json=update_data, headers=owner_headers)
    
    # Prints detailed error if backend fails (e.g. Cost price required)
    assert res.status_code == 200, f"Update Failed! Server Response: {res.text}"
    
    assert res.json()['data']['name'] == new_name
    assert res.json()['data']['price'] == 1599.99

# --- 7. Delete Tests ---

@pytest.mark.run(order=34)
def test_delete_product_happy_path():
    product_id = shared_data['product_id']
    res = requests.delete(f"{product_url}/{product_id}", headers=owner_headers)
    assert res.status_code == 200
    assert res.json().get('success') == True or 'trash' in res.json().get('message', '')

@pytest.mark.run(order=35)
def test_delete_product_logic_not_found():
    product_id = shared_data['product_id']
    res = requests.delete(f"{product_url}/{product_id}", headers=owner_headers)
    # The product was soft-deleted in the previous test, so it should either
    # return 404 (not found) or 200 with a 'already deleted' idempotent response.
    # We assert 404 specifically — a second delete of a trashed product should fail.
    assert res.status_code == 404, f"Expected 404 for double-delete, got {res.status_code}: {res.text}"

@pytest.mark.run(order=36)
def test_product_cleanup_category():
    category_id = shared_data['product_test_category_id']
    res = requests.delete(f"{category_url}/{category_id}", headers=owner_headers)
    assert res.status_code == 200