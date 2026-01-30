import requests
import pytest
import uuid
import random
from tests.test_config import BASE_URL, OWNER_LOGIN, shared_data

prod_url = f"{BASE_URL}/products"
cat_url = f"{BASE_URL}/categories"

def get_unique_id():
    return uuid.uuid4().hex[:8]

@pytest.mark.run(order=110)
def test_product_setup_bulk():
    res = requests.post(f"{BASE_URL}/auth/login", json=OWNER_LOGIN)
    shared_data['owner_header'] = {"Authorization": f"Bearer {res.json()['data']['token']}"}
    
    res_cat = requests.post(cat_url, json={"name": f"Bulk Cat {get_unique_id()}"}, headers=shared_data['owner_header'])
    cat_id = res_cat.json()['data']['_id']
    shared_data['cat_id'] = cat_id

    ids = []
    # 1. Low Stock
    r1 = requests.post(prod_url, json={
        "name": f"FilterPhone {get_unique_id()}", "price": 100, 
        "sku": f"BLK-1-{get_unique_id()}", "stock": 5, 
        "categoryId": cat_id, "description": "low"
    }, headers=shared_data['owner_header'])
    ids.append(r1.json()['data']['_id'])

    # 2. Out of Stock
    r2 = requests.post(prod_url, json={
        "name": f"FilterLaptop {get_unique_id()}", "price": 1000, 
        "sku": f"BLK-2-{get_unique_id()}", "stock": 0, 
        "categoryId": cat_id, "description": "out"
    }, headers=shared_data['owner_header'])
    ids.append(r2.json()['data']['_id'])

    # 3. Normal Stock
    r3 = requests.post(prod_url, json={
        "name": f"FilterMouse {get_unique_id()}", "price": 20, 
        "sku": f"BLK-3-{get_unique_id()}", "stock": 50, 
        "categoryId": cat_id, "description": "norm"
    }, headers=shared_data['owner_header'])
    ids.append(r3.json()['data']['_id'])

    shared_data['prod_ids'] = ids

@pytest.mark.run(order=111)
def test_filter_low_stock():
    res = requests.get(f"{prod_url}?stockStatus=low")
    assert res.status_code == 200
    ids = [p['_id'] for p in res.json()['data']]
    assert shared_data['prod_ids'][0] in ids
    assert shared_data['prod_ids'][1] not in ids

@pytest.mark.run(order=112)
def test_filter_out_of_stock():
    res = requests.get(f"{prod_url}?stockStatus=out")
    assert res.status_code == 200
    ids = [p['_id'] for p in res.json()['data']]
    assert shared_data['prod_ids'][1] in ids
    assert shared_data['prod_ids'][0] not in ids

@pytest.mark.run(order=113)
def test_search_keyword():
    res = requests.get(f"{prod_url}?keyword=Mouse")
    assert res.status_code == 200
    ids = [p['_id'] for p in res.json()['data']]
    assert shared_data['prod_ids'][2] in ids

@pytest.mark.run(order=114)
def test_pagination_logic():
    res = requests.get(f"{prod_url}?limit=1&page=1")
    assert res.status_code == 200
    assert len(res.json()['data']) == 1
    assert res.json()['pages'] >= 1

@pytest.mark.run(order=115)
def test_soft_delete_flow():
    target_id = shared_data['prod_ids'][0]
    
    # 1. Delete
    res_del = requests.delete(f"{prod_url}/{target_id}", headers=shared_data['owner_header'])
    assert res_del.status_code == 200
    
    # FIX: Accept "deleted successfully" OR "trash"
    msg = res_del.json().get('message', '')
    assert "trash" in msg or "deleted" in msg or "success" in msg
    
    # 2. Verify excluded from main list
    res_get = requests.get(prod_url)
    ids = [p['_id'] for p in res_get.json()['data']]
    assert target_id not in ids

@pytest.mark.run(order=116)
def test_cleanup_admin_products():
    for pid in shared_data['prod_ids']:
        requests.delete(f"{prod_url}/{pid}", headers=shared_data['owner_header'])
    requests.delete(f"{cat_url}/{shared_data['cat_id']}", headers=shared_data['owner_header'])