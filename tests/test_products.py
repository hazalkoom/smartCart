import requests
import pytest
import time
from test_config import BASE_URL, OWNER_LOGIN, print_test_result, shared_data

product_url = f"{BASE_URL}/products"
category_url = f"{BASE_URL}/categories" # We need this to create a category
owner_headers = {}
temp_customer_headers = {}

# --- Helper Tests ---
@pytest.mark.run(order=13)
def test_product_setup_get_owner_token():
    # ... (this test is correct) ...
    global owner_headers
    assert 'owner_token' in shared_data, "Owner token not found. Did test_categories run?"
    owner_headers = {"Authorization": f"Bearer {shared_data['owner_token']}"}
    print("Product tests are using the Owner token.")

@pytest.mark.run(order=14)
def test_product_setup_get_customer_token():
    # ... (this test is correct) ...
    global temp_customer_headers
    customer_email = f"customer_product_test_{int(time.time())}@example.com"
    register_payload = { "email": customer_email, "password": "password123", "firstName": "Product", "lastName": "Tester" }
    res_register = requests.post(f"{BASE_URL}/auth/register", json=register_payload)
    assert res_register.status_code == 201
    res_login = requests.post(f"{BASE_URL}/auth/login", json={"email": customer_email, "password": "password123"})
    assert res_login.status_code == 200
    customer_token = res_login.json()['data']['token']
    temp_customer_headers = {"Authorization": f"Bearer {customer_token}"}
    print("Product tests created a temporary customer.")

# --- START: NEW SETUP TEST (THE CORE FIX) ---
@pytest.mark.run(order=14.5) # Runs right after setup, before other tests
def test_product_setup_create_category():
    """Create a category specifically for product tests."""
    category_name = f"Test Product Category {int(time.time())}"
    res = requests.post(category_url, json={"name": category_name}, headers=owner_headers)
    assert res.status_code == 201, "Failed to create a category for product tests"
    
    # Save this NEW category_id for our product tests
    shared_data['product_test_category_id'] = res.json()['data']['_id']
    print(f"Product tests created category: {category_name}")
# --- END: NEW SETUP TEST ---


# --- 2. Security Tests (401 & 403) ---
# ... (all 6 security tests are correct and will pass) ...
@pytest.mark.run(order=15)
def test_product_security_post_no_token():
    res = requests.post(product_url, json={})
    assert res.status_code == 401 and res.json()['error']['code'] == 'TOKEN_MISSING'

@pytest.mark.run(order=15)
def test_product_security_post_customer_token():
    res = requests.post(product_url, json={}, headers=temp_customer_headers)
    assert res.status_code == 403 and res.json()['error']['code'] == 'FORBIDDEN'

@pytest.mark.run(order=15)
def test_product_security_put_no_token():
    res = requests.put(f"{product_url}/fake-id", json={})
    assert res.status_code == 401 and res.json()['error']['code'] == 'TOKEN_MISSING'

@pytest.mark.run(order=15)
def test_product_security_put_customer_token():
    res = requests.put(f"{product_url}/fake-id", json={}, headers=temp_customer_headers)
    assert res.status_code == 403 and res.json()['error']['code'] == 'FORBIDDEN'

@pytest.mark.run(order=15)
def test_product_security_delete_no_token():
    res = requests.delete(f"{product_url}/fake-id")
    assert res.status_code == 401 and res.json()['error']['code'] == 'TOKEN_MISSING'

@pytest.mark.run(order=15)
def test_product_security_delete_customer_token():
    res = requests.delete(f"{product_url}/fake-id", headers=temp_customer_headers)
    assert res.status_code == 403 and res.json()['error']['code'] == 'FORBIDDEN'

# --- 3. Validation Tests (400) ---
@pytest.mark.run(order=16)
def test_create_product_validation_missing_fields():
    res = requests.post(product_url, json={}, headers=owner_headers)
    assert res.status_code == 400
    assert "Product name is required" in res.json()['error']['message'] # Uppercase 'P'
    assert "Price is required" in res.json()['error']['message'] # Uppercase 'P'

@pytest.mark.run(order=16)
def test_create_product_validation_bad_data():
    res = requests.post(product_url, json={
        "name": "Test", "description": "Test", "price": -10,
        "sku": "BAD", "stock": "fifty", "categoryId": "123"
    }, headers=owner_headers)
    assert res.status_code == 400
    assert "Price must be a positive number" in res.json()['error']['message']
    assert "Stock must be a positive integer" in res.json()['error']['message']
    assert "Invalid Category ID format" in res.json()['error']['message']

@pytest.mark.run(order=16)
def test_update_product_validation_bad_data():
    # This test now correctly uses the optional-field rules
    res = requests.put(f"{product_url}/fake-id", json={"price": -99, "stock": "not-a-number"}, headers=owner_headers)
    assert res.status_code == 400
    assert "Price must be a positive number" in res.json()['error']['message']
    assert "Stock must be a positive integer" in res.json()['error']['message']

