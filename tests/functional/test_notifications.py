import hashlib
import hmac
import os
import time

import pytest
import requests
import socketio

from tests.helpers.api_assertions import (
    assert_error,
    assert_status,
    assert_success,
    auth_header,
    create_email_verification_token,
    unique_suffix,
)
from tests.test_config import BASE_URL, OWNER_LOGIN

order_url = f"{BASE_URL}/orders"
product_url = f"{BASE_URL}/products"
category_url = f"{BASE_URL}/categories"
cart_url = f"{BASE_URL}/cart"
notification_url = f"{BASE_URL}/notifications"
webhook_url = f"{BASE_URL}/webhook/paymob"
socket_url = BASE_URL.split('/api/v1')[0]

HMAC_SECRET = os.getenv('PAYMOB_HMAC_SECRET', '9398BBEE4367A5BB6119DD67EECECC1D')


def create_owner_product_for_notifications():
    owner_login = requests.post(f"{BASE_URL}/auth/login", json=OWNER_LOGIN)
    owner_body = assert_success(owner_login, 200, 'notifications setup owner login')
    owner_headers = auth_header(owner_body['data']['token'])

    category_res = requests.post(
        category_url,
        json={'name': f'Notifications Cat {unique_suffix()}'},
        headers=owner_headers,
    )
    category_body = assert_success(category_res, 201, 'notifications setup create category')
    category_id = category_body['data']['_id']

    product_res = requests.post(
        product_url,
        json={
            'name': f'Notifications Product {unique_suffix()}',
            'description': 'Notifications test product',
            'price': 100.0,
            'sku': f'NOTIF-{unique_suffix()}',
            'stock': 200,
            'categoryId': category_id,
        },
        headers=owner_headers,
    )
    product_body = assert_success(product_res, 201, 'notifications setup create product')

    return owner_headers, category_id, product_body['data']['_id']


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


def create_order(customer_headers, product_id, country='Egypt'):
    requests.delete(cart_url, headers=customer_headers)

    add_res = requests.post(
        f"{cart_url}/items",
        json={'productId': product_id, 'quantity': 1},
        headers=customer_headers,
    )
    assert_status(add_res, 200, 'notifications setup add cart item')

    create_res = requests.post(
        order_url,
        json={'shippingAddress': {'street': 'Notif St', 'city': 'Cairo', 'country': country}},
        headers=customer_headers,
    )
    body = assert_success(create_res, 201, 'notifications setup create order')
    order_payload = body.get('data', {})
    order_obj = order_payload.get('order', order_payload)
    return order_obj['_id']


def trigger_success_payment(order_id, transaction_id=None):
    tx_id = transaction_id or int(time.time() * 1000)
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


def connect_socket_or_skip(sio, room, context):
    last_error = None
    for _ in range(3):
        try:
            sio.connect(socket_url, wait_timeout=6)
            sio.emit('joinRoom', room)
            return
        except Exception as exc:
            last_error = exc
            try:
                if sio.connected:
                    sio.disconnect()
            except Exception:
                pass
            time.sleep(0.5)

    pytest.skip(f"{context}: socket connection unavailable in environment ({last_error})")


@pytest.fixture(scope='module')
def notifications_ctx():
    owner_headers, category_id, product_id = create_owner_product_for_notifications()

    customer_email = f"notif_user_{unique_suffix()}@example.com"
    customer_register = requests.post(
        f"{BASE_URL}/auth/register",
        json={'email': customer_email, 'password': 'password123', 'firstName': 'Notif', 'lastName': 'User'},
    )
    assert_status(customer_register, 201, 'notifications setup customer register')

    customer_login = requests.post(
        f"{BASE_URL}/auth/login", json={'email': customer_email, 'password': 'password123'}
    )
    customer_body = assert_success(customer_login, 200, 'notifications setup customer login')
    customer_headers = auth_header(customer_body['data']['token'])
    customer_id = customer_body['data']['_id']

    verify_token = create_email_verification_token(customer_id)
    verify_res = requests.post(f"{BASE_URL}/auth/verify-email/{verify_token}")
    assert_success(verify_res, 200, "notifications verify customer email")

    other_email = f"notif_other_{unique_suffix()}@example.com"
    other_register = requests.post(
        f"{BASE_URL}/auth/register",
        json={'email': other_email, 'password': 'password123', 'firstName': 'Notif', 'lastName': 'Other'},
    )
    assert_status(other_register, 201, 'notifications setup other register')

    other_login = requests.post(
        f"{BASE_URL}/auth/login", json={'email': other_email, 'password': 'password123'}
    )
    other_body = assert_success(other_login, 200, 'notifications setup other login')
    other_headers = auth_header(other_body['data']['token'])
    other_id = other_body['data']['_id']

    other_verify = create_email_verification_token(other_id)
    verify_res = requests.post(f"{BASE_URL}/auth/verify-email/{other_verify}")
    assert_success(verify_res, 200, "notifications verify other email")

    requests.delete(notification_url, headers=customer_headers)
    requests.delete(notification_url, headers=other_headers)
    requests.delete(cart_url, headers=customer_headers)
    requests.delete(cart_url, headers=other_headers)

    ctx = {
        'customer_headers': customer_headers,
        'customer_email': customer_email,
        'other_headers': other_headers,
        'customer_id': customer_id,
        'product_id': product_id,
        'owner_headers': owner_headers,
        'category_id': category_id,
    }

    yield ctx

    requests.delete(cart_url, headers=customer_headers)
    requests.delete(cart_url, headers=other_headers)
    requests.delete(notification_url, headers=customer_headers)
    requests.delete(notification_url, headers=other_headers)
    requests.delete(f"{product_url}/{product_id}", headers=owner_headers)
    requests.delete(f"{category_url}/{category_id}", headers=owner_headers)


