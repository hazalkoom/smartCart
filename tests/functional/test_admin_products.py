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

prod_url = f"{BASE_URL}/products"
cat_url = f"{BASE_URL}/categories"
auth_url = f"{BASE_URL}/auth"


@pytest.fixture(scope='module')
def admin_products_ctx():
    res = requests.post(f"{auth_url}/login", json=OWNER_LOGIN)
    owner_body = assert_success(res, 200, "admin products owner login")
    owner_header = auth_header(owner_body['data']['token'])

    res_cat = requests.post(cat_url, json={"name": f"Bulk Cat {unique_suffix()}"}, headers=owner_header)
    cat_body = assert_success(res_cat, 201, "admin products create category")
    cat_id = cat_body['data']['_id']

    product_ids = []
    product_specs = [
        {"name": "FilterPhone", "price": 100, "stock": 5, "description": "low"},
        {"name": "FilterLaptop", "price": 1000, "stock": 0, "description": "out"},
        {"name": "FilterMouse", "price": 20, "stock": 50, "description": "norm"},
    ]

    for idx, spec in enumerate(product_specs, start=1):
        res_prod = requests.post(
            prod_url,
            json={
                "name": f"{spec['name']} {unique_suffix()}",
                "price": spec['price'],
                "sku": f"BLK-{idx}-{unique_suffix()}",
                "stock": spec['stock'],
                "categoryId": cat_id,
                "description": spec['description'],
            },
            headers=owner_header,
        )
        prod_body = assert_success(res_prod, 201, f"admin products create {spec['name']}")
        product_ids.append(prod_body['data']['_id'])

    ctx = {
        'owner_header': owner_header,
        'cat_id': cat_id,
        'prod_ids': product_ids,
    }

    yield ctx

    for pid in ctx['prod_ids']:
        requests.delete(f"{prod_url}/{pid}", headers=ctx['owner_header'])
    requests.delete(f"{cat_url}/{ctx['cat_id']}", headers=ctx['owner_header'])


@pytest.mark.run(order=37)
def test_product_setup_bulk(admin_products_ctx):
    assert admin_products_ctx['cat_id']
    assert len(admin_products_ctx['prod_ids']) == 3


@pytest.mark.run(order=38)
def test_filter_low_stock(admin_products_ctx):
    res = requests.get(f"{prod_url}?stockStatus=low")
    assert_success(res, 200, "filter low stock")
    ids = [p['_id'] for p in get_data(res, "filter low stock data")]
    assert admin_products_ctx['prod_ids'][0] in ids
    assert admin_products_ctx['prod_ids'][1] not in ids


@pytest.mark.run(order=39)
def test_filter_out_of_stock(admin_products_ctx):
    res = requests.get(f"{prod_url}?stockStatus=out")
    assert_success(res, 200, "filter out of stock")
    ids = [p['_id'] for p in get_data(res, "filter out of stock data")]
    assert admin_products_ctx['prod_ids'][1] in ids
    assert admin_products_ctx['prod_ids'][0] not in ids


@pytest.mark.run(order=40)
def test_search_keyword(admin_products_ctx):
    res = requests.get(f"{prod_url}?keyword=Mouse")
    assert_success(res, 200, "search keyword")
    ids = [p['_id'] for p in get_data(res, "search keyword data")]
    assert admin_products_ctx['prod_ids'][2] in ids


@pytest.mark.run(order=41)
def test_pagination_logic():
    res = requests.get(f"{prod_url}?limit=1&page=1")
    body = assert_success(res, 200, "admin products pagination")
    assert len(body['data']) == 1
    assert body.get('pages', 1) >= 1


@pytest.mark.run(order=42)
def test_soft_delete_flow(admin_products_ctx):
    target_id = admin_products_ctx['prod_ids'][0]
    res_del = requests.delete(f"{prod_url}/{target_id}", headers=admin_products_ctx['owner_header'])
    assert_success(res_del, 200, "soft delete target product")

    msg = str(res_del.json().get('message', '')).lower()
    assert any(token in msg for token in ["trash", "deleted", "success"])

    res_get = requests.get(prod_url)
    assert_success(res_get, 200, "verify deleted product excluded")
    ids = [p['_id'] for p in get_data(res_get, "verify main list")]
    assert target_id not in ids


@pytest.mark.run(order=43)
def test_cleanup_admin_products(admin_products_ctx):
    for pid in admin_products_ctx['prod_ids']:
        requests.delete(f"{prod_url}/{pid}", headers=admin_products_ctx['owner_header'])
    requests.delete(f"{cat_url}/{admin_products_ctx['cat_id']}", headers=admin_products_ctx['owner_header'])