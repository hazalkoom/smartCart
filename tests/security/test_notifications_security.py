import requests
import pytest
import hashlib
import hmac
import os
import time

from tests.helpers.api_assertions import assert_error, assert_status, assert_success, auth_header, unique_suffix
from tests.test_config import BASE_URL

notification_url = f"{BASE_URL}/notifications"
order_url = f"{BASE_URL}/orders"
product_url = f"{BASE_URL}/products"
cart_url = f"{BASE_URL}/cart"
webhook_url = f"{BASE_URL}/webhook/paymob"

HMAC_SECRET = os.getenv('PAYMOB_HMAC_SECRET', '9398BBEE4367A5BB6119DD67EECECC1D')


def generate_hmac(data, secret):
    keys = [
        'amount_cents',
        'created_at',
        'currency',
        'error_occured',
        'has_parent_transaction',
        'id',
        'integration_id',
        'is_3d_secure',
        'is_auth',
        'is_capture',
        'is_refunded',
        'is_standalone_payment',
        'is_voided',
        'order',
        'owner',
        'pending',
        'source_data.pan',
        'source_data.sub_type',
        'source_data.type',
        'success',
    ]

    payload = ''
    for key in keys:
        if key.startswith('source_data.'):
            sub_key = key.split('.')[1]
            value = data.get('source_data', {}).get(sub_key, '')
        else:
            value = data.get(key, '')

        if value is True:
            value = 'true'
        if value is False:
            value = 'false'
        if value is None:
            value = ''

        payload += str(value)

    return hmac.new(secret.encode('utf-8'), payload.encode('utf-8'), hashlib.sha512).hexdigest()


def get_public_product_id():
    products_res = requests.get(f"{product_url}?limit=1")
    products_body = assert_success(products_res, 200, 'notifications security fetch public products')
    products = products_body.get('data') or []
    if not products:
        pytest.skip('notifications security setup: no public products found in DB')

    return products[0]['_id']


def get_public_product_ids(limit=50):
    products_res = requests.get(f"{product_url}?limit={limit}")
    products_body = assert_success(products_res, 200, 'notifications security fetch public products list')
    products = products_body.get('data') or []
    return [item.get('_id') for item in products if item.get('_id')]


def add_to_cart_with_fallback(headers, preferred_product_id):
    candidate_ids = [preferred_product_id] + [pid for pid in get_public_product_ids() if pid != preferred_product_id]
    res = None
    for candidate_id in candidate_ids:
        res = requests.post(f"{cart_url}/items", json={'productId': candidate_id, 'quantity': 1}, headers=headers)
        if res.status_code == 200:
            return candidate_id

    assert_status(res, 200, 'notifications security add cart')
    return preferred_product_id


def trigger_success_payment(order_id):
    tx_id = int(time.time() * 1000)
    webhook_data = {
        'amount_cents': 10000,
        'created_at': '2026-04-18T00:00:00',
        'currency': 'EGP',
        'error_occured': False,
        'has_parent_transaction': False,
        'id': tx_id,
        'integration_id': 123,
        'is_3d_secure': True,
        'is_auth': False,
        'is_capture': False,
        'is_refunded': False,
        'is_standalone_payment': False,
        'is_voided': False,
        'order': tx_id,
        'owner': 1,
        'pending': False,
        'source_data': {'pan': '2345', 'sub_type': 'MasterCard', 'type': 'card'},
        'success': True,
        'merchant_order_id': order_id,
    }
    signature = generate_hmac(webhook_data, HMAC_SECRET)
    return requests.post(f"{webhook_url}?hmac={signature}", json={'type': 'TRANSACTION', 'obj': webhook_data})


def _create_user(email_prefix):
    email = f"{email_prefix}_{unique_suffix()}@example.com"
    register_res = requests.post(
        f"{BASE_URL}/auth/register",
        json={'email': email, 'password': 'password123', 'firstName': 'Sec', 'lastName': 'User'},
    )
    assert_status(register_res, 201, 'notifications security register user')

    login_res = requests.post(f"{BASE_URL}/auth/login", json={'email': email, 'password': 'password123'})
    login_body = assert_success(login_res, 200, 'notifications security login user')
    return auth_header(login_body['data']['token'])


def test_notifications_security_authz_and_country_injection_guard():
    unauth_list = requests.get(notification_url)
    assert_error(unauth_list, 401, 'TOKEN_MISSING', 'no token', 'notifications security unauth list')

    product_id = get_public_product_id()

    user_a_headers = _create_user('notif_sec_a')
    user_b_headers = _create_user('notif_sec_b')

    add_to_cart_with_fallback(user_a_headers, product_id)

    order_res = requests.post(
        order_url,
        json={'shippingAddress': {'street': 'Sec St', 'city': 'Cairo', 'country': 'Egypt'}},
        headers=user_a_headers,
    )
    order_body = assert_success(order_res, 201, 'notifications security create order')
    order_payload = order_body.get('data', {})
    order_obj = order_payload.get('order', order_payload)
    order_id = order_obj['_id']

    payment_res = trigger_success_payment(order_id)
    assert_status(payment_res, 200, 'notifications security trigger notif')

    user_a_list = requests.get(notification_url, headers=user_a_headers)
    user_a_body = assert_success(user_a_list, 200, 'notifications security list user a')
    assert user_a_body['count'] >= 1
    notification_id = user_a_body['data'][0]['_id']

    user_b_mark = requests.patch(f"{notification_url}/{notification_id}/read", headers=user_b_headers)
    assert_error(user_b_mark, 404, None, 'Notification not found', 'notifications security foreign mark blocked')

    inject_order = requests.post(
        order_url,
        json={'shippingAddress': {'street': 'X', 'city': 'Cairo', 'country': {'$ne': ''}}},
        headers=user_a_headers,
    )
    assert_error(inject_order, 400, 'VALIDATION_ERROR', 'Country must be a string', 'notifications security order country object injection')

    requests.delete(cart_url, headers=user_a_headers)
    requests.delete(cart_url, headers=user_b_headers)
