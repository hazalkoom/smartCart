import requests
import pytest
import time
import uuid
from tests.test_config import BASE_URL, OWNER_LOGIN, print_test_result, shared_data

# Endpoints
order_url = f"{BASE_URL}/orders"
product_url = f"{BASE_URL}/products"
category_url = f"{BASE_URL}/categories"
cart_url = f"{BASE_URL}/cart"

# Tokens & Headers
owner_headers = {}
user_headers = {}
attacker_headers = {} # For "User B" tests

# --- Helper: Unique Generator ---
def get_unique_id():
    return uuid.uuid4().hex[:8]

# --- 1. SETUP (Order 70) ---
@pytest.mark.run(order=68)
def test_payment_setup():
    """
    Sets up the environment for payment tests:
    1. Login Owner
    2. Create Category & Product
    3. Register/Login Main User
    4. Register/Login Attacker User
    5. Create an Order for Main User
    """
    global owner_headers, user_headers, attacker_headers

    # A. Login Owner
    res_login = requests.post(f"{BASE_URL}/auth/login", json=OWNER_LOGIN)
    assert res_login.status_code == 200, f"Owner login failed: {res_login.text}"
    owner_token = res_login.json()['data']['token']
    owner_headers = {"Authorization": f"Bearer {owner_token}"}
    shared_data['owner_token'] = owner_token

    # B. Create Temp Category (Unique Name)
    cat_name = f"Payment Cat {get_unique_id()}"
    res_cat = requests.post(category_url, json={"name": cat_name}, headers=owner_headers)
    assert res_cat.status_code == 201, f"Cat creation failed: {res_cat.text}"
    category_id = res_cat.json()['data']['_id']
    shared_data['pay_cat_id'] = category_id

    # C. Create Temp Product (Unique SKU)
    prod_data = {
        "name": f"Payment Item {get_unique_id()}", 
        "price": 100.00, 
        "sku": f"PAY-{get_unique_id()}", # Bulletproof SKU
        "stock": 100, 
        "categoryId": category_id, 
        "description": "For payment tests"
    }
    res_prod = requests.post(product_url, json=prod_data, headers=owner_headers)
    assert res_prod.status_code == 201, f"Product creation failed: {res_prod.text}"
    product_id = res_prod.json()['data']['_id']
    shared_data['pay_prod_id'] = product_id

    # D. Setup Main User (The Payer) - Unique Email
    email_main = f"payer_{get_unique_id()}@test.com"
    requests.post(f"{BASE_URL}/auth/register", json={
        "email": email_main, "password": "password123", "firstName": "Payer", "lastName": "Main",
        "mobileNumber": "01000000001" # Valid Phone
    })
    res_main = requests.post(f"{BASE_URL}/auth/login", json={"email": email_main, "password": "password123"})
    assert res_main.status_code == 200, "Main user login failed"
    user_token = res_main.json()['data']['token']
    user_headers = {"Authorization": f"Bearer {user_token}"}
    shared_data['pay_user_headers'] = user_headers

    # E. Setup Attacker User (The Thief) - Unique Email
    email_hack = f"hacker_{get_unique_id()}@test.com"
    requests.post(f"{BASE_URL}/auth/register", json={
        "email": email_hack, "password": "password123", "firstName": "Hacker", "lastName": "Bad"
    })
    res_hack = requests.post(f"{BASE_URL}/auth/login", json={"email": email_hack, "password": "password123"})
    assert res_hack.status_code == 200, "Attacker login failed"
    hack_token = res_hack.json()['data']['token']
    attacker_headers = {"Authorization": f"Bearer {hack_token}"}
    shared_data['pay_attacker_headers'] = attacker_headers

    # F. Create Order for Main User
    # 1. Add to cart
    requests.post(f"{cart_url}/items", json={"productId": product_id, "quantity": 1}, headers=user_headers)
    # 2. Checkout
    res_order = requests.post(order_url, json={
        "shippingAddress": {"street": "123 Pay St", "city": "Cairo", "country": "Egypt"}
    }, headers=user_headers)
    assert res_order.status_code == 201, f"Order creation failed: {res_order.text}"
    order_payload = res_order.json().get('data', {})
    order_obj = order_payload.get('order', order_payload)
    shared_data['pay_order_id'] = order_obj['_id']
    
    print(f"Payment Setup Complete. Order ID: {shared_data['pay_order_id']}")


