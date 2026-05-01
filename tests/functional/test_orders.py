import requests
import pytest
from tests.test_config import BASE_URL, OWNER_LOGIN
from tests.helpers.api_assertions import (
    assert_error,
    assert_status,
    assert_success,
    auth_header,
    create_email_verification_token,
    unique_suffix,
)

order_url = f"{BASE_URL}/orders"
product_url = f"{BASE_URL}/products"
category_url = f"{BASE_URL}/categories"
cart_url = f"{BASE_URL}/cart"


@pytest.fixture(scope='module')
def order_ctx():
    # 1. Owner login
    res_login = requests.post(f"{BASE_URL}/auth/login", json=OWNER_LOGIN)
    login_body = assert_success(res_login, 200, "order setup owner login")
    owner_headers = auth_header(login_body['data']['token'])

    # 2. Category
    cat_name = f"Order Test Cat {unique_suffix()}"
    res_cat = requests.post(category_url, json={"name": cat_name}, headers=owner_headers)
    cat_body = assert_success(res_cat, 201, "order setup create category")
    category_id = cat_body['data']['_id']

    # 3. Product (stock 10)
    product_data = {
        "name": f"Order Test Product {unique_suffix()}",
        "price": 20.00,
        "sku": f"ORDER-TEST-{unique_suffix()}",
        "stock": 10,
        "categoryId": category_id,
        "description": "A product for order testing",
    }
    res_prod = requests.post(product_url, json=product_data, headers=owner_headers)
    prod_body = assert_success(res_prod, 201, "order setup create product")

    # 4. Customer
    customer_email = f"order_customer_{unique_suffix()}@example.com"
    register_payload = {
        "email": customer_email,
        "password": "password123",
        "firstName": "Order",
        "lastName": "Customer",
    }
    res_register = requests.post(f"{BASE_URL}/auth/register", json=register_payload)
    assert_status(res_register, 201, "order setup register customer")

    res_customer_login = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": customer_email, "password": "password123"},
    )
    customer_login_body = assert_success(res_customer_login, 200, "order setup login customer")
    customer_headers = auth_header(customer_login_body['data']['token'])
    customer_id = customer_login_body['data']['_id']

    verify_token = create_email_verification_token(customer_id)
    verify_res = requests.post(f"{BASE_URL}/auth/verify-email/{verify_token}")
    assert_success(verify_res, 200, "order setup verify customer email")

    # Deterministic customer cart state for this module.
    requests.delete(cart_url, headers=customer_headers)

    ctx = {
        'owner_headers': owner_headers,
        'customer_headers': customer_headers,
        'category_id': category_id,
        'product_id': prod_body['data']['_id'],
        'product_slug': prod_body['data']['slug'],
        'product_stock': 10,
        'order_id': None,
    }

    yield ctx

    requests.delete(cart_url, headers=customer_headers)
    requests.delete(f"{product_url}/{ctx['product_id']}", headers=owner_headers)
    requests.delete(f"{category_url}/{category_id}", headers=owner_headers)


@pytest.mark.run(order=58)
def test_order_setup_login_and_create_product(order_ctx):
    assert order_ctx['product_id']
    assert order_ctx['category_id']


@pytest.mark.run(order=59)
def test_order_setup_create_customer(order_ctx):
    assert order_ctx['customer_headers'].get('Authorization', '').startswith('Bearer ')


@pytest.mark.run(order=60)
def test_order_customer_adds_to_cart(order_ctx):
    res = requests.post(
        f"{cart_url}/items",
        json={"productId": order_ctx['product_id'], "quantity": 3},
        headers=order_ctx['customer_headers'],
    )
    data = assert_success(res, 200, "order add to cart")['data']
    assert len(data['items']) == 1
    assert data['items'][0]['quantity'] == 3


@pytest.mark.run(order=61)
def test_create_order_validation_fails(order_ctx):
    # Scenario 1: Missing shippingAddress
    res = requests.post(order_url, json={}, headers=order_ctx['customer_headers'])
    assert_error(res, 400, 'VALIDATION_ERROR', 'Shipping address is required', 'order validation missing address')

    # Scenario 2: Missing street
    bad_address = {"city": "Cairo", "country": "Egypt"}
    res_street = requests.post(order_url, json={"shippingAddress": bad_address}, headers=order_ctx['customer_headers'])
    assert_error(res_street, 400, 'VALIDATION_ERROR', 'Street is required', 'order validation missing street')


@pytest.mark.run(order=62)
def test_create_order_happy_path(order_ctx):
    address = {"street": "123 Test St", "city": "Cairo", "country": "Egypt"}
    res = requests.post(order_url, json={"shippingAddress": address}, headers=order_ctx['customer_headers'])
    body = assert_success(res, 201, "order create happy path")

    data = body['data']
    order_data = data['order'] if 'order' in data else data

    assert order_data['status'] == 'Pending'
    assert order_data.get('isPaid') is False
    assert len(order_data['items']) >= 1
    assert order_data['shippingAddress']['city'] == 'Cairo'
    assert order_data['total'] == order_data['subtotal'] + order_data['tax'] + order_data['shipping']

    order_ctx['order_id'] = order_data['_id']


