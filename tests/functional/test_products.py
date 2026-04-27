import requests
import pytest

from tests.test_config import BASE_URL, OWNER_LOGIN
from tests.helpers.api_assertions import (
    assert_error,
    assert_status,
    assert_success,
    auth_header,
    get_data,
    unique_suffix,
)

product_url = f"{BASE_URL}/products"
category_url = f"{BASE_URL}/categories"
auth_url = f"{BASE_URL}/auth"


@pytest.fixture(scope='module')
def product_ctx():
    res_owner = requests.post(f"{auth_url}/login", json=OWNER_LOGIN)
    owner_body = assert_success(res_owner, 200, "products owner login")
    owner_headers = auth_header(owner_body['data']['token'])

    customer_email = f"cust_prod_{unique_suffix()}@example.com"
    res_reg = requests.post(
        f"{auth_url}/register",
        json={"email": customer_email, "password": "password123", "firstName": "Product", "lastName": "Tester"},
    )
    assert_status(res_reg, 201, "products customer register")

    res_login = requests.post(f"{auth_url}/login", json={"email": customer_email, "password": "password123"})
    customer_body = assert_success(res_login, 200, "products customer login")
    customer_headers = auth_header(customer_body['data']['token'])

    category_name = f"Test Product Category {unique_suffix()}"
    res_cat = requests.post(category_url, json={"name": category_name}, headers=owner_headers)
    cat_body = assert_success(res_cat, 201, "products create category")

    ctx = {
        'owner_headers': owner_headers,
        'customer_headers': customer_headers,
        'category_id': cat_body['data']['_id'],
        'product_id': None,
        'product_slug': None,
        'product_sku': None,
        'second_product_id': None,
    }

    yield ctx

    if ctx.get('product_id'):
        requests.delete(f"{product_url}/{ctx['product_id']}", headers=ctx['owner_headers'])
    if ctx.get('second_product_id'):
        requests.delete(f"{product_url}/{ctx['second_product_id']}", headers=ctx['owner_headers'])
    requests.delete(f"{category_url}/{ctx['category_id']}", headers=ctx['owner_headers'])


@pytest.mark.run(order=22)
def test_product_setup_get_owner_token(product_ctx):
    assert product_ctx['owner_headers'].get('Authorization')


@pytest.mark.run(order=23)
def test_product_setup_get_customer_token(product_ctx):
    assert product_ctx['customer_headers'].get('Authorization')


@pytest.mark.run(order=24)
def test_product_setup_create_category(product_ctx):
    assert product_ctx['category_id']


@pytest.mark.run(order=25)
def test_product_security_post_no_token():
    res = requests.post(product_url, json={})
    assert_error(res, 401, 'TOKEN_MISSING', context='product post no token')


@pytest.mark.run(order=25)
def test_product_security_post_customer_token(product_ctx):
    res = requests.post(product_url, json={}, headers=product_ctx['customer_headers'])
    assert_error(res, 403, 'FORBIDDEN', context='product post customer token')


@pytest.mark.run(order=25)
def test_product_security_put_no_token():
    res = requests.put(f"{product_url}/fake-id", json={})
    assert_error(res, 401, 'TOKEN_MISSING', context='product put no token')


@pytest.mark.run(order=25)
def test_product_security_put_customer_token(product_ctx):
    res = requests.put(f"{product_url}/fake-id", json={}, headers=product_ctx['customer_headers'])
    assert_error(res, 403, 'FORBIDDEN', context='product put customer token')


@pytest.mark.run(order=25)
def test_product_security_delete_no_token():
    res = requests.delete(f"{product_url}/fake-id")
    assert_error(res, 401, 'TOKEN_MISSING', context='product delete no token')


@pytest.mark.run(order=25)
def test_product_security_delete_customer_token(product_ctx):
    res = requests.delete(f"{product_url}/fake-id", headers=product_ctx['customer_headers'])
    assert_error(res, 403, 'FORBIDDEN', context='product delete customer token')


@pytest.mark.run(order=26)
def test_create_product_validation_missing_fields(product_ctx):
    res = requests.post(product_url, json={}, headers=product_ctx['owner_headers'])
    assert_status(res, 400, "create product missing fields")
    msg = res.json()['error']['message']
    assert "name" in msg.lower() or "price" in msg.lower()


@pytest.mark.run(order=26)
def test_create_product_validation_bad_data(product_ctx):
    res = requests.post(
        product_url,
        json={
            "name": "Test",
            "description": "Test",
            "price": -10,
            "sku": "BAD",
            "stock": "fifty",
            "categoryId": "123",
        },
        headers=product_ctx['owner_headers'],
    )
    assert_status(res, 400, "create product bad data")
    msg = res.json()['error']['message']
    assert "Price must be a positive number" in msg
    assert "Stock must be a positive integer" in msg


@pytest.mark.run(order=26)
def test_update_product_validation_bad_data(product_ctx):
    res = requests.put(
        f"{product_url}/fake-id",
        json={"price": -99, "stock": "not-a-number"},
        headers=product_ctx['owner_headers'],
    )
    assert_status(res, 400, "update product bad data")
    msg = res.json()['error']['message']
    assert "Price must be a positive number" in msg
    assert "Stock must be a positive integer" in msg


