import requests
import pytest

from tests.test_config import BASE_URL, OWNER_LOGIN
from tests.helpers.api_assertions import (
    assert_status,
    assert_success,
    auth_header,
    get_data,
    unique_suffix,
)

ord_url = f"{BASE_URL}/orders"
prod_url = f"{BASE_URL}/products"
cart_url = f"{BASE_URL}/cart"
auth_url = f"{BASE_URL}/auth"
user_url = f"{BASE_URL}/users"
cat_url = f"{BASE_URL}/categories"


def _create_buyer_and_order(product_id: str):
    email = f"buyer_{unique_suffix()}@t.com"
    res_reg = requests.post(
        f"{auth_url}/register",
        json={"email": email, "password": "password123", "firstName": "B", "lastName": "B"},
    )
    assert_status(res_reg, 201, "financials buyer register")

    res_login = requests.post(f"{auth_url}/login", json={"email": email, "password": "password123"})
    buyer_body = assert_success(res_login, 200, "financials buyer login")
    buyer_header = auth_header(buyer_body['data']['token'])

    res_add = requests.post(f"{cart_url}/items", json={"productId": product_id, "quantity": 1}, headers=buyer_header)
    if res_add.status_code not in [200, 201]:
        raise AssertionError(f"financials add to cart failed: status={res_add.status_code} body={res_add.text}")

    res_order = requests.post(
        ord_url,
        json={"shippingAddress": {"street": "S", "city": "C", "country": "Egypt"}},
        headers=buyer_header,
    )
    order_body = assert_success(res_order, 201, "financials create order")
    payload = order_body.get('data', {})
    order_obj = payload.get('order', payload)
    return order_obj['_id'], buyer_header


@pytest.fixture(scope='module')
def financials_ctx():
    res_owner = requests.post(f"{auth_url}/login", json=OWNER_LOGIN)
    owner_body = assert_success(res_owner, 200, "financials owner login")
    owner_head = auth_header(owner_body['data']['token'])

    admin_email = f"admin_fin_{unique_suffix()}@test.com"
    res_reg_admin = requests.post(
        f"{auth_url}/register",
        json={"email": admin_email, "password": "password123", "firstName": "A", "lastName": "A"},
    )
    assert_status(res_reg_admin, 201, "financials admin register")

    res_adm = requests.post(f"{auth_url}/login", json={"email": admin_email, "password": "password123"})
    admin_body = assert_success(res_adm, 200, "financials admin login")
    admin_head = auth_header(admin_body['data']['token'])
    admin_id = admin_body['data']['_id']

    res_promote = requests.put(f"{user_url}/{admin_id}", json={"role": "admin"}, headers=owner_head)
    assert_success(res_promote, 200, "financials promote admin")

    res_cat = requests.post(cat_url, json={"name": f"FinCat_{unique_suffix()}"}, headers=owner_head)
    cat_body = assert_success(res_cat, 201, "financials create category")
    cat_id = cat_body['data']['_id']

    res_prod = requests.post(
        prod_url,
        json={
            "name": f"Profit Item {unique_suffix()}",
            "price": 100,
            "costPrice": 50,
            "sku": f"REF-{unique_suffix()}",
            "stock": 10,
            "categoryId": cat_id,
            "description": "d",
        },
        headers=owner_head,
    )
    prod_body = assert_success(res_prod, 201, "financials create product")

    ctx = {
        'owner_head': owner_head,
        'admin_head': admin_head,
        'fin_cat_id': cat_id,
        'prod_id': prod_body['data']['_id'],
        'ord_id': None,
    }

    yield ctx

    requests.delete(f"{prod_url}/{ctx['prod_id']}", headers=ctx['owner_head'])
    requests.delete(f"{cat_url}/{ctx['fin_cat_id']}", headers=ctx['owner_head'])


@pytest.mark.run(order=85)
def test_fin_setup(financials_ctx):
    assert financials_ctx['prod_id']
    assert financials_ctx['fin_cat_id']


@pytest.mark.run(order=86)
def test_create_order_check_cost(financials_ctx):
    order_id, _ = _create_buyer_and_order(financials_ctx['prod_id'])
    financials_ctx['ord_id'] = order_id
    assert order_id


@pytest.mark.run(order=87)
def test_privacy_check(financials_ctx):
    order_id = financials_ctx['ord_id']
    res_owner_view = requests.get(f"{ord_url}/{order_id}", headers=financials_ctx['owner_head'])
    owner_order = get_data(res_owner_view, "financials owner view")
    assert_status(res_owner_view, 200, "financials owner view status")
    owner_item = owner_order['items'][0]
    assert 'cost' in owner_item
    assert owner_item['cost'] == 50

    res_admin_view = requests.get(f"{ord_url}/{order_id}", headers=financials_ctx['admin_head'])
    admin_order = get_data(res_admin_view, "financials admin view")
    assert_status(res_admin_view, 200, "financials admin view status")
    admin_item = admin_order['items'][0]
    assert 'cost' not in admin_item


@pytest.mark.run(order=88)
def test_strict_flow_enforcement(financials_ctx):
    oid = financials_ctx['ord_id']
    h = financials_ctx['admin_head']

    res_fail = requests.patch(f"{ord_url}/{oid}/status", json={"status": "Shipped"}, headers=h)
    assert_status(res_fail, 400, "financials shipped before paid should fail")

    res_paid = requests.patch(f"{ord_url}/{oid}/status", json={"status": "Paid"}, headers=h)
    assert_success(res_paid, 200, "financials move to paid")

    res_ship = requests.patch(f"{ord_url}/{oid}/status", json={"status": "Shipped"}, headers=h)
    ship_body = assert_success(res_ship, 200, "financials move to shipped")
    assert ship_body['data']['status'] == "Shipped"


@pytest.mark.run(order=89)
def test_cancel_restores_stock(financials_ctx):
    cancel_order_id, _ = _create_buyer_and_order(financials_ctx['prod_id'])

    p_before_cancel = requests.get(f"{prod_url}/{financials_ctx['prod_id']}")
    before_body = assert_success(p_before_cancel, 200, "financials stock before cancel")
    stock_before_cancel = before_body['data']['stock']

    cancel_res = requests.patch(
        f"{ord_url}/{cancel_order_id}/status",
        json={"status": "Cancelled"},
        headers=financials_ctx['admin_head'],
    )
    assert_success(cancel_res, 200, "financials cancel order")

    p_after = requests.get(f"{prod_url}/{financials_ctx['prod_id']}")
    after_body = assert_success(p_after, 200, "financials stock after cancel")
    assert after_body['data']['stock'] == stock_before_cancel + 1


@pytest.mark.run(order=90)
def test_cleanup_financials(financials_ctx):
    requests.delete(f"{prod_url}/{financials_ctx['prod_id']}", headers=financials_ctx['owner_head'])
    requests.delete(f"{cat_url}/{financials_ctx['fin_cat_id']}", headers=financials_ctx['owner_head'])