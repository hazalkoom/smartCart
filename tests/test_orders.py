import requests
import pytest
import time
from test_config import BASE_URL, OWNER_LOGIN, print_test_result, shared_data

order_url = f"{BASE_URL}/orders"
product_url = f"{BASE_URL}/products"
category_url = f"{BASE_URL}/categories"
cart_url = f"{BASE_URL}/cart"

owner_headers = {}
customer_headers = {} # For our new order customer

# --- Helper Tests (Setup) ---

@pytest.mark.run(order=41)
def test_order_setup_login_and_create_product():
    global owner_headers
    # 1. Log in as owner
    res_login = requests.post(f"{BASE_URL}/auth/login", json=OWNER_LOGIN)
    assert res_login.status_code == 200, "Order setup failed: could not log in as owner"
    owner_token = res_login.json()['data']['token']
    owner_headers = {"Authorization": f"Bearer {owner_token}"}
    shared_data['owner_token'] = owner_token
    
    # 2. Create a temporary Category
    cat_name = f"Order Test Cat {int(time.time())}"
    res_cat = requests.post(category_url, json={"name": cat_name}, headers=owner_headers)
    assert res_cat.status_code == 201
    category_id = res_cat.json()['data']['_id']
    shared_data['order_test_category_id'] = category_id

    # 3. Create a temporary Product (with stock 10)
    prod_sku = f"ORDER-TEST-{int(time.time())}"
    prod_name = f"Order Test Product {int(time.time())}"
    product_data = {
        "name": prod_name, "price": 20.00, "sku": prod_sku, "stock": 10,
        "categoryId": category_id, "description": "A product for order testing"
    }
    res_prod = requests.post(product_url, json=product_data, headers=owner_headers)
    assert res_prod.status_code == 201
    
    shared_data['order_product_id'] = res_prod.json()['data']['_id']
    shared_data['order_product_slug'] = res_prod.json()['data']['slug']
    shared_data['order_product_stock'] = 10
    print("Order tests created a temporary product and category.")

@pytest.mark.run(order=42)
def test_order_setup_create_customer():
    global customer_headers
    customer_email = f"order_customer_{int(time.time())}@example.com"
    register_payload = {
        "email": customer_email, "password": "password123", 
        "firstName": "Order", "lastName": "Customer"
    }
    res_register = requests.post(f"{BASE_URL}/auth/register", json=register_payload)
    assert res_register.status_code == 201
    
    res_login = requests.post(f"{BASE_URL}/auth/login", json={"email": customer_email, "password": "password123"})
    assert res_login.status_code == 200
    
    customer_token = res_login.json()['data']['token']
    customer_headers = {"Authorization": f"Bearer {customer_token}"}
    print("Order tests created a temporary customer.")

# --- 2. Customer Flow: Add to Cart ---

@pytest.mark.run(order=43)
def test_order_customer_adds_to_cart():
    product_id = shared_data['order_product_id']
    res = requests.post(f"{cart_url}/items", json={"productId": product_id, "quantity": 3}, headers=customer_headers)
    assert res.status_code == 200
    assert len(res.json()['data']['items']) == 1
    assert res.json()['data']['items'][0]['quantity'] == 3

# --- 3. Customer Flow: Create Order ---

@pytest.mark.run(order=44)
def test_create_order_validation_fails():
    # Scenario 1: Missing shippingAddress
    res = requests.post(order_url, json={}, headers=customer_headers)
    assert res.status_code == 400
    assert res.json()['error']['code'] == 'VALIDATION_ERROR'
    assert "Shipping address is required" in res.json()['error']['message']
    
    # Scenario 2: Missing street
    bad_address = {"city": "Cairo", "country": "Egypt"}
    res_street = requests.post(order_url, json={"shippingAddress": bad_address}, headers=customer_headers)
    assert res_street.status_code == 400
    assert "Street is required" in res_street.json()['error']['message']

@pytest.mark.run(order=45)
def test_create_order_happy_path():
    address = {"street": "123 Test St", "city": "Cairo", "country": "Egypt"}
    res = requests.post(order_url, json={"shippingAddress": address}, headers=customer_headers)
    assert res.status_code == 201
    assert res.json()['data']['status'] == 'Pending'
    assert res.json()['data']['items'][0]['quantity'] == 3
    assert res.json()['data']['shippingAddress']['city'] == "Cairo"
    
    # Save the order ID for later tests
    shared_data['order_id'] = res.json()['data']['_id']

