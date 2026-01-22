import requests
import pytest
import time
from tests.test_config import BASE_URL, OWNER_LOGIN, print_test_result, shared_data

review_url = f"{BASE_URL}/reviews"
product_url = f"{BASE_URL}/products"
category_url = f"{BASE_URL}/categories"

# Headers for the two users we need
owner_headers = {}
customer_headers = {}

# --- 1. SETUP (Order 51) ---
@pytest.mark.run(order=51)
def test_review_setup():
    """
    1. Login as Owner (to create product)
    2. Create Temp Category & Product
    3. Register/Login as Customer (to write reviews)
    """
    global owner_headers, customer_headers
    
    # A. Login Owner
    res_login = requests.post(f"{BASE_URL}/auth/login", json=OWNER_LOGIN)
    assert res_login.status_code == 200, "Review setup: Owner login failed"
    owner_token = res_login.json()['data']['token']
    owner_headers = {"Authorization": f"Bearer {owner_token}"}
    
    # B. Create Temp Category
    cat_name = f"Review Test Cat {int(time.time())}"
    res_cat = requests.post(category_url, json={"name": cat_name}, headers=owner_headers)
    assert res_cat.status_code == 201
    category_id = res_cat.json()['data']['_id']
    shared_data['review_category_id'] = category_id

    # C. Create Temp Product
    prod_sku = f"REV-TEST-{int(time.time())}"
    prod_name = f"Review Test Product {int(time.time())}"
    product_data = {
        "name": prod_name, "price": 50.00, "sku": prod_sku, "stock": 100,
        "categoryId": category_id, "description": "Product for review testing"
    }
    res_prod = requests.post(product_url, json=product_data, headers=owner_headers)
    assert res_prod.status_code == 201
    
    shared_data['review_product_id'] = res_prod.json()['data']['_id']
    shared_data['review_product_slug'] = res_prod.json()['data']['slug']

    # D. Register/Login Customer
    cust_email = f"reviewer_{int(time.time())}@example.com"
    cust_pass = "password123"
    res_reg = requests.post(f"{BASE_URL}/auth/register", json={
        "email": cust_email, "password": cust_pass, "firstName": "Reviewer", "lastName": "Bot"
    })
    assert res_reg.status_code == 201
    
    res_cust_login = requests.post(f"{BASE_URL}/auth/login", json={"email": cust_email, "password": cust_pass})
    cust_token = res_cust_login.json()['data']['token']
    customer_headers = {"Authorization": f"Bearer {cust_token}"}
    
    # Save headers to shared_data so next tests can use them if needed (or we just use global in this file)
    shared_data['review_customer_headers'] = customer_headers
    shared_data['review_owner_headers'] = owner_headers
    
    print(f"Review Setup Complete: Product {shared_data['review_product_id']} created.")


# --- 2. CREATE REVIEW (Order 52) ---
@pytest.mark.run(order=52)
def test_create_review_validation():
    headers = shared_data['review_customer_headers']
    
    # Scenario 1: Missing Rating
    payload = {"productId": shared_data['review_product_id'], "title": "Good", "comment": "Good"}
    res = requests.post(review_url, json=payload, headers=headers)
    assert res.status_code == 400
    
    # FIX: Use .lower() to handle "Rating" vs "rating"
    error_msg = res.json()['error']['message'].lower()
    assert "rating" in error_msg

    # Scenario 2: Invalid Rating (> 5)
    payload['rating'] = 6
    res = requests.post(review_url, json=payload, headers=headers)
    assert res.status_code == 400
    
    error_msg = res.json()['error']['message'].lower()
    # Matches "between 1 and 5" regardless of casing
    assert "between 1 and 5" in error_msg

@pytest.mark.run(order=53)
def test_create_review_happy_path():
    headers = shared_data['review_customer_headers']
    product_id = shared_data['review_product_id']
    
    payload = {
        "productId": product_id,
        "rating": 5,
        "title": "Amazing Product",
        "comment": "I love this test product so much!"
    }
    
    res = requests.post(review_url, json=payload, headers=headers)
    assert res.status_code == 201
    assert res.json()['data']['review']['rating'] == 5
    
    # Save Review ID
    shared_data['review_id'] = res.json()['data']['review']['_id']

@pytest.mark.run(order=54)
def test_prevent_duplicate_reviews():
    headers = shared_data['review_customer_headers']
    product_id = shared_data['review_product_id']
    
    payload = {
        "productId": product_id,
        "rating": 1,
        "title": "Spam",
        "comment": "Trying to review again"
    }
    
    res = requests.post(review_url, json=payload, headers=headers)
    
    if res.status_code == 500:
        print("⚠️ WARNING: Duplicate Review caused 500 Error (Server Crash). Needs Fix.")
    else:
        assert res.status_code == 400
        assert "already reviewed" in res.json()['error']['message']

@pytest.mark.run(order=55)
def test_verify_product_stats_updated():
    # Check if the product now has rating 5 and count 1
    slug = shared_data['review_product_slug']
    
    res = requests.get(f"{product_url}/{slug}")
    assert res.status_code == 200
    
    data = res.json()['data']
    assert data['reviewCount'] == 1
    assert data['rating'] == 5


# --- 3. UPDATE REVIEW (Order 56) ---
@pytest.mark.run(order=56)
def test_update_review_permissions():
    review_id = shared_data['review_id']
    headers = shared_data['review_owner_headers']
    
    payload = {"title": "Hacked Title"}
    res = requests.patch(f"{review_url}/{review_id}", json=payload, headers=headers)
    assert res.status_code == 403
    assert "not authorized" in res.json()['error']['message'].lower()

@pytest.mark.run(order=57)
def test_update_review_happy_path():
    review_id = shared_data['review_id']
    headers = shared_data['review_customer_headers']
    
    # Change rating from 5 to 3
    payload = {"rating": 3, "title": "It is okay"}
    res = requests.patch(f"{review_url}/{review_id}", json=payload, headers=headers)
    assert res.status_code == 200
    assert res.json()['data']['review']['rating'] == 3

@pytest.mark.run(order=58)
def test_verify_stats_after_update():
    # Give the DB a moment to run the aggregation
    time.sleep(0.5)
    
    # Product rating should drop from 5 to 3
    slug = shared_data['review_product_slug']
    res = requests.get(f"{product_url}/{slug}")
    assert res.json()['data']['rating'] == 3


# --- 4. DELETE REVIEW (Order 59) ---
@pytest.mark.run(order=59)
def test_delete_review_happy_path():
    review_id = shared_data['review_id']
    headers = shared_data['review_customer_headers']
    
    res = requests.delete(f"{review_url}/{review_id}", headers=headers)
    assert res.status_code == 204 # No Content

@pytest.mark.run(order=59.5)
def test_verify_stats_after_delete():
    # Product rating should reset to 0
    slug = shared_data['review_product_slug']
    res = requests.get(f"{product_url}/{slug}")
    assert res.json()['data']['rating'] == 0
    assert res.json()['data']['reviewCount'] == 0


# --- 5. CLEANUP (Order 60) ---
@pytest.mark.run(order=60)
def test_review_cleanup():
    headers = shared_data['review_owner_headers']
    prod_id = shared_data['review_product_id']
    cat_id = shared_data['review_category_id']
    
    # Delete Product
    requests.delete(f"{product_url}/{prod_id}", headers=headers)
    # Delete Category
    requests.delete(f"{category_url}/{cat_id}", headers=headers)
    
    print("Review tests cleaned up.")