# --- 4. Logic Tests (Create, 201, 404, 400) ---
@pytest.mark.run(order=17)
def test_create_product_logic_bad_category():
    res = requests.post(product_url, json={
        "name": "Test", "description": "Test", "price": 100,
        "sku": "SKU-404", "stock": 10, "categoryId": "605d5b1d9c3e1a001f7b8b1a"
    }, headers=owner_headers)
    assert res.status_code == 404
    assert res.json()['error']['message'] == 'Category not found'

@pytest.mark.run(order=18)
def test_create_product_happy_path():
    assert 'product_test_category_id' in shared_data # Check for our NEW category ID
    product_data = {
        "name": "SuperGamer Laptop", "description": "A high-end gaming laptop.",
        "price": 1499.99, "sku": "SG-LAP-1001", "stock": 50,
        "categoryId": shared_data['product_test_category_id'] # Use the NEW ID
    }
    res = requests.post(product_url, json=product_data, headers=owner_headers)
    assert res.status_code == 201
    assert res.json()['data']['name'] == "SuperGamer Laptop"
    
    shared_data['product_id'] = res.json()['data']['_id']
    shared_data['product_slug'] = res.json()['data']['slug']

@pytest.mark.run(order=19)
def test_create_product_logic_duplicate_sku():
    product_data = {
        "name": "Another Laptop", "description": "Another one.", "price": 999,
        "sku": "SG-LAP-1001", # Same SKU
        "stock": 10, "categoryId": shared_data['product_test_category_id']
    }
    res = requests.post(product_url, json=product_data, headers=owner_headers)
    assert res.status_code == 400
    assert "SKU already exists" in res.json()['error']['message']

# --- 5. Read Tests (Public, 200, 404) ---
@pytest.mark.run(order=20)
def test_get_all_products_public():
    res = requests.get(product_url)
    assert res.status_code == 200
    assert res.json()['count'] >= 1
    assert res.json()['data'][0]['name'] == "SuperGamer Laptop"

@pytest.mark.run(order=20)
def test_get_single_product_public_happy_path():
    assert 'product_slug' in shared_data
    slug = shared_data['product_slug']
    res = requests.get(f"{product_url}/{slug}")
    assert res.status_code == 200
    assert res.json()['data']['slug'] == slug

@pytest.mark.run(order=20)
def test_get_single_product_public_not_found():
    res = requests.get(f"{product_url}/does-not-exist")
    assert res.status_code == 404 # This will pass now
    assert res.json()['error']['message'] == 'Product not found'

# --- 6. Update Tests (404, 400, 200) ---
@pytest.mark.run(order=21)
def test_update_product_logic_not_found():
    fake_id = "605d5b1d9c3e1a001f7b8b1a"
    res = requests.put(f"{product_url}/{fake_id}", json={}, headers=owner_headers)
    assert res.status_code == 404 # This will pass now
    assert res.json()['error']['message'] == 'Product not found'

@pytest.mark.run(order=22)
def test_update_product_logic_duplicate_sku():
    unique_sku = f"SKU-SECOND-{int(time.time())}"

    product_data = {
        "name": "Second Laptop", "price": 100, "sku": unique_sku, "stock": 10,
        "categoryId": shared_data['product_test_category_id'], "description": "desc"
    }
    res_create = requests.post(product_url, json=product_data, headers=owner_headers)
    assert res_create.status_code == 201 # This will now pass

    product_id = shared_data['product_id']
    
    # Now we try to update our *first* product to use the *second* product's SKU
    update_data = { "sku": unique_sku } 
    res_update = requests.put(f"{product_url}/{product_id}", json=update_data, headers=owner_headers)
    assert res_update.status_code == 400
    assert "SKU already exists" in res_update.json()['error']['message']

@pytest.mark.run(order=23)
def test_update_product_happy_path():
    product_id = shared_data['product_id']
    update_data = {"name": "SuperGamer Laptop v2", "price": 1599.99}
    res = requests.put(f"{product_url}/{product_id}", json=update_data, headers=owner_headers)
    assert res.status_code == 200
    assert res.json()['data']['name'] == "SuperGamer Laptop v2"
    assert res.json()['data']['price'] == 1599.99

# --- 7. Delete Tests (200, 404) ---
@pytest.mark.run(order=24)
def test_delete_product_happy_path():
    product_id = shared_data['product_id']
    res = requests.delete(f"{product_url}/{product_id}", headers=owner_headers)
    assert res.status_code == 200
    assert res.json()['success'] == True

@pytest.mark.run(order=25)
def test_delete_product_logic_not_found():
    product_id = shared_data['product_id'] # Use the same ID
    res = requests.delete(f"{product_url}/{product_id}", headers=owner_headers)
    assert res.status_code == 404 # This will pass now
    assert res.json()['error']['message'] == 'Product not found'

# --- 8. Cleanup Test ---
@pytest.mark.run(order=26)
def test_product_cleanup_category():
    """Deletes the category we made for this test file."""
    category_id = shared_data['product_test_category_id']
    res = requests.delete(f"{category_url}/{category_id}", headers=owner_headers)
    assert res.status_code == 200
    print(f"Product tests cleaned up category: {category_id}")