# --- 4. Verify Post-Order State ---

@pytest.mark.run(order=46)
def test_verify_cart_is_cleared():
    res = requests.get(cart_url, headers=customer_headers)
    assert res.status_code == 200
    assert len(res.json()['data']['items']) == 0
    assert res.json()['data']['subtotal'] == 0

@pytest.mark.run(order=46)
def test_verify_stock_is_reduced():
    slug = shared_data['order_product_slug']
    res = requests.get(f"{product_url}/{slug}") # Public route
    assert res.status_code == 200
    
    original_stock = shared_data['order_product_stock'] # 10
    expected_stock = original_stock - 3 # 7
    assert res.json()['data']['stock'] == expected_stock

@pytest.mark.run(order=46)
def test_create_order_fails_if_cart_empty():
    address = {"street": "123 Test St", "city": "Cairo", "country": "Egypt"}
    res = requests.post(order_url, json={"shippingAddress": address}, headers=customer_headers)
    assert res.status_code == 400
    assert res.json()['error']['code'] == 'CART_EMPTY'

# --- 5. Customer Read Tests ---

@pytest.mark.run(order=47)
def test_customer_get_my_orders():
    res = requests.get(f"{order_url}/my", headers=customer_headers)
    assert res.status_code == 200
    assert res.json()['count'] == 1
    assert res.json()['data'][0]['_id'] == shared_data['order_id']

@pytest.mark.run(order=47)
def test_customer_get_order_by_id_success():
    order_id = shared_data['order_id']
    res = requests.get(f"{order_url}/{order_id}", headers=customer_headers)
    assert res.status_code == 200
    assert res.json()['data']['_id'] == order_id

@pytest.mark.run(order=47)
def test_customer_get_order_by_id_fails_for_other_order():
    fake_id = "605d5b1d9c3e1a001f7b8b1a"
    res = requests.get(f"{order_url}/{fake_id}", headers=customer_headers)
    assert res.status_code == 404
    assert res.json()['error']['code'] == 'NOT_FOUND'

# --- 6. Admin Read/Update Tests ---

@pytest.mark.run(order=48)
def test_admin_get_all_orders():
    res = requests.get(order_url, headers=owner_headers)
    assert res.status_code == 200
    assert res.json()['count'] >= 1
    
@pytest.mark.run(order=48)
def test_admin_get_customer_order_by_id():
    order_id = shared_data['order_id']
    res = requests.get(f"{order_url}/{order_id}", headers=owner_headers)
    assert res.status_code == 200
    assert res.json()['data']['_id'] == order_id

@pytest.mark.run(order=48)
def test_admin_update_status_validation_fails():
    order_id = shared_data['order_id']
    res = requests.patch(f"{order_url}/{order_id}/status", json={"status": "InvalidStatus"}, headers=owner_headers)
    assert res.status_code == 400
    assert res.json()['error']['code'] == 'VALIDATION_ERROR'

@pytest.mark.run(order=48)
def test_admin_update_status_happy_path():
    order_id = shared_data['order_id']
    res = requests.patch(f"{order_url}/{order_id}/status", json={"status": "Shipped"}, headers=owner_headers)
    assert res.status_code == 200
    assert res.json()['data']['status'] == "Shipped"
    assert "shippedAt" in res.json()['data']

# --- 7. Final Security & Cleanup ---

@pytest.mark.run(order=49)
def test_order_security_admin_routes_fail_for_customer():
    order_id = shared_data['order_id']
    # Try to get ALL orders as a customer
    res_get = requests.get(order_url, headers=customer_headers)
    assert res_get.status_code == 403
    assert res_get.json()['error']['code'] == 'FORBIDDEN'
    
    # Try to update status as a customer
    res_patch = requests.patch(f"{order_url}/{order_id}/status", json={"status": "Delivered"}, headers=customer_headers)
    assert res_patch.status_code == 403
    assert res_patch.json()['error']['code'] == 'FORBIDDEN'

@pytest.mark.run(order=50)
def test_order_cleanup():
    prod_id = shared_data['order_product_id']
    cat_id = shared_data['order_test_category_id']
    
    res_prod = requests.delete(f"{product_url}/{prod_id}", headers=owner_headers)
    assert res_prod.status_code == 200
    
    res_cat = requests.delete(f"{category_url}/{cat_id}", headers=owner_headers)
    assert res_cat.status_code == 200
    print("\nOrder tests cleaned up temporary product and category.")