import os
import requests
import pytest
import hmac
import hashlib

from tests.test_config import BASE_URL, OWNER_LOGIN
from tests.helpers.api_assertions import assert_status, assert_success, auth_header, unique_suffix

# --- CONFIGURATION ---
# IMPORTANT: This must match the PAYMOB_HMAC_SECRET in your backend .env file
# If you are using a dummy value in dev, put it here.
HMAC_SECRET = os.getenv("PAYMOB_HMAC_SECRET", "9398BBEE4367A5BB6119DD67EECECC1D")

WEBHOOK_ENDPOINT = f"{BASE_URL}/webhook/paymob"

# --- HELPER: HMAC GENERATOR ---
def generate_hmac(data, secret):
    """Mimic Paymob HMAC calculation over expected fields."""
    keys = [
        'amount_cents', 'created_at', 'currency', 'error_occured', 
        'has_parent_transaction', 'id', 'integration_id', 'is_3d_secure', 
        'is_auth', 'is_capture', 'is_refunded', 'is_standalone_payment', 
        'is_voided', 'order', 'owner', 'pending', 
        'source_data.pan', 'source_data.sub_type', 'source_data.type', 
        'success'
    ]

    concatenated_values = ""
    
    for key in keys:
        val = ""
        if key.startswith('source_data.'):
            sub_key = key.split('.')[1]
            val = data.get('source_data', {}).get(sub_key, "")
        else:
            val = data.get(key, "")
        
        if val is True:
            val = "true"
        if val is False:
            val = "false"
        if val is None:
            val = ""
        
        concatenated_values += str(val)

    signature = hmac.new(
        key=secret.encode('utf-8'), 
        msg=concatenated_values.encode('utf-8'), 
        digestmod=hashlib.sha512
    ).hexdigest()
    
    return signature

@pytest.fixture(scope="module")
def webhook_ctx():
    res_login = requests.post(f"{BASE_URL}/auth/login", json=OWNER_LOGIN)
    owner_body = assert_success(res_login, 200, "webhook owner login")
    owner_headers = auth_header(owner_body['data']['token'])

    res_cat = requests.post(f"{BASE_URL}/categories", json={"name": f"WebCat {unique_suffix()}"}, headers=owner_headers)
    cat_body = assert_success(res_cat, 201, "webhook create category")
    category_id = cat_body['data']['_id']

    res_prod = requests.post(
        f"{BASE_URL}/products",
        json={
            "name": f"Webhook Item {unique_suffix()}",
            "price": 100,
            "sku": f"WEB-{unique_suffix()}",
            "stock": 100,
            "categoryId": category_id,
            "description": "sec test",
        },
        headers=owner_headers,
    )
    prod_body = assert_success(res_prod, 201, "webhook create product")
    product_id = prod_body['data']['_id']

    user_email = f"webhookuser_{unique_suffix()}@test.com"
    res_reg = requests.post(
        f"{BASE_URL}/auth/register",
        json={"email": user_email, "password": "password123", "firstName": "Web", "lastName": "Hook"},
    )
    assert_status(res_reg, 201, "webhook register user")

    res_user = requests.post(f"{BASE_URL}/auth/login", json={"email": user_email, "password": "password123"})
    user_body = assert_success(res_user, 200, "webhook login user")
    user_headers = auth_header(user_body['data']['token'])

    res_cart = requests.post(f"{BASE_URL}/cart/items", json={"productId": product_id, "quantity": 1}, headers=user_headers)
    if res_cart.status_code not in [200, 201]:
        raise AssertionError(f"webhook add cart item failed: status={res_cart.status_code} body={res_cart.text}")

    res_order = requests.post(
        f"{BASE_URL}/orders",
        json={"shippingAddress": {"street": "Web St", "city": "Cairo", "country": "EG"}},
        headers=user_headers,
    )
    order_body = assert_success(res_order, 201, "webhook create order")
    order_payload = order_body.get('data', {})
    order_obj = order_payload.get('order', order_payload)

    ctx = {
        "order_id": order_obj['_id'],
        "user_headers": user_headers,
        "amount_cents": 10000,
        "owner_headers": owner_headers,
        "product_id": product_id,
        "category_id": category_id,
    }
    yield ctx

    requests.delete(f"{BASE_URL}/products/{ctx['product_id']}", headers=ctx['owner_headers'])
    requests.delete(f"{BASE_URL}/categories/{ctx['category_id']}", headers=ctx['owner_headers'])

# --- TESTS ---

