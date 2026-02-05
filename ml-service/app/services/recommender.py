from pymongo import MongoClient
from app.core.logger import logger
from dotenv import load_dotenv  # <--- 1. Import this
import os

# 2. Load env vars immediately when this file is imported
load_dotenv()

class RecommendationService:
    def __init__(self):
        mongo_uri = os.getenv("MONGO_URI")
        
        # Security: Log ONLY the cluster name (not the password) to verify connection
        if mongo_uri:
            masked_uri = mongo_uri.split('@')[-1] 
            logger.info(f"🔌 Connecting to: {masked_uri}")
        else:
            logger.warning("⚠️ MONGO_URI missing! Falling back to Localhost.")
            mongo_uri = "mongodb://localhost:27017/smartcart"

        try:
            self.client = MongoClient(mongo_uri)
            # Force 'smartcart' database
            self.db = self.client["smartcart"] 
            self.products_col = self.db["products"]
            
            # Count products to verify
            count = self.products_col.count_documents({})
            logger.info(f"✅ Connected to DB: '{self.db.name}'. Found {count} products.")
            
        except Exception as e:
            logger.error(f"❌ MongoDB Connection Failed: {e}")
            raise e

    def get_discovery_recommendations(self, limit=5):
        try:
            total = self.products_col.count_documents({})
            if total == 0:
                logger.warning("Database is empty! Cannot recommend.")
                return []

            pipeline = [
                {"$sample": {"size": limit}},
                {"$project": {
                    "_id": {"$toString": "$_id"},
                    "name": 1,
                    "price": 1,
                    "images": 1,
                    "category": 1,
                    "slug": 1
                }}
            ]
            results = list(self.products_col.aggregate(pipeline))
            return results
        except Exception as e:
            logger.error(f"Error in discovery strategy: {e}")
            return []

recommender = RecommendationService()