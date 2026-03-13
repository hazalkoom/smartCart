import requests
import pytest
from tests.test_config import BASE_URL, OWNER_LOGIN
from tests.helpers.api_assertions import (
    assert_error,
    assert_status,
    assert_success,
    auth_header,
    unique_suffix,
)

# Endpoints
order_url = f"{BASE_URL}/orders"
product_url = f"{BASE_URL}/products"
category_url = f"{BASE_URL}/categories"
cart_url = f"{BASE_URL}/cart"


def _skip_if_gateway_unavailable(response):
    if response.status_code == 502:
        pytest.skip("Paymob Sandbox unavailable (502)")


@pytest.fixture(scope='module')
def payment_ctx():
    # A. Login Owner
    res_login = requests.post(f"{BASE_URL}/auth/login", json=OWNER_LOGIN)
    login_body = assert_success(res_login, 200, "payment setup owner login")
    owner_headers = auth_header(login_body['data']['token'])

    # B. Create Category
    cat_name = f"Payment Cat {unique_suffix()}"
    res_cat = requests.post(category_url, json={"name": cat_name}, headers=owner_headers)
    cat_body = assert_success(res_cat, 201, "payment setup create category")
    category_id = cat_body['data']['_id']

    # C. Create Product
    prod_data = {
        "name": f"Payment Item {unique_suffix()}",
        "price": 100.00,
        "sku": f"PAY-{unique_suffix()}",
        "stock": 100,
        "categoryId": category_id,
        "description": "For payment tests"
    }
    res_prod = requests.post(product_url, json=prod_data, headers=owner_headers)
    prod_body = assert_success(res_prod, 201, "payment setup create product")
    product_id = prod_body['data']['_id']

    # D. Main user
    email_main = f"payer_{unique_suffix()}@test.com"
    requests.post(
        f"{BASE_URL}/auth/register",
        json={
            "email": email_main,
            "password": "password123",
            "firstName": "Payer",
            "lastName": "Main",
            "mobileNumber": "01000000001",
        },
    )
    res_main = requests.post(f"{BASE_URL}/auth/login", json={"email": email_main, "password": "password123"})
    main_body = assert_success(res_main, 200, "payment setup main login")
    user_headers = auth_header(main_body['data']['token'])

    # E. Attacker user
    email_hack = f"hacker_{unique_suffix()}@test.com"
    requests.post(
        f"{BASE_URL}/auth/register",
        json={"email": email_hack, "password": "password123", "firstName": "Hacker", "lastName": "Bad"},
    )
    res_hack = requests.post(f"{BASE_URL}/auth/login", json={"email": email_hack, "password": "password123"})
    hack_body = assert_success(res_hack, 200, "payment setup attacker login")
    attacker_headers = auth_header(hack_body['data']['token'])

    # F. Create order for main user
    requests.post(f"{cart_url}/items", json={"productId": product_id, "quantity": 1}, headers=user_headers)
    res_order = requests.post(
        order_url,
        json={"shippingAddress": {"street": "123 Pay St", "city": "Cairo", "country": "Egypt"}},
        headers=user_headers,
    )
    order_body = assert_success(res_order, 201, "payment setup create order")
    order_payload = order_body.get('data', {})
    order_obj = order_payload.get('order', order_payload)

    ctx = {
        'owner_headers': owner_headers,
        'user_headers': user_headers,
        'attacker_headers': attacker_headers,
        'category_id': category_id,
        'product_id': product_id,
        'order_id': order_obj['_id'],
    }

    yield ctx

    requests.delete(cart_url, headers=user_headers)
    requests.delete(f"{product_url}/{product_id}", headers=owner_headers)
    requests.delete(f"{category_url}/{category_id}", headers=owner_headers)

# --- 1. SETUP (Order 70) ---
@pytest.mark.run(order=68)
def test_payment_setup(payment_ctx):
    assert payment_ctx['order_id']
    assert payment_ctx['product_id']
    assert payment_ctx['category_id']


# --- A. SECURITY & AUTHORIZATION (Order 71) ---
@pytest.mark.run(order=69)
def test_pay_security_401_no_token(payment_ctx):
    order_id = payment_ctx['order_id']
    res = requests.post(f"{order_url}/{order_id}/pay", json={"paymentMethod": "card"})
    assert_error(res, 401, 'TOKEN_MISSING', 'no token', 'pay security no token')

@pytest.mark.run(order=69)
def test_pay_security_403_wrong_user(payment_ctx):
    """User B tries to pay for User A's order"""
    order_id = payment_ctx['order_id']
    headers = payment_ctx['attacker_headers']
    
    res = requests.post(f"{order_url}/{order_id}/pay", json={"paymentMethod": "card"}, headers=headers)
    assert_error(res, 403, message_contains='not authorized', context='pay security wrong user')

@pytest.mark.run(order=69)
def test_pay_security_404_invalid_id(payment_ctx):
    headers = payment_ctx['user_headers']
    # Valid MongoID format but doesn't exist
    fake_id = "605d5b1d9c3e1a001f7b8b1a"
    res = requests.post(f"{order_url}/{fake_id}/pay", json={"paymentMethod": "card"}, headers=headers)
    assert_error(res, 404, 'NOT_FOUND', 'Order not found', 'pay security invalid id')


# --- B. INPUT VALIDATION (Order 72) ---
@pytest.mark.run(order=70)
def test_pay_validation_missing_method(payment_ctx):
    headers = payment_ctx['user_headers']
    order_id = payment_ctx['order_id']
    
    res = requests.post(f"{order_url}/{order_id}/pay", json={}, headers=headers)
    assert_error(res, 400, 'VALIDATION_ERROR', 'required', 'pay validation missing method')

