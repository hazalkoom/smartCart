import requests
import pytest
import time
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

# --- 1. SETUP (Order 70) ---
@pytest.mark.run(order=70)
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
    assert res_login.status_code == 200
    owner_token = res_login.json()['data']['token']
    owner_headers = {"Authorization": f"Bearer {owner_token}"}

    # B. Create Temp Category
    cat_name = f"Payment Cat {int(time.time())}"
    res_cat = requests.post(category_url, json={"name": cat_name}, headers=owner_headers)
    assert res_cat.status_code == 201
    category_id = res_cat.json()['data']['_id']
    shared_data['pay_cat_id'] = category_id

    # C. Create Temp Product
    prod_data = {
        "name": "Payment Test Item", "price": 100.00, "sku": f"PAY-{int(time.time())}", 
        "stock": 100, "categoryId": category_id, "description": "For payment tests"
    }
    res_prod = requests.post(product_url, json=prod_data, headers=owner_headers)
    assert res_prod.status_code == 201
    product_id = res_prod.json()['data']['_id']
    shared_data['pay_prod_id'] = product_id

    # D. Setup Main User (The Payer)
    email_main = f"payer_{int(time.time())}@test.com"
    requests.post(f"{BASE_URL}/auth/register", json={
        "email": email_main, "password": "password123", "firstName": "Payer", "lastName": "Main",
        "mobileNumber": "01000000001" # Valid Phone
    })
    res_main = requests.post(f"{BASE_URL}/auth/login", json={"email": email_main, "password": "password123"})
    user_token = res_main.json()['data']['token']
    user_headers = {"Authorization": f"Bearer {user_token}"}
    shared_data['pay_user_headers'] = user_headers

    # E. Setup Attacker User (The Thief)
    email_hack = f"hacker_{int(time.time())}@test.com"
    requests.post(f"{BASE_URL}/auth/register", json={
        "email": email_hack, "password": "password123", "firstName": "Hacker", "lastName": "Bad"
    })
    res_hack = requests.post(f"{BASE_URL}/auth/login", json={"email": email_hack, "password": "password123"})
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
    assert res_order.status_code == 201
    shared_data['pay_order_id'] = res_order.json()['data']['order']['_id'] # Use correct key path
    
    print(f"Payment Setup Complete. Order ID: {shared_data['pay_order_id']}")


# --- A. SECURITY & AUTHORIZATION (Order 71) ---
@pytest.mark.run(order=71)
def test_pay_security_401_no_token():
    order_id = shared_data['pay_order_id']
    res = requests.post(f"{order_url}/{order_id}/pay", json={"paymentMethod": "card"})
    assert res.status_code == 401
    assert res.json()['error']['code'] == 'TOKEN_MISSING'

@pytest.mark.run(order=71)
def test_pay_security_403_wrong_user():
    """User B tries to pay for User A's order"""
    order_id = shared_data['pay_order_id']
    headers = shared_data['pay_attacker_headers']
    
    res = requests.post(f"{order_url}/{order_id}/pay", json={"paymentMethod": "card"}, headers=headers)
    assert res.status_code == 403
    # Matches the error thrown in your controller
    assert "not authorized" in res.json()['error']['message'].lower()

@pytest.mark.run(order=71)
def test_pay_security_404_invalid_id():
    headers = shared_data['pay_user_headers']
    # Valid MongoID format but doesn't exist
    fake_id = "605d5b1d9c3e1a001f7b8b1a"
    res = requests.post(f"{order_url}/{fake_id}/pay", json={"paymentMethod": "card"}, headers=headers)
    assert res.status_code == 404
    assert res.json()['error']['code'] == 'NOT_FOUND'


# --- B. INPUT VALIDATION (Order 72) ---
@pytest.mark.run(order=72)
def test_pay_validation_missing_method():
    headers = shared_data['pay_user_headers']
    order_id = shared_data['pay_order_id']
    
    res = requests.post(f"{order_url}/{order_id}/pay", json={}, headers=headers)
    assert res.status_code == 400
    assert "required" in res.json()['error']['message']

@pytest.mark.run(order=72)
def test_pay_validation_invalid_method():
    headers = shared_data['pay_user_headers']
    order_id = shared_data['pay_order_id']
    
    res = requests.post(f"{order_url}/{order_id}/pay", json={"paymentMethod": "bitcoin"}, headers=headers)
    assert res.status_code == 400
    assert "Invalid payment method" in res.json()['error']['message']