# --- A. SECURITY & AUTHORIZATION (Order 71) ---
@pytest.mark.run(order=69)
def test_pay_security_401_no_token():
    order_id = shared_data['pay_order_id']
    res = requests.post(f"{order_url}/{order_id}/pay", json={"paymentMethod": "card"})
    assert res.status_code == 401
    assert res.json()['error']['code'] == 'TOKEN_MISSING'

@pytest.mark.run(order=69)
def test_pay_security_403_wrong_user():
    """User B tries to pay for User A's order"""
    order_id = shared_data['pay_order_id']
    headers = shared_data['pay_attacker_headers']
    
    res = requests.post(f"{order_url}/{order_id}/pay", json={"paymentMethod": "card"}, headers=headers)
    assert res.status_code == 403
    # Matches the error thrown in your controller
    assert "not authorized" in res.json()['error']['message'].lower()

@pytest.mark.run(order=69)
def test_pay_security_404_invalid_id():
    headers = shared_data['pay_user_headers']
    # Valid MongoID format but doesn't exist
    fake_id = "605d5b1d9c3e1a001f7b8b1a"
    res = requests.post(f"{order_url}/{fake_id}/pay", json={"paymentMethod": "card"}, headers=headers)
    assert res.status_code == 404
    assert res.json()['error']['code'] == 'NOT_FOUND'


# --- B. INPUT VALIDATION (Order 72) ---
@pytest.mark.run(order=70)
def test_pay_validation_missing_method():
    headers = shared_data['pay_user_headers']
    order_id = shared_data['pay_order_id']
    
    res = requests.post(f"{order_url}/{order_id}/pay", json={}, headers=headers)
    assert res.status_code == 400
    assert "required" in res.json()['error']['message']

@pytest.mark.run(order=70)
def test_pay_validation_invalid_method():
    headers = shared_data['pay_user_headers']
    order_id = shared_data['pay_order_id']
    
    res = requests.post(f"{order_url}/{order_id}/pay", json={"paymentMethod": "bitcoin"}, headers=headers)
    assert res.status_code == 400
    assert "Invalid payment method" in res.json()['error']['message']

@pytest.mark.run(order=70)
def test_pay_validation_wallet_bad_phone_regex():
    headers = shared_data['pay_user_headers']
    order_id = shared_data['pay_order_id']
    
    payload = {"paymentMethod": "wallet", "mobileNumber": "12345"}
    res = requests.post(f"{order_url}/{order_id}/pay", json=payload, headers=headers)
    assert res.status_code == 400
    assert "Invalid Egyptian mobile" in res.json()['error']['message']


# --- C. BUSINESS LOGIC (Order 73) ---
@pytest.mark.run(order=71)
def test_pay_logic_wallet_requirement():
    """
    Test the specific logic: If user has no phone in DB, 
    and sends no phone in body, it should fail.
    We use the 'Attacker' account for this since they have no phone set in setup.
    """
    # 1. Create an order for Attacker first (since they can't pay for Main's order)
    headers = shared_data['pay_attacker_headers']
    
    # Add item
    requests.post(f"{cart_url}/items", json={"productId": shared_data['pay_prod_id'], "quantity": 1}, headers=headers)
    # Create Order
    res_ord = requests.post(order_url, json={"shippingAddress": {"street": "St", "city": "C", "country": "E"}}, headers=headers)
    assert res_ord.status_code == 201, f"Attacker order creation failed: {res_ord.text}"
    attacker_order_payload = res_ord.json().get('data', {})
    attacker_order_obj = attacker_order_payload.get('order', attacker_order_payload)
    attacker_order_id = attacker_order_obj['_id']

    # 2. Try to pay with wallet (No phone in body, No phone in DB)
    res = requests.post(f"{order_url}/{attacker_order_id}/pay", json={"paymentMethod": "wallet"}, headers=headers)
    assert res.status_code == 400
    assert "Mobile number is required" in res.json()['error']['message'] 


