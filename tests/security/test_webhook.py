import requests
import pytest
import time
import hashlib
import hmac
import os
from tests.test_config import BASE_URL, OWNER_LOGIN, print_test_result, shared_data

# --- CONFIGURATION ---
# IMPORTANT: This must match the PAYMOB_HMAC_SECRET in your backend .env file
# If you are using a dummy value in dev, put it here.
HMAC_SECRET = "9398BBEE4367A5BB6119DD67EECECC1D"

webhook_url = f"{BASE_URL}/orders/webhook/paymob" # Use the path defined in your routes
# Based on your previous setup, you mounted webhookRoutes at /webhook/paymob? 
# Or /api/v1/webhook? Let's assume /webhook/paymob based on Prompt 3.
# Adjust this URL if your server.js mount point is different.
# If you mounted it as: app.post('/webhook/paymob', handlePaymobWebhook)
# Then URL is http://localhost:5000/webhook/paymob
WEBHOOK_ENDPOINT = "http://localhost:5000/webhook/paymob"

# --- HELPER: HMAC GENERATOR ---
def generate_hmac(data, secret):
    """
    Mimics Paymob's HMAC calculation exactly.
    """
    # 1. The 20 keys enforced by Paymob (Lexicographically sorted)
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
        
        # Paymob treats None/False as specific strings in some SDKs, 
        # but usually string conversion works.
        # Boolean to string in Python is 'True'/'False', JS is 'true'/'false'.
        # Paymob sends 'true'/'false' as JSON booleans. 
        # We need to ensure we format it how the Backend expects it stringified.
        if val is True: val = "true"
        if val is False: val = "false"
        if val is None: val = ""
        
        concatenated_values += str(val)

    # Hash it
    signature = hmac.new(
        key=secret.encode('utf-8'), 
        msg=concatenated_values.encode('utf-8'), 
        digestmod=hashlib.sha512
    ).hexdigest()
    
    return signature

# --- FIXTURE: SETUP DATA ---
@pytest.fixture(scope="module")
def setup_data():
    """
    Creates an Order to pay for.
    """
    # 1. Login Owner to create product
    res_login = requests.post(f"{BASE_URL}/auth/login", json=OWNER_LOGIN)
    owner_token = res_login.json()['data']['token']
    owner_headers = {"Authorization": f"Bearer {owner_token}"}
    
    # 2. Create Product
    prod_data = {
        "name": f"Webhook Item {int(time.time())}", "price": 100, "sku": f"WEB-{int(time.time())}", 
        "stock": 100, "categoryId": "605d5b1d9c3e1a001f7b8b1a", "description": "sec test"
    }
    # Create category if needed, but assuming one exists or using fake ID if validation loose
    # Let's verify category existence quickly or create one
    cat_res = requests.post(f"{BASE_URL}/categories", json={"name": f"WebCat {int(time.time())}"}, headers=owner_headers)
    if cat_res.status_code == 201:
        prod_data['categoryId'] = cat_res.json()['data']['_id']
    
    res_prod = requests.post(f"{BASE_URL}/products", json=prod_data, headers=owner_headers)
    product_id = res_prod.json()['data']['_id']

    # 3. Create User & Order
    user_email = f"webhookuser_{int(time.time())}@test.com"
    requests.post(f"{BASE_URL}/auth/register", json={
        "email": user_email, "password": "password123", "firstName": "Web", "lastName": "Hook"
    })
    res_user = requests.post(f"{BASE_URL}/auth/login", json={"email": user_email, "password": "password123"})
    user_token = res_user.json()['data']['token']
    user_headers = {"Authorization": f"Bearer {user_token}"}
    
    requests.post(f"{BASE_URL}/cart/items", json={"productId": product_id, "quantity": 1}, headers=user_headers)
    res_order = requests.post(f"{BASE_URL}/orders", json={
        "shippingAddress": {"street": "Web St", "city": "Cairo", "country": "EG"}
    }, headers=user_headers)
    
    order_id = res_order.json()['data']['order']['_id']
    
    return {
        "order_id": order_id,
        "user_headers": user_headers,
        "amount_cents": 10000 # 100.00 * 100
    }

