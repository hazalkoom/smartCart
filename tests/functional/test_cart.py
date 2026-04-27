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

cart_url = f"{BASE_URL}/cart"
product_url = f"{BASE_URL}/products"
category_url = f"{BASE_URL}/categories"


@pytest.fixture(scope='module')
def cart_ctx():
    created_products = []

    res_login = requests.post(f"{BASE_URL}/auth/login", json=OWNER_LOGIN)
    body = assert_success(res_login, 200, "cart setup owner login")
    owner_headers = auth_header(body['data']['token'])

    # Deterministic start state for this module.
    requests.delete(cart_url, headers=owner_headers)

    cat_name = f"Cart Test Cat {unique_suffix()}"
    res_cat = requests.post(category_url, json={"name": cat_name}, headers=owner_headers)
    cat_body = assert_success(res_cat, 201, "cart setup create category")
    category_id = cat_body['data']['_id']

    product_data = {
        "name": f"Cart Test Product {unique_suffix()}",
        "price": 10.50,
        "sku": f"CART-TEST-{unique_suffix()}",
        "stock": 50,
        "categoryId": category_id,
        "description": "A product for cart testing"
    }
    res_prod = requests.post(product_url, json=product_data, headers=owner_headers)
    prod_body = assert_success(res_prod, 201, "cart setup create product")
    product_id = prod_body['data']['_id']
    created_products.append(product_id)

    ctx = {
        'owner_headers': owner_headers,
        'category_id': category_id,
        'product_id': product_id,
        'product_stock': 50,
        'product_price': 10.50,
        'cart_item_id': None,
        'created_products': created_products,
    }

    yield ctx

    requests.delete(cart_url, headers=owner_headers)
    for pid in created_products:
        requests.delete(f"{product_url}/{pid}", headers=owner_headers)
    requests.delete(f"{category_url}/{category_id}", headers=owner_headers)

# --- Helper Test (Order 27) ---

@pytest.mark.run(order=44)
def test_cart_setup(cart_ctx):
    assert cart_ctx['product_id']
    assert cart_ctx['category_id']
# --- 2. Cart (GET) Tests ---

@pytest.mark.run(order=45)
def test_get_empty_cart(cart_ctx):
    res = requests.get(cart_url, headers=cart_ctx['owner_headers'])
    data = get_data(res, "get empty cart")
    assert data['items'] == []
    assert data['subtotal'] == 0

# --- 3. Add Item (POST) Tests ---

@pytest.mark.run(order=46)
def test_add_item_validation_fails(cart_ctx):
    # Scenario 1: Missing ProductID
    res = requests.post(f"{cart_url}/items", json={"quantity": 1}, headers=cart_ctx['owner_headers'])
    assert_error(res, 400, 'VALIDATION_ERROR', 'Product ID is required', 'add item missing productId')
    
    # Scenario 2: Bad Quantity
    res = requests.post(f"{cart_url}/items", json={"productId": "123", "quantity": 0}, headers=cart_ctx['owner_headers'])
    assert_error(res, 400, 'VALIDATION_ERROR', 'positive integer', 'add item invalid quantity')

@pytest.mark.run(order=46)
def test_add_item_product_not_found(cart_ctx):
    fake_id = "605d5b1d9c3e1a001f7b8b1a"
    res = requests.post(f"{cart_url}/items", json={"productId": fake_id, "quantity": 1}, headers=cart_ctx['owner_headers'])
    assert_error(res, 404, 'NOT_FOUND', 'Product not found', 'add item product not found')

@pytest.mark.run(order=47)
def test_add_item_happy_path(cart_ctx):
    res = requests.post(
        f"{cart_url}/items",
        json={"productId": cart_ctx['product_id'], "quantity": 2},
        headers=cart_ctx['owner_headers'],
    )
    data = get_data(res, "add item happy path")
    assert len(data['items']) == 1
    assert data['items'][0]['quantity'] == 2
    assert data['subtotal'] == cart_ctx['product_price'] * 2
    assert '_id' in data['items'][0]
    
    # Save the cart's item_id for later tests
    cart_ctx['cart_item_id'] = data['items'][0]['_id']

@pytest.mark.run(order=48)
def test_add_item_insufficient_stock(cart_ctx):
    res = requests.post(
        f"{cart_url}/items",
        json={"productId": cart_ctx['product_id'], "quantity": cart_ctx['product_stock'] + 100},
        headers=cart_ctx['owner_headers'],
    )
    assert_error(
        res,
        409,
        'INSUFFICIENT_STOCK',
        'Over-selling prevented',
        'add item insufficient stock',
    )


