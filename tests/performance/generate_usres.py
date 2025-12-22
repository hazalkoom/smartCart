import csv
import requests
import os

# --- CONFIGURATION ---
API_URL = "http://localhost:5000/api/v1/auth/register" 
NUM_USERS = 100

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
OUTPUT_FILE = os.path.join(DATA_DIR, "users.csv")

def generate_and_register():
    print(f"📂 script location: {BASE_DIR}")
    print(f"📂 saving csv to:   {OUTPUT_FILE}")
    print(f"🌐 hitting api at:  {API_URL}")

    os.makedirs(DATA_DIR, exist_ok=True)

    users = []
    
    print(f"Generating {NUM_USERS} users...")

    for i in range(NUM_USERS):
        email = f"perf_user_{i}@example.com"
        password = "Password123!"
        Fname = f"TestUser{i}"
        Sname = "Automated"
        
        # We only save email/pass to CSV because that's all we need to LOGIN later
        users.append([email, password])

        try:
            response = requests.post(API_URL, json={
                "email": email,
                "password": password,
                "firstName": Fname,
                "lastName": Sname,
                "role": "customer"
            })
            
            if response.status_code in [200, 201]:
                print(f"✅ Registered {email}")
            else:
                print(f"⚠️  Note {email}: {response.status_code} (User likely exists)")
        
        except requests.exceptions.ConnectionError:
             print(f"❌ CONNECTION REFUSED! Start your server!")
             break
        except Exception as e:
            print(f"❌ Error: {e}")
            break

    # Save to CSV
    with open(OUTPUT_FILE, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["email", "password"]) 
        writer.writerows(users)
    
    print(f"✅ Saved credentials to {OUTPUT_FILE}")

if __name__ == "__main__":
    generate_and_register()