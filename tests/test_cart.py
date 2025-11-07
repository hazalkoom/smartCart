import requests
import pytest
import time
from test_config import BASE_URL, OWNER_LOGIN, print_test_result, shared_data

cart_url = f"{BASE_URL}/cart"
product_url = f"{BASE_URL}/products"
category_url = f"{BASE_URL}/categories"
owner_headers = {}

# --- Helper Test (Order 27) ---

@pytest.mark.run(order=27)
def test_cart_setup():
    # 1. Log in as owner
    global owner_headers
    res_login = requests.post(f"{BASE_URL}/auth/login", json=OWNER_LOGIN)
    assert res_login.status_code == 200, "Cart setup failed: could not log in as owner"
    owner_token = res_login.json()['data']['token']
    owner_headers = {"Authorization": f"Bearer {owner_token}"}
    shared_data['owner_token'] = owner_token
    
    # 2. Create a temporary Category
    cat_name = f"Cart Test Cat {int(time.time())}"
    res_cat = requests.post(category_url, json={"name": cat_name}, headers=owner_headers)
    assert res_cat.status_code == 201, "Cart setup failed: could not create category"
    category_id = res_cat.json()['data']['_id']
    shared_data['cart_test_category_id'] = category_id

    # 3. Create a temporary Product (with stock)
    prod_sku = f"CART-TEST-{int(time.time())}"
    # --- THIS IS THE FIX ---
    # Make the name unique to ensure the slug is unique
    prod_name = f"Cart Test Product {int(time.time())}" 
    # --- END OF FIX ---

    product_data = {
        "name": prod_name, # Use the unique name
        "price": 10.50, 
        "sku": prod_sku, 
        "stock": 50,
        "categoryId": category_id, 
        "description": "A product for cart testing"
    }
    res_prod = requests.post(product_url, json=product_data, headers=owner_headers)
    
    assert res_prod.status_code == 201, f"Cart setup failed: could not create product. Server said: {res_prod.json()}"
    
    # 4. Save product ID and stock for other tests
    shared_data['cart_product_id'] = res_prod.json()['data']['_id']
    shared_data['cart_product_stock'] = 50
    shared_data['cart_product_price'] = 10.50
# --- 2. Cart (GET) Tests ---

@pytest.mark.run(order=28)
def test_get_empty_cart():
    res = requests.get(cart_url, headers=owner_headers)
    assert res.status_code == 200
    assert res.json()['data']['items'] == []
    assert res.json()['data']['subtotal'] == 0

# --- 3. Add Item (POST) Tests ---

@pytest.mark.run(order=29)
def test_add_item_validation_fails():
    # Scenario 1: Missing ProductID
    res = requests.post(f"{cart_url}/items", json={"quantity": 1}, headers=owner_headers)
    assert res.status_code == 400
    assert "Product ID is required" in res.json()['error']['message']
    
    # Scenario 2: Bad Quantity
    res = requests.post(f"{cart_url}/items", json={"productId": "123", "quantity": 0}, headers=owner_headers)
    assert res.status_code == 400
    assert "positive integer" in res.json()['error']['message']

@pytest.mark.run(order=29)
def test_add_item_product_not_found():
    fake_id = "605d5b1d9c3e1a001f7b8b1a"
    res = requests.post(f"{cart_url}/items", json={"productId": fake_id, "quantity": 1}, headers=owner_headers)
    assert res.status_code == 404
    assert res.json()['error']['message'] == "Product not found"

@pytest.mark.run(order=30)
def test_add_item_happy_path():
    product_id = shared_data['cart_product_id']
    res = requests.post(f"{cart_url}/items", json={"productId": product_id, "quantity": 2}, headers=owner_headers)
    assert res.status_code == 200
    data = res.json()['data']
    assert len(data['items']) == 1
    assert data['items'][0]['quantity'] == 2
    assert data['subtotal'] == shared_data['cart_product_price'] * 2
    
    # Save the cart's item_id for later tests
    shared_data['cart_item_id'] = data['items'][0]['_id']

@pytest.mark.run(order=31)
def test_add_item_insufficient_stock():
    product_id = shared_data['cart_product_id']
    stock = shared_data['cart_product_stock'] # This is 50
    res = requests.post(f"{cart_url}/items", json={"productId": product_id, "quantity": stock + 100}, headers=owner_headers)
    assert res.status_code == 400
    assert "Insufficient stock" in res.json()['error']['message']