@pytest.mark.run(order=48.5)
def test_add_item_zero_stock_product(cart_ctx):
    """
    Gap Analysis Test: Attempt to add a product that has zero stock.
    """
    # Create a product with zero stock
    cat_id = cart_ctx['category_id']
    zero_stock_product = {
        "name": f"Zero Stock Product {unique_suffix()}",
        "price": 15.00,
        "sku": f"ZERO-{unique_suffix()}",
        "stock": 0,
        "categoryId": cat_id,
        "description": "This product has no stock"
    }
    
    res_create = requests.post(product_url, json=zero_stock_product, headers=cart_ctx['owner_headers'])
    body = assert_success(res_create, 201, "create zero stock product")
    
    zero_prod_id = body['data']['_id']
    cart_ctx['created_products'].append(zero_prod_id)
    
    # Try to add it to cart - should fail
    res = requests.post(f"{cart_url}/items", json={"productId": zero_prod_id, "quantity": 1}, headers=cart_ctx['owner_headers'])
    assert_error(res, 409, 'INSUFFICIENT_STOCK', 'Over-selling prevented', 'add zero-stock product')


@pytest.mark.run(order=49)
def test_add_item_again_updates_quantity(cart_ctx):
    # We already have 2 in the cart, add 3 more
    res = requests.post(f"{cart_url}/items", json={"productId": cart_ctx['product_id'], "quantity": 3}, headers=cart_ctx['owner_headers'])
    data = get_data(res, "add item updates quantity")
    assert len(data['items']) == 1 # Should not create a new item
    assert data['items'][0]['quantity'] == 5 # 2 + 3 = 5
    assert data['subtotal'] == cart_ctx['product_price'] * 5

# --- 4. Update Item (PUT) Tests ---

@pytest.mark.run(order=50)
def test_update_item_validation_fails(cart_ctx):
    res = requests.put(f"{cart_url}/items/{cart_ctx['cart_item_id']}", json={"quantity": 0}, headers=cart_ctx['owner_headers'])
    assert_error(res, 400, 'VALIDATION_ERROR', 'positive integer', 'update item validation')

@pytest.mark.run(order=50)
def test_update_item_not_found(cart_ctx):
    fake_item_id = "605d5b1d9c3e1a001f7b8b1a"
    res = requests.put(f"{cart_url}/items/{fake_item_id}", json={"quantity": 10}, headers=cart_ctx['owner_headers'])
    assert_error(res, 404, 'NOT_FOUND', 'Item not found in cart', 'update item not found')

@pytest.mark.run(order=51)
def test_update_item_insufficient_stock(cart_ctx):
    res = requests.put(
        f"{cart_url}/items/{cart_ctx['cart_item_id']}",
        json={"quantity": cart_ctx['product_stock'] + 100},
        headers=cart_ctx['owner_headers'],
    )
    assert_error(
        res,
        409,
        'INSUFFICIENT_STOCK',
        'Over-selling prevented',
        'update item insufficient stock',
    )

@pytest.mark.run(order=52)
def test_update_item_happy_path(cart_ctx):
    res = requests.put(f"{cart_url}/items/{cart_ctx['cart_item_id']}", json={"quantity": 10}, headers=cart_ctx['owner_headers'])
    data = get_data(res, "update item happy path")
    assert data['items'][0]['quantity'] == 10
    assert data['subtotal'] == cart_ctx['product_price'] * 10

# --- 5. Remove Item (DELETE) Tests ---

@pytest.mark.run(order=53)
def test_remove_item_not_found(cart_ctx):
    fake_item_id = "605d5b1d9c3e1a001f7b8b1a"
    res = requests.delete(f"{cart_url}/items/{fake_item_id}", headers=cart_ctx['owner_headers'])
    assert_error(res, 404, 'NOT_FOUND', 'Item not found in cart', 'remove item not found')

@pytest.mark.run(order=54)
def test_remove_item_happy_path(cart_ctx):
    res = requests.delete(f"{cart_url}/items/{cart_ctx['cart_item_id']}", headers=cart_ctx['owner_headers'])
    data = get_data(res, "remove item happy path")
    assert len(data['items']) == 0
    assert data['subtotal'] == 0

# --- 6. Clear Cart (DELETE) Test ---

@pytest.mark.run(order=55)
def test_clear_cart(cart_ctx):
    # First, add an item back
    res_add = requests.post(f"{cart_url}/items", json={"productId": cart_ctx['product_id'], "quantity": 1}, headers=cart_ctx['owner_headers'])
    add_data = get_data(res_add, "clear cart setup add")
    assert len(add_data['items']) == 1

    # Now, clear the cart
    res_clear = requests.delete(cart_url, headers=cart_ctx['owner_headers'])
    clear_data = get_data(res_clear, "clear cart")
    assert len(clear_data['items']) == 0
    assert clear_data['subtotal'] == 0

# --- 7. Security & Cleanup Tests ---

@pytest.mark.run(order=56)
def test_cart_security_no_token():
    res = requests.get(cart_url) # No headers
    assert_error(res, 401, 'TOKEN_MISSING', 'no token', 'cart security no token')

@pytest.mark.run(order=57)
def test_cart_cleanup(cart_ctx):
    # Cleanup is handled by fixture teardown; keep this test to preserve suite order markers.
    res = requests.get(cart_url, headers=cart_ctx['owner_headers'])
    assert_status(res, 200, "cart cleanup verification")