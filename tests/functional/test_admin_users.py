import requests
import pytest
from tests.test_config import BASE_URL, OWNER_LOGIN
from tests.helpers.api_assertions import (
    assert_error,
    assert_status,
    assert_success,
    auth_header,
    unique_suffix,
)

user_url = f"{BASE_URL}/users"
auth_url = f"{BASE_URL}/auth"


@pytest.fixture(scope='module')
def admin_users_ctx():
    # Owner
    res = requests.post(f"{auth_url}/login", json=OWNER_LOGIN)
    body = assert_success(res, 200, "admin users setup owner login")
    owner_header = auth_header(body['data']['token'])
    owner_id = body['data']['_id']

    # Admin user (still customer role initially)
    admin_email = f"admin_{unique_suffix()}@test.com"
    res_reg = requests.post(
        f"{auth_url}/register",
        json={"email": admin_email, "password": "password123", "firstName": "Admin", "lastName": "User"},
    )
    assert_status(res_reg, 201, "admin users setup admin register")

    res_admin = requests.post(f"{auth_url}/login", json={"email": admin_email, "password": "password123"})
    admin_body = assert_success(res_admin, 200, "admin users setup admin login")
    admin_header = auth_header(admin_body['data']['token'])
    admin_id = admin_body['data']['_id']

    # Target user
    user_email = f"target_{unique_suffix()}@test.com"
    res_reg_user = requests.post(
        f"{auth_url}/register",
        json={"email": user_email, "password": "password123", "firstName": "Target", "lastName": "User"},
    )
    assert_status(res_reg_user, 201, "admin users setup target register")

    res_user = requests.post(f"{auth_url}/login", json={"email": user_email, "password": "password123"})
    user_body = assert_success(res_user, 200, "admin users setup target login")

    return {
        'owner_header': owner_header,
        'owner_id': owner_id,
        'admin_header': admin_header,
        'admin_id': admin_id,
        'target_id': user_body['data']['_id'],
    }


@pytest.mark.run(order=5)
def test_setup_users(admin_users_ctx):
    assert admin_users_ctx['owner_id']
    assert admin_users_ctx['admin_id']
    assert admin_users_ctx['target_id']


@pytest.mark.run(order=6)
def test_get_all_users_owner_pagination(admin_users_ctx):
    res = requests.get(f"{user_url}?limit=2&page=1", headers=admin_users_ctx['owner_header'])
    body = assert_success(res, 200, "admin users list pagination")
    assert 'count' in body
    assert isinstance(body['data'], list)
    assert len(body['data']) <= 2


@pytest.mark.run(order=7)
def test_get_all_users_security_intruder(admin_users_ctx):
    res = requests.get(user_url, headers=admin_users_ctx['admin_header'])
    assert_error(res, 403, 'FORBIDDEN', 'not authorized', 'admin users intruder access')


@pytest.mark.run(order=8)
def test_promote_user_to_admin(admin_users_ctx):
    target_id = admin_users_ctx['target_id']
    res = requests.put(f"{user_url}/{target_id}", json={"role": "admin"}, headers=admin_users_ctx['owner_header'])
    body = assert_success(res, 200, "promote user to admin")
    assert body['data']['role'] == 'admin'


@pytest.mark.run(order=9)
def test_owner_cannot_demote_self(admin_users_ctx):
    owner_id = admin_users_ctx['owner_id']
    res = requests.put(f"{user_url}/{owner_id}", json={"role": "customer"}, headers=admin_users_ctx['owner_header'])
    assert_status(res, 400, "owner cannot demote self")

    response_json = res.json()
    msg = response_json.get('message') or response_json.get('error', {}).get('message', '')
    assert 'Owner' in msg


@pytest.mark.run(order=10)
def test_update_non_existent_user(admin_users_ctx):
    fake_id = '605d5b1d9c3e1a001f7b8b1a'
    res = requests.put(f"{user_url}/{fake_id}", json={"role": "admin"}, headers=admin_users_ctx['owner_header'])
    assert_error(res, 404, message_contains='User not found', context='update non-existent user')


@pytest.mark.run(order=11)
def test_delete_user_lifecycle(admin_users_ctx):
    target_id = admin_users_ctx['target_id']
    res_del = requests.delete(f"{user_url}/{target_id}", headers=admin_users_ctx['owner_header'])
    assert_success(res_del, 200, "delete target user")

    res_get = requests.get(f"{user_url}/{target_id}", headers=admin_users_ctx['owner_header'])
    assert_error(res_get, 404, message_contains='User not found', context='get deleted user')


@pytest.mark.run(order=12)
def test_owner_delete_self_fails(admin_users_ctx):
    owner_id = admin_users_ctx['owner_id']
    res = requests.delete(f"{user_url}/{owner_id}", headers=admin_users_ctx['owner_header'])
    assert_status(res, 400, "owner delete self fails")
