from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

uri = os.getenv("MONGO_URI")
print(f"🔌 Connecting to: {uri.split('@')[1] if '@' in uri else 'Localhost'}...")

try:
    client = MongoClient(uri)
    dbs = client.list_database_names()
    print(f"\n📂 Found Databases: {dbs}")

    found_products = False
    for db_name in dbs:
        db = client[db_name]
        cols = db.list_collection_names()
        print(f"\n   database: '{db_name}' has collections: {cols}")
        
        for col in cols:
            count = db[col].count_documents({})
            print(f"     - {col}: {count} documents")
            if col == "products" and count > 0:
                print(f"     ✅ FOUND THEM! Your products are in DB: '{db_name}'")
                found_products = True

    if not found_products:
        print("\n❌ CRITICAL: No non-empty 'products' collection found on this Cluster.")
        print("   Are you sure Node.js isn't using a different MONGO_URI (like localhost)?")

except Exception as e:
    print(f"💥 Connection Error: {e}")