@pytest.mark.run(order=91)
def test_webhook_impersonator_attack(webhook_ctx):
    order_id = webhook_ctx['order_id']
    
    payload = {
        "type": "TRANSACTION",
        "obj": {
            "id": 123456,
            "success": True,
            "merchant_order_id": order_id,
            "amount_cents": 10000,
            "source_data": {"type": "card", "pan": "1234", "sub_type": "Visa"}
        }
    }
    fake_hmac = "a" * 128
    res = requests.post(f"{WEBHOOK_ENDPOINT}?hmac={fake_hmac}", json=payload)
    assert_status(res, 403, "webhook impersonator attack")

@pytest.mark.run(order=92)
def test_webhook_man_in_the_middle_attack(webhook_ctx):
    order_id = webhook_ctx['order_id']

    data = {
        "amount_cents": 10000,
        "created_at": "2023-01-01T00:00:00",
        "currency": "EGP",
        "error_occured": False,
        "has_parent_transaction": False,
        "id": 999999,
        "integration_id": 123,
        "is_3d_secure": True,
        "is_auth": False,
        "is_capture": False,
        "is_refunded": False,
        "is_standalone_payment": False,
        "is_voided": False,
        "order": 55555,
        "owner": 1,
        "pending": False,
        "source_data": {"pan": "2345", "sub_type": "MasterCard", "type": "card"},
        "success": True
    }

    valid_hmac = generate_hmac(data, HMAC_SECRET)

    data['amount_cents'] = 100 

    res = requests.post(
        f"{WEBHOOK_ENDPOINT}?hmac={valid_hmac}",
        json={"type": "TRANSACTION", "obj": data}
    )

    assert_status(res, 403, "webhook man in the middle attack")

@pytest.mark.run(order=93)
def test_webhook_happy_path_success(webhook_ctx):
    order_id = webhook_ctx['order_id']
    amount = webhook_ctx['amount_cents']

    data = {
        "amount_cents": amount,
        "created_at": "2023-01-01T00:00:00",
        "currency": "EGP",
        "error_occured": False,
        "has_parent_transaction": False,
        "id": 888888,
        "integration_id": 123,
        "is_3d_secure": True,
        "is_auth": False,
        "is_capture": False,
        "is_refunded": False,
        "is_standalone_payment": False,
        "is_voided": False,
        "order": 77777,
        "owner": 1,
        "pending": False,
        "source_data": {"pan": "2345", "sub_type": "MasterCard", "type": "card"},
        "success": True,
        
        "merchant_order_id": order_id 
    }

    signature = generate_hmac(data, HMAC_SECRET)

    res = requests.post(
        f"{WEBHOOK_ENDPOINT}?hmac={signature}",
        json={"type": "TRANSACTION", "obj": data}
    )

    assert_status(res, 200, "webhook happy path callback")

    headers = webhook_ctx['user_headers']
    res_order = requests.get(f"{BASE_URL}/orders/{order_id}", headers=headers)

    order_body = assert_success(res_order, 200, "webhook verify order state")
    order_data = order_body['data']
    assert order_data['status'] == 'Paid'
    assert order_data['isPaid'] is True
    assert order_data.get('paidAt') is not None

@pytest.mark.run(order=94)
def test_webhook_idempotency(webhook_ctx):
    order_id = webhook_ctx['order_id']
    headers = webhook_ctx['user_headers']

    res_before = requests.get(f"{BASE_URL}/orders/{order_id}", headers=headers)
    before_body = assert_success(res_before, 200, "webhook idempotency before")
    order_data = before_body.get('data', {})
    if order_data.get('status') != 'Paid':
        pytest.skip("Skipping idempotency test because order is not Paid")

    paid_at_before = order_data['paidAt']
    
    data = {
        "amount_cents": 10000,
        "created_at": "2023-01-01T00:00:00",
        "currency": "EGP",
        "error_occured": False,
        "has_parent_transaction": False,
        "id": 888888, 
        "integration_id": 123,
        "is_3d_secure": True,
        "is_auth": False,
        "is_capture": False,
        "is_refunded": False,
        "is_standalone_payment": False,
        "is_voided": False,
        "order": 77777,
        "owner": 1,
        "pending": False,
        "source_data": {"pan": "2345", "sub_type": "MasterCard", "type": "card"},
        "success": True,
        "merchant_order_id": order_id
    }
    signature = generate_hmac(data, HMAC_SECRET)

    res = requests.post(
        f"{WEBHOOK_ENDPOINT}?hmac={signature}",
        json={"type": "TRANSACTION", "obj": data}
    )
    assert_status(res, 200, "webhook idempotency duplicate callback")

    res_after = requests.get(f"{BASE_URL}/orders/{order_id}", headers=headers)
    after_body = assert_success(res_after, 200, "webhook idempotency after")
    paid_at_after = after_body['data']['paidAt']
    
    assert paid_at_before == paid_at_after