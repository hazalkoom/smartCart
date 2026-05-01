import requests
import pytest
import time
from tests.test_config import BASE_URL, OWNER_LOGIN
from tests.helpers.api_assertions import (
    assert_error,
    assert_status,
    assert_success,
    auth_header,
    create_email_verification_token,
    unique_suffix,
)

review_url = f"{BASE_URL}/reviews"
product_url = f"{BASE_URL}/products"
category_url = f"{BASE_URL}/categories"


@pytest.fixture(scope='module')
def review_ctx():
    # Owner for product/category setup
    res_login = requests.post(f"{BASE_URL}/auth/login", json=OWNER_LOGIN)
    login_body = assert_success(res_login, 200, "review setup owner login")
    owner_headers = auth_header(login_body['data']['token'])

    # Category + product
    cat_name = f"Review Test Cat {unique_suffix()}"
    res_cat = requests.post(category_url, json={"name": cat_name}, headers=owner_headers)
    cat_body = assert_success(res_cat, 201, "review setup category")
    category_id = cat_body['data']['_id']

    product_data = {
        "name": f"Review Test Product {unique_suffix()}",
        "price": 50.00,
        "sku": f"REV-TEST-{unique_suffix()}",
        "stock": 100,
        "categoryId": category_id,
        "description": "Product for review testing",
    }
    res_prod = requests.post(product_url, json=product_data, headers=owner_headers)
    prod_body = assert_success(res_prod, 201, "review setup product")

    # Customer reviewer
    customer_email = f"reviewer_{unique_suffix()}@example.com"
    customer_password = "password123"
    res_reg = requests.post(
        f"{BASE_URL}/auth/register",
        json={
            "email": customer_email,
            "password": customer_password,
            "firstName": "Reviewer",
            "lastName": "Bot",
        },
    )
    assert_status(res_reg, 201, "review setup customer register")

    res_cust_login = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": customer_email, "password": customer_password},
    )
    cust_body = assert_success(res_cust_login, 200, "review setup customer login")
    customer_headers = auth_header(cust_body['data']['token'])
    customer_id = cust_body['data']['_id']

    verify_token = create_email_verification_token(customer_id)
    verify_res = requests.post(f"{BASE_URL}/auth/verify-email/{verify_token}")
    assert_success(verify_res, 200, "review setup verify customer email")

    ctx = {
        'owner_headers': owner_headers,
        'customer_headers': customer_headers,
        'category_id': category_id,
        'product_id': prod_body['data']['_id'],
        'product_slug': prod_body['data']['slug'],
        'review_id': None,
    }

    yield ctx

    requests.delete(cart_url := f"{BASE_URL}/cart", headers=customer_headers)
    if ctx['review_id']:
        requests.delete(f"{review_url}/{ctx['review_id']}", headers=customer_headers)
    requests.delete(f"{product_url}/{ctx['product_id']}", headers=owner_headers)
    requests.delete(f"{category_url}/{category_id}", headers=owner_headers)


@pytest.mark.run(order=75)
def test_review_setup(review_ctx):
    assert review_ctx['product_id']
    assert review_ctx['category_id']


@pytest.mark.run(order=76)
def test_create_review_validation(review_ctx):
    headers = review_ctx['customer_headers']

    payload = {"productId": review_ctx['product_id'], "title": "Good", "comment": "Good"}
    res = requests.post(review_url, json=payload, headers=headers)
    assert_error(res, 400, 'VALIDATION_ERROR', 'rating', 'review validation missing rating')

    payload['rating'] = 6
    res = requests.post(review_url, json=payload, headers=headers)
    assert_error(res, 400, 'VALIDATION_ERROR', 'between 1 and 5', 'review validation invalid rating')


@pytest.mark.run(order=77)
def test_create_review_happy_path(review_ctx):
    headers = review_ctx['customer_headers']

    payload = {
        "productId": review_ctx['product_id'],
        "rating": 5,
        "title": "Amazing Product",
        "comment": "I love this test product so much!",
    }

    res = requests.post(review_url, json=payload, headers=headers)
    body = assert_success(res, 201, "create review happy path")
    assert body['data']['rating'] == 5
    assert body['data']['productId'] == review_ctx['product_id']

    review_ctx['review_id'] = body['data']['_id']


@pytest.mark.run(order=78)
def test_prevent_duplicate_reviews(review_ctx):
    headers = review_ctx['customer_headers']

    payload = {
        "productId": review_ctx['product_id'],
        "rating": 1,
        "title": "Spam",
        "comment": "Trying to review again",
    }

    res = requests.post(review_url, json=payload, headers=headers)
    assert_error(res, 400, message_contains='already reviewed', context='prevent duplicate review')


@pytest.mark.run(order=79)
def test_verify_product_stats_updated(review_ctx):
    res = requests.get(f"{product_url}/{review_ctx['product_slug']}")
    data = assert_success(res, 200, "verify product stats after create")['data']
    assert data['reviewCount'] == 1
    assert data['rating'] == 5


@pytest.mark.run(order=80)
def test_update_review_permissions(review_ctx):
    payload = {"title": "Hacked Title"}
    res = requests.patch(f"{review_url}/{review_ctx['review_id']}", json=payload, headers=review_ctx['owner_headers'])
    assert_error(res, 403, message_contains='not authorized', context='review update permissions')


@pytest.mark.run(order=81)
def test_update_review_happy_path(review_ctx):
    payload = {"rating": 3, "title": "It is okay"}
    res = requests.patch(
        f"{review_url}/{review_ctx['review_id']}",
        json=payload,
        headers=review_ctx['customer_headers'],
    )
    body = assert_success(res, 200, "review update happy path")
    assert body['data']['rating'] == 3


@pytest.mark.run(order=82)
def test_verify_stats_after_update(review_ctx):
    time.sleep(0.5)
    res = requests.get(f"{product_url}/{review_ctx['product_slug']}")
    data = assert_success(res, 200, "verify stats after review update")['data']
    assert data['rating'] == 3


@pytest.mark.run(order=83)
def test_delete_review_happy_path(review_ctx):
    res = requests.delete(f"{review_url}/{review_ctx['review_id']}", headers=review_ctx['customer_headers'])
    assert_status(res, 204, "delete review happy path")


@pytest.mark.run(order=83.5)
def test_verify_stats_after_delete(review_ctx):
    res = requests.get(f"{product_url}/{review_ctx['product_slug']}")
    data = assert_success(res, 200, "verify stats after review delete")['data']
    assert data['rating'] == 0
    assert data['reviewCount'] == 0


@pytest.mark.run(order=84)
def test_review_cleanup(review_ctx):
    # Fixture teardown handles cleanup; keep marker continuity.
    res = requests.get(f"{product_url}/{review_ctx['product_slug']}")
    assert_status(res, 200, "review cleanup verification")
