import requests
import pytest
import uuid
from tests.test_config import BASE_URL, OWNER_LOGIN, shared_data

ord_url = f"{BASE_URL}/orders"
prod_url = f"{BASE_URL}/products"
cart_url = f"{BASE_URL}/cart"

def get_unique_id():
    return uuid.uuid4().hex[:8]

@pytest.mark.run(order=85)
def test_fin_setup():
    # 1. Login Owner
    res = requests.post(f"{BASE_URL}/auth/login", json=OWNER_LOGIN)
    assert res.status_code == 200, "Owner login failed"
    shared_data['owner_head'] = {"Authorization": f"Bearer {res.json()['data']['token']}"}
    
    # 2. Login Admin
    email = f"admin_fin_{get_unique_id()}@test.com"
    # FIX: Check registration & use strong password
    res_reg = requests.post(f"{BASE_URL}/auth/register", json={
        "email": email, "password": "password123", "firstName": "A", "lastName": "A"
    })
    assert res_reg.status_code == 201, f"Admin reg failed: {res_reg.text}"

    res_adm = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": "password123"})
    assert res_adm.status_code == 200, f"Admin login failed: {res_adm.text}"
    
    adm_id = res_adm.json()['data']['_id']
    shared_data['admin_head'] = {"Authorization": f"Bearer {res_adm.json()['data']['token']}"}
    
    # Promote
    requests.put(f"{BASE_URL}/users/{adm_id}", json={"role": "admin"}, headers=shared_data['owner_head'])

    # 3. Create Product
    cat_res = requests.post(f"{BASE_URL}/categories", json={"name": f"FinCat_{get_unique_id()}"}, headers=shared_data['owner_head'])
    cat_id = cat_res.json()['data']['_id']
    shared_data['fin_cat_id'] = cat_id
    
    p_data = {
        "name": f"Profit Item {get_unique_id()}", "price": 100, "costPrice": 50, 
        "sku": f"REF-{get_unique_id()}", "stock": 10, "categoryId": cat_id, "description": "d"
    }
    p_res = requests.post(prod_url, json=p_data, headers=shared_data['owner_head'])
    assert p_res.status_code == 201
    shared_data['prod_id'] = p_res.json()['data']['_id']

@pytest.mark.run(order=86)
def test_create_order_check_cost():
    email = f"buy_{get_unique_id()}@t.com"
    # FIX: Check registration & use strong password
    requests.post(f"{BASE_URL}/auth/register", json={
        "email": email, "password": "password123", "firstName": "B", "lastName": "B"
    })
    
    res = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": "password123"})
    assert res.status_code == 200, f"Buyer login failed: {res.text}"
    
    u_head = {"Authorization": f"Bearer {res.json()['data']['token']}"}
    
    requests.post(f"{cart_url}/items", json={"productId": shared_data['prod_id'], "quantity": 1}, headers=u_head)
    ord_res = requests.post(ord_url, json={"shippingAddress": {"street": "S", "city": "C", "country": "E"}}, headers=u_head)
    assert ord_res.status_code == 201
    order_payload = ord_res.json().get('data', {})
    order_obj = order_payload.get('order', order_payload)
    shared_data['ord_id'] = order_obj['_id']

@pytest.mark.run(order=87)
def test_privacy_check():
    # Owner Check
    r1 = requests.get(f"{ord_url}/{shared_data['ord_id']}", headers=shared_data['owner_head'])
    assert r1.status_code == 200
    item = r1.json()['data']['items'][0]
    assert 'cost' in item, "Owner must see cost"
    assert item['cost'] == 50
    
    # Admin Check
    r2 = requests.get(f"{ord_url}/{shared_data['ord_id']}", headers=shared_data['admin_head'])
    assert r2.status_code == 200
    item_admin = r2.json()['data']['items'][0]
    assert 'cost' not in item_admin, "Admin must NOT see cost"

@pytest.mark.run(order=88)
def test_strict_flow_enforcement():
    oid = shared_data['ord_id']
    h = shared_data['admin_head']
    
    # Fail
    res_fail = requests.patch(f"{ord_url}/{oid}/status", json={"status": "Shipped"}, headers=h)
    assert res_fail.status_code == 400
    
    # Success
    requests.patch(f"{ord_url}/{oid}/status", json={"status": "Paid"}, headers=h)
    res_ship = requests.patch(f"{ord_url}/{oid}/status", json={"status": "Shipped"}, headers=h)
    assert res_ship.status_code == 200
    assert res_ship.json()['data']['status'] == "Shipped"

@pytest.mark.run(order=89)
def test_cancel_restores_stock():
    h = shared_data['admin_head']

    # Create a fresh customer + fresh order that is still Pending
    email = f"cancel_{get_unique_id()}@t.com"
    requests.post(f"{BASE_URL}/auth/register", json={
        "email": email, "password": "password123", "firstName": "C", "lastName": "C"
    })

    res = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": "password123"})
    assert res.status_code == 200, f"Cancel-path buyer login failed: {res.text}"
    u_head = {"Authorization": f"Bearer {res.json()['data']['token']}"}

    add_res = requests.post(
        f"{cart_url}/items",
        json={"productId": shared_data['prod_id'], "quantity": 1},
        headers=u_head
    )
    assert add_res.status_code in [200, 201], f"Add to cart failed: {add_res.text}"

    ord_res = requests.post(
        ord_url,
        json={"shippingAddress": {"street": "S", "city": "C", "country": "E"}},
        headers=u_head
    )
    assert ord_res.status_code == 201, f"Order creation failed: {ord_res.text}"
    cancel_order_payload = ord_res.json().get('data', {})
    cancel_order_obj = cancel_order_payload.get('order', cancel_order_payload)
    cancel_order_id = cancel_order_obj['_id']

    # Stock after order creation (before cancel)
    p_before_cancel = requests.get(f"{prod_url}/{shared_data['prod_id']}")
    assert p_before_cancel.status_code == 200
    stock_before_cancel = p_before_cancel.json()['data']['stock']

    # Cancel while status is Pending -> should restock +1
    cancel_res = requests.patch(f"{ord_url}/{cancel_order_id}/status", json={"status": "Cancelled"}, headers=h)
    assert cancel_res.status_code == 200, f"Cancel failed: {cancel_res.text}"

    p_after = requests.get(f"{prod_url}/{shared_data['prod_id']}")
    assert p_after.status_code == 200
    assert p_after.json()['data']['stock'] == stock_before_cancel + 1

@pytest.mark.run(order=90)
def test_cleanup_financials():
    requests.delete(f"{prod_url}/{shared_data['prod_id']}", headers=shared_data['owner_head'])
    requests.delete(f"{BASE_URL}/categories/{shared_data['fin_cat_id']}", headers=shared_data['owner_head'])