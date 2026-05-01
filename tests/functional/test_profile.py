import requests
import pytest

from tests.test_config import BASE_URL, OWNER_LOGIN
from tests.helpers.api_assertions import (
    assert_status,
    assert_success,
    auth_header,
    create_email_verification_token,
    unique_suffix,
)

auth_url = f"{BASE_URL}/auth"
product_url = f"{BASE_URL}/products"
category_url = f"{BASE_URL}/categories"


@pytest.fixture(scope='module')
def profile_ctx():
    email = f"profile_{unique_suffix()}@test.com"
    res_reg = requests.post(
        f"{auth_url}/register",
        json={"email": email, "password": "password123", "firstName": "Pro", "lastName": "File"},
    )
    assert_status(res_reg, 201, "profile register user")

    res_login = requests.post(f"{auth_url}/login", json={"email": email, "password": "password123"})
    user_body = assert_success(res_login, 200, "profile login user")
    user_header = auth_header(user_body['data']['token'])
    user_id = user_body['data']['_id']

    verify_token = create_email_verification_token(user_id)
    verify_res = requests.post(f"{auth_url}/verify-email/{verify_token}")
    assert_success(verify_res, 200, "profile verify email")

    res_owner = requests.post(f"{auth_url}/login", json=OWNER_LOGIN)
    owner_body = assert_success(res_owner, 200, "profile owner login")
    owner_header = auth_header(owner_body['data']['token'])

    res_cat = requests.post(category_url, json={"name": f"ProfCat_{unique_suffix()}"}, headers=owner_header)
    cat_body = assert_success(res_cat, 201, "profile create category")
    cat_id = cat_body['data']['_id']

    res_prod = requests.post(
        product_url,
        json={
            "name": f"ProfProd_{unique_suffix()}",
            "price": 100,
            "sku": f"PROF-{unique_suffix()}",
            "stock": 10,
            "categoryId": cat_id,
            "description": "For wishlist",
        },
        headers=owner_header,
    )
    prod_body = assert_success(res_prod, 201, "profile create product")

    ctx = {
        'user_header': user_header,
        'owner_header': owner_header,
        'product_id': prod_body['data']['_id'],
        'category_id': cat_id,
        'address_id': None,
    }

    yield ctx

    requests.delete(f"{product_url}/{ctx['product_id']}", headers=ctx['owner_header'])
    requests.delete(f"{category_url}/{ctx['category_id']}", headers=ctx['owner_header'])


@pytest.mark.run(order=4.5)
def test_profile_setup(profile_ctx):
    assert profile_ctx['user_header'].get('Authorization')
    assert profile_ctx['product_id']


@pytest.mark.run(order=4.6)
def test_add_address(profile_ctx):
    payload = {
        "alias": "Home",
        "street": "123 Test St",
        "city": "Cairo",
        "postalCode": "12345",
        "country": "Egypt",
        "isDefault": True,
    }
    res = requests.post(f"{auth_url}/addresses", json=payload, headers=profile_ctx['user_header'])
    body = assert_success(res, 201, "profile add address")
    profile_ctx['address_id'] = body['data'][-1]['_id']


@pytest.mark.run(order=4.7)
def test_delete_address(profile_ctx):
    res = requests.delete(f"{auth_url}/addresses/{profile_ctx['address_id']}", headers=profile_ctx['user_header'])
    body = assert_success(res, 200, "profile delete address")
    assert len(body['data']) == 0


@pytest.mark.run(order=4.8)
def test_toggle_wishlist_add(profile_ctx):
    res = requests.post(
        f"{auth_url}/wishlist",
        json={"productId": profile_ctx['product_id']},
        headers=profile_ctx['user_header'],
    )
    body = assert_success(res, 200, "profile wishlist add")
    assert profile_ctx['product_id'] in body['data']


@pytest.mark.run(order=4.9)
def test_get_wishlist_populated(profile_ctx):
    res = requests.get(f"{auth_url}/wishlist", headers=profile_ctx['user_header'])
    body = assert_success(res, 200, "profile wishlist get")
    items = body['data']
    assert len(items) == 1
    assert 'name' in items[0]


@pytest.mark.run(order=4.91)
def test_toggle_wishlist_remove(profile_ctx):
    res = requests.post(
        f"{auth_url}/wishlist",
        json={"productId": profile_ctx['product_id']},
        headers=profile_ctx['user_header'],
    )
    body = assert_success(res, 200, "profile wishlist remove")
    assert profile_ctx['product_id'] not in body['data']