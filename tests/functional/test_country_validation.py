import pytest
import requests

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


def create_owner_product_for_country_test():
    owner_login = requests.post(f"{BASE_URL}/auth/login", json=OWNER_LOGIN)
    owner_body = assert_success(owner_login, 200, 'country setup owner login')
    owner_headers = auth_header(owner_body['data']['token'])

    category_res = requests.post(
        category_url,
        json={'name': f'Country Test Cat {unique_suffix()}'},
        headers=owner_headers,
    )
    category_body = assert_success(category_res, 201, 'country setup create category')
    category_id = category_body['data']['_id']

    product_res = requests.post(
        product_url,
        json={
            'name': f'Country Test Product {unique_suffix()}',
            'description': 'Country validation test product',
            'price': 70.0,
            'sku': f'COUNTRY-{unique_suffix()}',
            'stock': 150,
            'categoryId': category_id,
        },
        headers=owner_headers,
    )
    product_body = assert_success(product_res, 201, 'country setup create product')
    product_id = product_body['data']['_id']

    return owner_headers, category_id, product_id


def add_to_cart(headers, product_id):
    requests.delete(cart_url, headers=headers)
    res = requests.post(f"{cart_url}/items", json={'productId': product_id, 'quantity': 1}, headers=headers)

    assert_status(res, 200, 'country add to cart')


def create_order(headers, country):
    return requests.post(
        order_url,
        json={'shippingAddress': {'street': 'Country St', 'city': 'Cairo', 'country': country}},
        headers=headers,
    )


def add_address(headers, country):
    return requests.post(
        f"{BASE_URL}/auth/addresses",
        json={
            'alias': 'Home',
            'street': '123 Main',
            'city': 'Cairo',
            'postalCode': '11511',
            'country': country,
            'isDefault': False,
        },
        headers=headers,
    )


def test_country_validation_order_and_address_contract():
    owner_headers, category_id, product_id = create_owner_product_for_country_test()
    customer_headers = None

    try:
        customer_email = f"country_user_{unique_suffix()}@example.com"
        customer_register = requests.post(
            f"{BASE_URL}/auth/register",
            json={'email': customer_email, 'password': 'password123', 'firstName': 'Country', 'lastName': 'User'},
        )
        assert_status(customer_register, 201, 'country setup register')

        customer_login = requests.post(
            f"{BASE_URL}/auth/login", json={'email': customer_email, 'password': 'password123'}
        )
        customer_body = assert_success(customer_login, 200, 'country setup login')
        customer_headers = auth_header(customer_body['data']['token'])
        customer_id = customer_body['data']['_id']

        verify_token = create_email_verification_token(customer_id)
        verify_res = requests.post(f"{BASE_URL}/auth/verify-email/{verify_token}")
        assert_success(verify_res, 200, 'country setup verify email')

        # Positive: Egypt accepted in order flow
        add_to_cart(customer_headers, product_id)
        order_eg = create_order(customer_headers, 'Egypt')
        assert_success(order_eg, 201, 'country order egypt accepted')

        # Positive: Arab country accepted in order flow
        add_to_cart(customer_headers, product_id)
        order_sa = create_order(customer_headers, 'Saudi Arabia')
        assert_success(order_sa, 201, 'country order saudi accepted')

        # Negative: unsupported country rejected
        add_to_cart(customer_headers, product_id)
        order_bad = create_order(customer_headers, 'Wakanda')
        assert_error(order_bad, 400, 'VALIDATION_ERROR', 'Country is invalid or unsupported', 'country unsupported rejected')

        # Negative/security: injection-like country rejected
        add_to_cart(customer_headers, product_id)
        order_injection = create_order(customer_headers, "<script>alert('x')</script>")
        assert_error(order_injection, 400, 'VALIDATION_ERROR', 'Country is invalid or unsupported', 'country injection rejected')

        # Positive: valid address country accepted
        addr_ok = add_address(customer_headers, 'United Arab Emirates')
        assert_success(addr_ok, 201, 'country address uae accepted')

        # Negative/security: malformed address country rejected
        addr_bad = add_address(customer_headers, {'$ne': ''})
        assert_error(addr_bad, 400, 'VALIDATION_ERROR', 'Country must be a string', 'country address object rejected')

        # Negative: empty address country rejected
        addr_empty = add_address(customer_headers, '')
        assert_error(addr_empty, 400, 'VALIDATION_ERROR', 'Country is required', 'country address empty rejected')
    finally:
        if customer_headers:
            requests.delete(cart_url, headers=customer_headers)
        requests.delete(f"{product_url}/{product_id}", headers=owner_headers)
        requests.delete(f"{category_url}/{category_id}", headers=owner_headers)