@pytest.mark.run(order=27)
def test_create_product_logic_bad_category(product_ctx):
    res = requests.post(
        product_url,
        json={
            "name": "Test",
            "description": "Test",
            "price": 100,
            "sku": f"SKU-404-{unique_suffix()}",
            "stock": 10,
            "categoryId": "605d5b1d9c3e1a001f7b8b1a",
        },
        headers=product_ctx['owner_headers'],
    )
    assert_error(res, 404, message_contains='Category not found', context='create product bad category')


@pytest.mark.run(order=28)
def test_create_product_happy_path(product_ctx):
    unique_sku = f"SG-LAP-{unique_suffix()}"
    unique_name = f"SuperGamer Laptop {unique_suffix()}"

    res = requests.post(
        product_url,
        json={
            "name": unique_name,
            "description": "A high-end gaming laptop.",
            "price": 1499.99,
            "sku": unique_sku,
            "stock": 50,
            "categoryId": product_ctx['category_id'],
        },
        headers=product_ctx['owner_headers'],
    )
    body = assert_success(res, 201, "create product happy path")
    product_ctx['product_id'] = body['data']['_id']
    product_ctx['product_slug'] = body['data']['slug']
    product_ctx['product_sku'] = unique_sku


@pytest.mark.run(order=29)
def test_create_product_logic_duplicate_sku(product_ctx):
    res = requests.post(
        product_url,
        json={
            "name": "CopyCat",
            "description": "Desc",
            "price": 999,
            "sku": product_ctx['product_sku'],
            "stock": 10,
            "categoryId": product_ctx['category_id'],
        },
        headers=product_ctx['owner_headers'],
    )
    assert_status(res, 400, "create product duplicate sku")
    msg = res.json()['error']['message']
    assert "SKU already exists" in msg or "duplicate key" in msg


@pytest.mark.run(order=30)
def test_get_all_products_public(product_ctx):
    res = requests.get(product_url)
    assert_success(res, 200, "get all products")
    found = any(p['_id'] == product_ctx['product_id'] for p in get_data(res, "get all products data"))
    assert found


@pytest.mark.run(order=30.1)
def test_get_products_pagination():
    res = requests.get(f"{product_url}?page=1&limit=5")
    body = assert_success(res, 200, "products pagination page1")
    assert len(body.get('data', [])) <= 5

    res_page2 = requests.get(f"{product_url}?page=2&limit=5")
    assert_success(res_page2, 200, "products pagination page2")


@pytest.mark.run(order=30)
def test_get_single_product_public_happy_path(product_ctx):
    slug = product_ctx['product_slug']
    res = requests.get(f"{product_url}/{slug}")
    body = assert_success(res, 200, "get single product by slug")
    assert body['data']['slug'] == slug


@pytest.mark.run(order=30)
def test_get_single_product_public_not_found():
    res = requests.get(f"{product_url}/does-not-exist-{unique_suffix()}")
    assert_status(res, 404, "get single product not found")


@pytest.mark.run(order=31)
def test_update_product_logic_not_found(product_ctx):
    res = requests.put(f"{product_url}/605d5b1d9c3e1a001f7b8b1a", json={}, headers=product_ctx['owner_headers'])
    assert_error(res, 404, message_contains='Product not found', context='update product not found')


@pytest.mark.run(order=32)
def test_update_product_logic_duplicate_sku(product_ctx):
    sku_b = f"SKU-SECOND-{unique_suffix()}"
    res_create = requests.post(
        product_url,
        json={
            "name": f"Second Laptop {unique_suffix()}",
            "price": 100,
            "sku": sku_b,
            "stock": 10,
            "categoryId": product_ctx['category_id'],
            "description": "desc",
        },
        headers=product_ctx['owner_headers'],
    )
    create_body = assert_success(res_create, 201, "create second product for duplicate sku")
    product_ctx['second_product_id'] = create_body['data']['_id']

    res_update = requests.put(
        f"{product_url}/{product_ctx['product_id']}",
        json={"sku": sku_b},
        headers=product_ctx['owner_headers'],
    )
    assert_status(res_update, 400, "update product duplicate sku")
    assert "SKU already exists" in res_update.json()['error']['message']


@pytest.mark.run(order=33)
def test_update_product_happy_path(product_ctx):
    new_name = f"SuperGamer Laptop v2 {unique_suffix()}"
    res = requests.put(
        f"{product_url}/{product_ctx['product_id']}",
        json={"name": new_name, "price": 1599.99},
        headers=product_ctx['owner_headers'],
    )
    body = assert_success(res, 200, "update product happy path")
    assert body['data']['name'] == new_name
    assert body['data']['price'] == 1599.99


@pytest.mark.run(order=34)
def test_delete_product_happy_path(product_ctx):
    res = requests.delete(f"{product_url}/{product_ctx['product_id']}", headers=product_ctx['owner_headers'])
    assert_success(res, 200, "delete product happy path")
    msg = str(res.json().get('message', '')).lower()
    assert res.json().get('success') is True or 'trash' in msg


@pytest.mark.run(order=35)
def test_delete_product_logic_not_found(product_ctx):
    res = requests.delete(f"{product_url}/{product_ctx['product_id']}", headers=product_ctx['owner_headers'])
    assert_status(res, 404, "delete product second time")


@pytest.mark.run(order=36)
def test_product_cleanup_category(product_ctx):
    res = requests.delete(f"{category_url}/{product_ctx['category_id']}", headers=product_ctx['owner_headers'])
    assert_status(res, 200, "cleanup products category")