@pytest.mark.run(order=63)
def test_verify_cart_is_cleared(order_ctx):
    res = requests.get(cart_url, headers=order_ctx['customer_headers'])
    data = assert_success(res, 200, "order verify cart cleared")['data']
    assert len(data['items']) == 0
    assert data['subtotal'] == 0


@pytest.mark.run(order=63)
def test_verify_stock_is_reduced(order_ctx):
    res = requests.get(f"{product_url}/{order_ctx['product_slug']}")
    data = assert_success(res, 200, "order verify stock reduced")['data']

    expected_stock = order_ctx['product_stock'] - 3
    assert data['stock'] == expected_stock


@pytest.mark.run(order=63)
def test_create_order_fails_if_cart_empty(order_ctx):
    address = {"street": "123 Test St", "city": "Cairo", "country": "Egypt"}
    res = requests.post(order_url, json={"shippingAddress": address}, headers=order_ctx['customer_headers'])
    assert_status(res, 400, "order create fails when cart empty")

    json_response = res.json()
    error_msg = json_response.get('error', {}).get('message', '') or json_response.get('message', '')
    error_code = json_response.get('error', {}).get('code', '')
    assert error_code == 'CART_EMPTY' or 'empty' in error_msg.lower()


@pytest.mark.run(order=64)
def test_customer_get_my_orders(order_ctx):
    res = requests.get(f"{order_url}/my", headers=order_ctx['customer_headers'])
    body = assert_success(res, 200, "customer get my orders")
    assert body['count'] >= 1
    assert any(o['_id'] == order_ctx['order_id'] for o in body['data'])


@pytest.mark.run(order=64)
def test_customer_get_order_by_id_success(order_ctx):
    res = requests.get(f"{order_url}/{order_ctx['order_id']}", headers=order_ctx['customer_headers'])
    body = assert_success(res, 200, "customer get order by id")
    assert body['data']['_id'] == order_ctx['order_id']


@pytest.mark.run(order=64)
def test_customer_get_order_by_id_fails_for_other_order(order_ctx):
    fake_id = '605d5b1d9c3e1a001f7b8b1a'
    res = requests.get(f"{order_url}/{fake_id}", headers=order_ctx['customer_headers'])
    assert_error(res, 404, 'NOT_FOUND', 'Order not found', 'customer get invalid order')


@pytest.mark.run(order=65)
def test_admin_get_all_orders(order_ctx):
    res = requests.get(order_url, headers=order_ctx['owner_headers'])
    body = assert_success(res, 200, "admin get all orders")
    assert body['count'] >= 1


@pytest.mark.run(order=65)
def test_admin_get_customer_order_by_id(order_ctx):
    res = requests.get(f"{order_url}/{order_ctx['order_id']}", headers=order_ctx['owner_headers'])
    body = assert_success(res, 200, "admin get customer order")
    assert body['data']['_id'] == order_ctx['order_id']


@pytest.mark.run(order=65)
def test_admin_update_status_validation_fails(order_ctx):
    res = requests.patch(
        f"{order_url}/{order_ctx['order_id']}/status",
        json={"status": "InvalidStatus"},
        headers=order_ctx['owner_headers'],
    )
    assert_error(res, 400, 'VALIDATION_ERROR', 'Invalid order status', 'admin update invalid status')


@pytest.mark.run(order=65)
def test_admin_update_status_happy_path(order_ctx):
    res_paid = requests.patch(
        f"{order_url}/{order_ctx['order_id']}/status",
        json={"status": "Paid"},
        headers=order_ctx['owner_headers'],
    )
    paid_body = assert_success(res_paid, 200, "admin update status paid")
    assert paid_body['data']['status'] == 'Paid'

    res = requests.patch(
        f"{order_url}/{order_ctx['order_id']}/status",
        json={"status": "Shipped"},
        headers=order_ctx['owner_headers'],
    )
    body = assert_success(res, 200, "admin update status shipped")
    assert body['data']['status'] == 'Shipped'
    assert 'shippedAt' in body['data']


@pytest.mark.run(order=66)
def test_order_security_admin_routes_fail_for_customer(order_ctx):
    res_get = requests.get(order_url, headers=order_ctx['customer_headers'])
    assert_error(res_get, 403, 'FORBIDDEN', 'not authorized', 'order security customer get all')

    res_patch = requests.patch(
        f"{order_url}/{order_ctx['order_id']}/status",
        json={"status": "Delivered"},
        headers=order_ctx['customer_headers'],
    )
    assert_error(res_patch, 403, 'FORBIDDEN', 'not authorized', 'order security customer patch')


@pytest.mark.run(order=67)
def test_order_cleanup(order_ctx):
    # Fixture teardown handles cleanup; keep marker continuity.
    res = requests.get(f"{order_url}/{order_ctx['order_id']}", headers=order_ctx['owner_headers'])
    assert_status(res, 200, "order cleanup verification")