# --- D. HAPPY PATHS (Order 74) ---
# NOTE: These tests assume your backend is connected to Paymob Sandbox 
# and the credentials in .env are valid.

@pytest.mark.run(order=72)
def test_pay_happy_card_iframe():
    headers = shared_data['pay_user_headers']
    order_id = shared_data['pay_order_id']
    
    res = requests.post(f"{order_url}/{order_id}/pay", json={"paymentMethod": "card"}, headers=headers)
    
    if res.status_code == 502:
        pytest.skip("Paymob Sandbox unavailable (502)")
    
    assert res.status_code == 200, f"Card Payment Init Failed: {res.text}"
    assert res.json()['data']['action'] == 'iframe'
    assert "accept.paymob.com" in res.json()['data']['url']
    assert "payment_token=" in res.json()['data']['url']

@pytest.mark.run(order=72)
def test_pay_happy_wallet_redirect():
    headers = shared_data['pay_user_headers']
    order_id = shared_data['pay_order_id']
    
    # We send a specific phone number to override the profile one
    payload = {"paymentMethod": "wallet", "mobileNumber": "01010101010"}
    res = requests.post(f"{order_url}/{order_id}/pay", json=payload, headers=headers)

    if res.status_code == 502:
        pytest.skip("Paymob Sandbox unavailable (502)")

    assert res.status_code == 200, f"Wallet Payment Init Failed: {res.text}"
    assert res.json()['data']['action'] == 'redirect'
    assert "accept.paymob" in res.json()['data']['url']

@pytest.mark.run(order=72)
def test_pay_happy_fawry_code():
    headers = shared_data['pay_user_headers']
    order_id = shared_data['pay_order_id']
    
    res = requests.post(f"{order_url}/{order_id}/pay", json={"paymentMethod": "fawry"}, headers=headers)

    if res.status_code == 502:
        pytest.skip("Paymob Sandbox unavailable (502)")

    assert res.status_code == 200, f"Fawry Payment Init Failed: {res.text}"
    assert res.json()['data']['action'] == 'fawry_code'
    # Check if bill_reference exists (it might be int or string)
    assert 'bill_reference' in res.json()['data']


# --- E. STATE & DOUBLE PAYMENT (Order 75) ---
@pytest.mark.run(order=73)
def test_pay_prevent_double_payment():
    """
    Simulate a paid order by manually updating the order status via the admin
    endpoint, then attempt to pay again — expect 400 'Order is already paid'.
    """
    headers = shared_data['pay_user_headers']
    admin_headers = {"Authorization": f"Bearer {shared_data['owner_token']}"}
    order_id = shared_data['pay_order_id']

    # Mark the order as Paid via admin status endpoint
    patch_res = requests.patch(
        f"{order_url}/{order_id}/status",
        json={"status": "Paid"},
        headers=admin_headers
    )
    # Accept 200 (updated) — the order is now in Paid state
    assert patch_res.status_code == 200, f"Admin status update failed: {patch_res.text}"

    # Now attempt to pay again as the original user
    res = requests.post(
        f"{order_url}/{order_id}/pay",
        json={"paymentMethod": "card"},
        headers=headers
    )
    assert res.status_code == 400, f"Expected 400, got {res.status_code}: {res.text}"
    assert "already paid" in res.json()['error']['message'].lower()


# --- F. CLEANUP (Order 76) ---
@pytest.mark.run(order=74)
def test_payment_cleanup():
    headers = shared_data.get('owner_token')
    if headers:
        headers = {"Authorization": f"Bearer {headers}"}
        
        # Delete Product
        if 'pay_prod_id' in shared_data:
            requests.delete(f"{product_url}/{shared_data['pay_prod_id']}", headers=headers)
        # Delete Category
        if 'pay_cat_id' in shared_data:
            requests.delete(f"{category_url}/{shared_data['pay_cat_id']}", headers=headers)
            
    print("Payment tests cleaned up.")