# --- TESTS ---

@pytest.mark.run(order=91)
def test_webhook_impersonator_attack(setup_data):
    """
    Attack: Send valid data but invalid HMAC.
    """
    order_id = setup_data['order_id']
    
    payload = {
        "obj": {
            "id": 123456,
            "success": True,
            "merchant_order_id": order_id,
            "amount_cents": 10000,
            # ... minimal fields needed to pass basic validation
            "source_data": {"type": "card", "pan": "1234", "sub_type": "Visa"}
        }
    }
    
    # Fake Signature
    fake_hmac = "a" * 128
    
    res = requests.post(f"{WEBHOOK_ENDPOINT}?hmac={fake_hmac}", json=payload)
    
    assert res.status_code == 403
    # Check if your backend sends JSON or text for 403
    # assert "Invalid HMAC" in res.text

@pytest.mark.run(order=92)
def test_webhook_man_in_the_middle_attack(setup_data):
    """
    Attack: Intercept valid payload, change amount, keep valid signature.
    """
    order_id = setup_data['order_id']
    
    # 1. Construct Valid Payload
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
    
    # 2. Generate Valid HMAC for THIS data
    valid_hmac = generate_hmac(data, HMAC_SECRET)
    
    # 3. Modify Data (The Hack)
    # Hacker changes amount from 100.00 to 1.00
    data['amount_cents'] = 100 
    
    # 4. Send with ORIGINAL valid HMAC
    res = requests.post(f"{WEBHOOK_ENDPOINT}?hmac={valid_hmac}", json={"obj": data})
    
    assert res.status_code == 403

@pytest.mark.run(order=93)
def test_webhook_happy_path_success(setup_data):
    """
    Valid Paymob Callback -> Order should become PAID.
    """
    order_id = setup_data['order_id']
    amount = setup_data['amount_cents']
    
    # 1. Construct Full Valid Payload
    # Paymob sends merchant_order_id inside the 'obj', but it's not part of HMAC calculation keys!
    # Wait, check backend logic: 
    # Backend usually uses merchant_order_id to find the order.
    # HMAC keys list does NOT include 'merchant_order_id'.
    
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
        
        # Extra fields NOT in HMAC but needed by Controller
        "merchant_order_id": order_id 
    }
    
    # 2. Calculate HMAC
    signature = generate_hmac(data, HMAC_SECRET)
    
    # 3. Send
    res = requests.post(f"{WEBHOOK_ENDPOINT}?hmac={signature}", json={"obj": data})
    
    assert res.status_code == 200
    
    # 4. Verify DB State
    headers = setup_data['user_headers']
    res_order = requests.get(f"{BASE_URL}/orders/{order_id}", headers=headers)
    
    order_data = res_order.json()['data']
    assert order_data['status'] == 'Paid'
    assert order_data['isPaid'] is True
    assert order_data.get('paidAt') is not None

@pytest.mark.run(order=94)
def test_webhook_idempotency(setup_data):
    """
    Send the same valid webhook again.
    """
    order_id = setup_data['order_id']
    headers = setup_data['user_headers']
    
    # Check if previous test passed (Order is Paid)
    res_before = requests.get(f"{BASE_URL}/orders/{order_id}", headers=headers)
    order_data = res_before.json().get('data', {})
    
    if order_data.get('status') != 'Paid':
        pytest.skip("Skipping Idempotency test because Happy Path failed (Order is not Paid)")

    paid_at_before = order_data['paidAt']
    
    # Construct Payload again (Same ID)
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
    
    # Send Duplicate
    res = requests.post(f"{WEBHOOK_ENDPOINT}?hmac={signature}", json={"obj": data})
    assert res.status_code == 200
    
    # Verify State Unchanged
    res_after = requests.get(f"{BASE_URL}/orders/{order_id}", headers=headers)
    paid_at_after = res_after.json()['data']['paidAt']
    
    assert paid_at_before == paid_at_after