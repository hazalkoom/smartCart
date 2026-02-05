from fastapi import FastAPI
from app.routes.recommendations import router as recommendations_router
from app.core.logger import logger

app = FastAPI(
    title="SmartCart ML Service",
    description="Machine Learning Recommendation Service for SmartCart",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Include routers
app.include_router(recommendations_router)

@app.get("/")
async def root():
    return {
        "service": "SmartCart ML Recommendations",
        "status": "running",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

logger.info("🚀 SmartCart ML Service Started")