from fastapi import APIRouter
from app.services.recommender import recommender
from app.core.logger import logger

router = APIRouter(prefix="/recommend", tags=["Recommendations"])

@router.get("/{user_id}")
async def get_recommendations(user_id: str):
    logger.info(f"Request received for User: {user_id}")
    
    products = recommender.get_discovery_recommendations(limit=5)
    
    if not products:
        logger.warning(f"No products found for User: {user_id}")
        return {
            "user_id": user_id,
            "strategy": "empty",
            "data": []
        }

    return {
        "user_id": user_id,
        "strategy": "discovery",
        "count": len(products),
        "data": products
    }