@pytest.mark.run(order=32)
def test_add_item_again_updates_quantity():
    product_id = shared_data['cart_product_id']
    # We already have 2 in the cart, add 3 more
    res = requests.post(f"{cart_url}/items", json={"productId": product_id, "quantity": 3}, headers=owner_headers)
    assert res.status_code == 200
    data = res.json()['data']
    assert len(data['items']) == 1 # Should not create a new item
    assert data['items'][0]['quantity'] == 5 # 2 + 3 = 5
    assert data['subtotal'] == shared_data['cart_product_price'] * 5

# --- 4. Update Item (PUT) Tests ---

@pytest.mark.run(order=33)
def test_update_item_validation_fails():
    item_id = shared_data['cart_item_id']
    res = requests.put(f"{cart_url}/items/{item_id}", json={"quantity": 0}, headers=owner_headers)
    assert res.status_code == 400
    assert "positive integer" in res.json()['error']['message']

@pytest.mark.run(order=33)
def test_update_item_not_found():
    fake_item_id = "605d5b1d9c3e1a001f7b8b1a"
    res = requests.put(f"{cart_url}/items/{fake_item_id}", json={"quantity": 10}, headers=owner_headers)
    assert res.status_code == 404
    assert res.json()['error']['message'] == "Item not found in cart"

@pytest.mark.run(order=34)
def test_update_item_insufficient_stock():
    item_id = shared_data['cart_item_id']
    stock = shared_data['cart_product_stock'] # This is 50
    res = requests.put(f"{cart_url}/items/{item_id}", json={"quantity": stock + 100}, headers=owner_headers)
    assert res.status_code == 400
    assert "Insufficient stock" in res.json()['error']['message']

@pytest.mark.run(order=35)
def test_update_item_happy_path():
    item_id = shared_data['cart_item_id']
    res = requests.put(f"{cart_url}/items/{item_id}", json={"quantity": 10}, headers=owner_headers)
    assert res.status_code == 200
    data = res.json()['data']
    assert data['items'][0]['quantity'] == 10
    assert data['subtotal'] == shared_data['cart_product_price'] * 10

# --- 5. Remove Item (DELETE) Tests ---

@pytest.mark.run(order=36)
def test_remove_item_not_found():
    fake_item_id = "605d5b1d9c3e1a001f7b8b1a"
    res = requests.delete(f"{cart_url}/items/{fake_item_id}", headers=owner_headers)
    assert res.status_code == 404
    assert res.json()['error']['message'] == "Item not found in cart"

@pytest.mark.run(order=37)
def test_remove_item_happy_path():
    item_id = shared_data['cart_item_id']
    res = requests.delete(f"{cart_url}/items/{item_id}", headers=owner_headers)
    assert res.status_code == 200
    assert len(res.json()['data']['items']) == 0
    assert res.json()['data']['subtotal'] == 0

# --- 6. Clear Cart (DELETE) Test ---

@pytest.mark.run(order=38)
def test_clear_cart():
    # First, add an item back
    product_id = shared_data['cart_product_id']
    res_add = requests.post(f"{cart_url}/items", json={"productId": product_id, "quantity": 1}, headers=owner_headers)
    assert res_add.status_code == 200
    assert len(res_add.json()['data']['items']) == 1

    # Now, clear the cart
    res_clear = requests.delete(cart_url, headers=owner_headers)
    assert res_clear.status_code == 200
    assert len(res_clear.json()['data']['items']) == 0
    assert res_clear.json()['data']['subtotal'] == 0

# --- 7. Security & Cleanup Tests ---

@pytest.mark.run(order=39)
def test_cart_security_no_token():
    res = requests.get(cart_url) # No headers
    assert res.status_code == 401
    assert res.json()['error']['code'] == 'TOKEN_MISSING'

@pytest.mark.run(order=40)
def test_cart_cleanup():
    # Clean up the product and category we made for this test file
    prod_id = shared_data['cart_product_id']
    cat_id = shared_data['cart_test_category_id']
    
    res_prod = requests.delete(f"{product_url}/{prod_id}", headers=owner_headers)
    assert res_prod.status_code == 200
    
    res_cat = requests.delete(f"{category_url}/{cat_id}", headers=owner_headers)
    assert res_cat.status_code == 200
    print("\nCart tests cleaned up temporary product and category.")