@pytest.mark.run(order=70)
def test_pay_validation_invalid_method(payment_ctx):
    headers = payment_ctx['user_headers']
    order_id = payment_ctx['order_id']
    
    res = requests.post(f"{order_url}/{order_id}/pay", json={"paymentMethod": "bitcoin"}, headers=headers)
    assert_error(res, 400, 'VALIDATION_ERROR', 'Invalid payment method', 'pay validation invalid method')

@pytest.mark.run(order=70)
def test_pay_validation_wallet_bad_phone_regex(payment_ctx):
    headers = payment_ctx['user_headers']
    order_id = payment_ctx['order_id']
    
    payload = {"paymentMethod": "wallet", "mobileNumber": "12345"}
    res = requests.post(f"{order_url}/{order_id}/pay", json=payload, headers=headers)
    assert_error(res, 400, 'VALIDATION_ERROR', 'Invalid Egyptian mobile', 'pay validation wallet phone')


# --- C. BUSINESS LOGIC (Order 73) ---
@pytest.mark.run(order=71)
def test_pay_logic_wallet_requirement(payment_ctx):
    """
    Test the specific logic: If user has no phone in DB, 
    and sends no phone in body, it should fail.
    We use the 'Attacker' account for this since they have no phone set in setup.
    """
    # 1. Create an order for Attacker first (since they can't pay for Main's order)
    headers = payment_ctx['attacker_headers']
    
    # Add item
    requests.post(f"{cart_url}/items", json={"productId": payment_ctx['product_id'], "quantity": 1}, headers=headers)
    # Create Order
    res_ord = requests.post(order_url, json={"shippingAddress": {"street": "St", "city": "C", "country": "E"}}, headers=headers)
    assert res_ord.status_code == 201, f"Attacker order creation failed: {res_ord.text}"
    attacker_order_payload = res_ord.json().get('data', {})
    attacker_order_obj = attacker_order_payload.get('order', attacker_order_payload)
    attacker_order_id = attacker_order_obj['_id']

    # 2. Try to pay with wallet (No phone in body, No phone in DB)
    res = requests.post(f"{order_url}/{attacker_order_id}/pay", json={"paymentMethod": "wallet"}, headers=headers)
    assert_error(res, 400, 'VALIDATION_ERROR', 'Mobile number is required', 'pay wallet requirement')


# --- D. HAPPY PATHS (Order 74) ---
# NOTE: These tests assume your backend is connected to Paymob Sandbox 
# and the credentials in .env are valid.

@pytest.mark.run(order=72)
def test_pay_happy_card_iframe(payment_ctx):
    headers = payment_ctx['user_headers']
    order_id = payment_ctx['order_id']
    
    res = requests.post(f"{order_url}/{order_id}/pay", json={"paymentMethod": "card"}, headers=headers)
    
    _skip_if_gateway_unavailable(res)
    
    assert res.status_code == 200, f"Card Payment Init Failed: {res.text}"
    assert res.json()['data']['action'] == 'iframe'
    assert "accept.paymob.com" in res.json()['data']['url']
    assert "payment_token=" in res.json()['data']['url']

@pytest.mark.run(order=72)
def test_pay_happy_wallet_redirect(payment_ctx):
    headers = payment_ctx['user_headers']
    order_id = payment_ctx['order_id']
    
    # We send a specific phone number to override the profile one
    payload = {"paymentMethod": "wallet", "mobileNumber": "01010101010"}
    res = requests.post(f"{order_url}/{order_id}/pay", json=payload, headers=headers)

    _skip_if_gateway_unavailable(res)

    assert res.status_code == 200, f"Wallet Payment Init Failed: {res.text}"
    assert res.json()['data']['action'] == 'redirect'
    assert "accept.paymob" in res.json()['data']['url']

@pytest.mark.run(order=72)
def test_pay_happy_fawry_code(payment_ctx):
    headers = payment_ctx['user_headers']
    order_id = payment_ctx['order_id']
    
    res = requests.post(f"{order_url}/{order_id}/pay", json={"paymentMethod": "fawry"}, headers=headers)

    _skip_if_gateway_unavailable(res)

    assert res.status_code == 200, f"Fawry Payment Init Failed: {res.text}"
    assert res.json()['data']['action'] == 'fawry_code'
    # Check if bill_reference exists (it might be int or string)
    assert 'bill_reference' in res.json()['data']


# --- E. STATE & DOUBLE PAYMENT (Order 75) ---
@pytest.mark.run(order=73)
def test_pay_prevent_double_payment(payment_ctx):
    """
    Simulate a paid order by manually updating the order status via the admin
    endpoint, then attempt to pay again — expect 400 'Order is already paid'.
    """
    headers = payment_ctx['user_headers']
    admin_headers = payment_ctx['owner_headers']
    order_id = payment_ctx['order_id']

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
    _skip_if_gateway_unavailable(res)

    assert_error(res, 400, 'VALIDATION_ERROR', 'already paid', 'pay prevent double payment')


# --- F. CLEANUP (Order 76) ---
@pytest.mark.run(order=74)
def test_payment_cleanup(payment_ctx):
    # Cleanup is handled by fixture teardown; keep this test to preserve marker order.
    res = requests.get(f"{order_url}/{payment_ctx['order_id']}", headers=payment_ctx['owner_headers'])
    assert_status(res, 200, "payment cleanup verification")