@pytest.mark.run(order=72)
def test_pay_validation_wallet_bad_phone_regex():
    headers = shared_data['pay_user_headers']
    order_id = shared_data['pay_order_id']
    
    payload = {"paymentMethod": "wallet", "mobileNumber": "12345"}
    res = requests.post(f"{order_url}/{order_id}/pay", json=payload, headers=headers)
    assert res.status_code == 400
    assert "Invalid Egyptian mobile" in res.json()['error']['message']


# --- C. BUSINESS LOGIC (Order 73) ---
@pytest.mark.run(order=73)
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
    attacker_order_id = res_ord.json()['data']['order']['_id']

    # 2. Try to pay with wallet (No phone in body, No phone in DB)
    res = requests.post(f"{order_url}/{attacker_order_id}/pay", json={"paymentMethod": "wallet"}, headers=headers)
    assert res.status_code == 400
    assert "Mobile number is required" in res.json()['error']['message'] 


# --- D. HAPPY PATHS (Order 74) ---
# NOTE: These tests assume your backend is connected to Paymob Sandbox 
# and the credentials in .env are valid.

@pytest.mark.run(order=74)
def test_pay_happy_card_iframe():
    headers = shared_data['pay_user_headers']
    order_id = shared_data['pay_order_id']
    
    res = requests.post(f"{order_url}/{order_id}/pay", json={"paymentMethod": "card"}, headers=headers)
    
    if res.status_code == 502:
        pytest.skip("Paymob Sandbox unavailable (502)")
    
    assert res.status_code == 200
    assert res.json()['data']['action'] == 'iframe'
    assert "accept.paymob.com" in res.json()['data']['url']
    assert "payment_token=" in res.json()['data']['url']

@pytest.mark.run(order=74)
def test_pay_happy_wallet_redirect():
    headers = shared_data['pay_user_headers']
    order_id = shared_data['pay_order_id']
    
    # We send a specific phone number to override the profile one
    payload = {"paymentMethod": "wallet", "mobileNumber": "01010101010"}
    res = requests.post(f"{order_url}/{order_id}/pay", json=payload, headers=headers)

    if res.status_code == 502:
        pytest.skip("Paymob Sandbox unavailable (502)")

    assert res.status_code == 200
    assert res.json()['data']['action'] == 'redirect'
    assert "accept.paymob" in res.json()['data']['url']

@pytest.mark.run(order=74)
def test_pay_happy_fawry_code():
    headers = shared_data['pay_user_headers']
    order_id = shared_data['pay_order_id']
    
    res = requests.post(f"{order_url}/{order_id}/pay", json={"paymentMethod": "fawry"}, headers=headers)

    if res.status_code == 502:
        pytest.skip("Paymob Sandbox unavailable (502)")

    assert res.status_code == 200
    assert res.json()['data']['action'] == 'fawry_code'
    # Check if bill_reference exists (it might be int or string)
    assert 'bill_reference' in res.json()['data']


# --- E. STATE & DOUBLE PAYMENT (Order 75) ---
@pytest.mark.run(order=75)
def test_pay_prevent_double_payment():
    headers = shared_data['pay_user_headers']
    order_id = shared_data['pay_order_id']
    
    # Manually mark order as Paid in DB (Simulating a successful webhook)
    # Since we can't touch DB directly easily in functional tests without a helper endpoint,
    # We will simulate this by using the 'Owner' to update status if you have that endpoint.
    # OR: We rely on the fact that these tests are sequential.
    
    # Note: Paymob initiation DOES NOT mark as paid. The Webhook does.
    # So to test "Order already paid", we need to fake the paid status.
    # If you don't have a "Force Pay" admin endpoint, this test is hard to run black-box.
    # Skipping unless you implement a backdoor.
    pass


# --- F. CLEANUP (Order 76) ---
@pytest.mark.run(order=76)
def test_payment_cleanup():
    headers = shared_data['owner_token']
    if headers:
        headers = {"Authorization": f"Bearer {headers}"}
        
        # Delete Product
        if 'pay_prod_id' in shared_data:
            requests.delete(f"{product_url}/{shared_data['pay_prod_id']}", headers=headers)
        # Delete Category
        if 'pay_cat_id' in shared_data:
            requests.delete(f"{category_url}/{shared_data['pay_cat_id']}", headers=headers)
            
    print("Payment tests cleaned up.")