def test_notifications_requires_auth(notifications_ctx):
    res = requests.get(notification_url)
    assert_error(res, 401, 'TOKEN_MISSING', 'no token', 'notifications requires auth')


def test_notifications_created_on_payment_success(notifications_ctx):
    order_id = create_order(notifications_ctx['customer_headers'], notifications_ctx['product_id'])

    webhook_res = trigger_success_payment(order_id)
    assert_status(webhook_res, 200, 'notifications webhook payment trigger')

    list_res = requests.get(notification_url, headers=notifications_ctx['customer_headers'])
    list_body = assert_success(list_res, 200, 'notifications list after payment success')

    assert list_body['count'] >= 1
    assert any(item.get('type') == 'payment-success' for item in list_body['data'])


def test_notifications_mark_single_read_and_cross_user_protection(notifications_ctx):
    list_res = requests.get(notification_url, headers=notifications_ctx['customer_headers'])
    list_body = assert_success(list_res, 200, 'notifications list for mark single')
    target_id = list_body['data'][0]['_id']

    mark_res = requests.patch(f"{notification_url}/{target_id}/read", headers=notifications_ctx['customer_headers'])
    mark_body = assert_success(mark_res, 200, 'notifications mark one read')
    assert mark_body['data']['read'] is True

    foreign_mark_res = requests.patch(f"{notification_url}/{target_id}/read", headers=notifications_ctx['other_headers'])
    assert_error(foreign_mark_res, 404, None, 'Notification not found', 'notifications cross-user mark blocked')


def test_notifications_mark_all_read_and_clear(notifications_ctx):
    mark_all_res = requests.patch(f"{notification_url}/read-all", headers=notifications_ctx['customer_headers'])
    mark_all_body = assert_success(mark_all_res, 200, 'notifications mark all read')
    assert mark_all_body['count'] >= 0

    list_res = requests.get(notification_url, headers=notifications_ctx['customer_headers'])
    list_body = assert_success(list_res, 200, 'notifications list verify all read')
    assert all(item['read'] for item in list_body['data'])

    clear_res = requests.delete(notification_url, headers=notifications_ctx['customer_headers'])
    clear_body = assert_success(clear_res, 200, 'notifications clear all')
    assert clear_body['count'] >= 0

    after_clear = requests.get(notification_url, headers=notifications_ctx['customer_headers'])
    after_clear_body = assert_success(after_clear, 200, 'notifications list after clear')
    assert after_clear_body['count'] == 0


def test_notifications_persist_across_relogin(notifications_ctx):
    order_id = create_order(notifications_ctx['customer_headers'], notifications_ctx['product_id'])

    webhook_res = trigger_success_payment(order_id)
    assert_status(webhook_res, 200, 'notifications persist setup payment')

    customer_headers = notifications_ctx['customer_headers']
    me_before = requests.get(notification_url, headers=customer_headers)
    before_body = assert_success(me_before, 200, 'notifications before relogin')

    relogin = requests.post(
        f"{BASE_URL}/auth/login",
        json={'email': notifications_ctx['customer_email'], 'password': 'password123'},
    )
    relogin_body = assert_success(relogin, 200, 'notifications relogin user')
    relogin_headers = auth_header(relogin_body['data']['token'])

    me_after = requests.get(notification_url, headers=relogin_headers)
    after_body = assert_success(me_after, 200, 'notifications after relogin check')
    assert after_body['count'] >= before_body['count']


def test_notifications_limit_boundary(notifications_ctx):
    list_res = requests.get(f"{notification_url}?limit=1", headers=notifications_ctx['customer_headers'])
    list_body = assert_success(list_res, 200, 'notifications list with limit')
    assert list_body['count'] <= 1


@pytest.mark.timeout(20)
def test_customer_websocket_receives_payment_success_event(notifications_ctx):
    order_id = create_order(notifications_ctx['customer_headers'], notifications_ctx['product_id'])

    sio = socketio.Client(reconnection=False, logger=False, engineio_logger=False)
    captured = []

    @sio.on('paymentSuccess')
    def on_payment_success(data):
        captured.append(data)

    try:
        connect_socket_or_skip(sio, notifications_ctx['customer_id'], 'customer websocket test')

        webhook_res = trigger_success_payment(order_id, transaction_id=int(time.time() * 1000) + 1)
        assert_status(webhook_res, 200, 'customer websocket trigger payment success')

        deadline = time.time() + 8
        while time.time() < deadline and not captured:
            time.sleep(0.15)

        assert captured, 'Expected paymentSuccess websocket event for customer room'
        assert 'message' in captured[0]
    finally:
        if sio.connected:
            sio.disconnect()


@pytest.mark.timeout(25)
def test_admin_websocket_receives_payment_event(notifications_ctx):
    pending_order_id = create_order(notifications_ctx['customer_headers'], notifications_ctx['product_id'])

    sio = socketio.Client(reconnection=False, logger=False, engineio_logger=False)
    captured = []

    @sio.on('adminOrderPaid')
    def on_admin_paid(data):
        captured.append(data)

    try:
        connect_socket_or_skip(sio, 'admin_room', 'admin websocket test')

        webhook_res = trigger_success_payment(pending_order_id, transaction_id=int(time.time() * 1000) + 2)
        assert_status(webhook_res, 200, 'admin websocket webhook callback')

        deadline = time.time() + 8
        while time.time() < deadline and not captured:
            time.sleep(0.15)

        assert captured, 'Expected adminOrderPaid websocket event for admin room'
        assert 'message' in captured[0]
    finally:
        if sio.connected:
            sio.disconnect()
