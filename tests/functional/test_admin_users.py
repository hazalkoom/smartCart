import requests
import pytest
import uuid
from tests.test_config import BASE_URL, OWNER_LOGIN, shared_data

user_url = f"{BASE_URL}/users"
auth_url = f"{BASE_URL}/auth"

def get_unique_id():
    return uuid.uuid4().hex[:8]

@pytest.mark.run(order=100)
def test_setup_users():
    # 1. Login Owner
    res = requests.post(f"{auth_url}/login", json=OWNER_LOGIN)
    assert res.status_code == 200, f"Owner login failed: {res.text}"
    shared_data['owner_header'] = {"Authorization": f"Bearer {res.json()['data']['token']}"}
    shared_data['owner_id'] = res.json()['data']['_id']

    # 2. Create & Login Admin
    admin_email = f"admin_{get_unique_id()}@test.com"
    # FIX: Use longer password and check registration status
    res_reg = requests.post(f"{auth_url}/register", json={
        "email": admin_email, "password": "password123", "firstName": "Admin", "lastName": "User"
    })
    assert res_reg.status_code == 201, f"Admin registration failed: {res_reg.text}"
    
    res_admin = requests.post(f"{auth_url}/login", json={"email": admin_email, "password": "password123"})
    assert res_admin.status_code == 200, f"Admin login failed: {res_admin.text}"
    
    shared_data['admin_header'] = {"Authorization": f"Bearer {res_admin.json()['data']['token']}"}
    shared_data['admin_id'] = res_admin.json()['data']['_id']

    # 3. Create Target User
    user_email = f"target_{get_unique_id()}@test.com"
    # FIX: Use longer password and check registration status
    res_reg_user = requests.post(f"{auth_url}/register", json={
        "email": user_email, "password": "password123", "firstName": "Target", "lastName": "User"
    })
    assert res_reg_user.status_code == 201, f"Target user registration failed: {res_reg_user.text}"
    
    res_user = requests.post(f"{auth_url}/login", json={"email": user_email, "password": "password123"})
    assert res_user.status_code == 200, f"Target user login failed: {res_user.text}"
    
    shared_data['target_id'] = res_user.json()['data']['_id']

@pytest.mark.run(order=101)
def test_get_all_users_owner_pagination():
    res = requests.get(f"{user_url}?limit=2&page=1", headers=shared_data['owner_header'])
    assert res.status_code == 200
    assert 'count' in res.json()
    assert isinstance(res.json()['data'], list)
    assert len(res.json()['data']) <= 2

@pytest.mark.run(order=102)
def test_get_all_users_security_intruder():
    res = requests.get(user_url, headers=shared_data['admin_header'])
    assert res.status_code == 403

@pytest.mark.run(order=103)
def test_promote_user_to_admin():
    target_id = shared_data['target_id']
    res = requests.put(f"{user_url}/{target_id}", json={"role": "admin"}, headers=shared_data['owner_header'])
    assert res.status_code == 200
    assert res.json()['data']['role'] == "admin"

@pytest.mark.run(order=104)
def test_owner_cannot_demote_self():
    owner_id = shared_data['owner_id']
    res = requests.put(f"{user_url}/{owner_id}", json={"role": "customer"}, headers=shared_data['owner_header'])
    assert res.status_code == 400
    
    # Robust error message check
    response_json = res.json()
    msg = response_json.get('message') or response_json.get('error', {}).get('message', '')
    assert "Owner" in msg

@pytest.mark.run(order=105)
def test_update_non_existent_user():
    fake_id = "605d5b1d9c3e1a001f7b8b1a"
    res = requests.put(f"{user_url}/{fake_id}", json={"role": "admin"}, headers=shared_data['owner_header'])
    assert res.status_code == 404

@pytest.mark.run(order=106)
def test_delete_user_lifecycle():
    target_id = shared_data['target_id']
    res_del = requests.delete(f"{user_url}/{target_id}", headers=shared_data['owner_header'])
    assert res_del.status_code == 200
    
    res_get = requests.get(f"{user_url}/{target_id}", headers=shared_data['owner_header'])
    assert res_get.status_code == 404

@pytest.mark.run(order=107)
def test_owner_delete_self_fails():
    owner_id = shared_data['owner_id']
    res = requests.delete(f"{user_url}/{owner_id}", headers=shared_data['owner_header'])
    assert res.status_code == 400