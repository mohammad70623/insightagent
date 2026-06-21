from fastapi import APIRouter

from app.api.v1.endpoints.analytics import ingestion
from app.api.v1.endpoints.analytics import metrics
from app.api.v1.endpoints.analytics import swot
from app.api.v1.endpoints.analytics import anomalies
from app.api.v1.endpoints.analytics import forecast
from app.api.v1.endpoints.analytics import benchmarking

router = APIRouter()

router.include_router(ingestion.router, tags=["analytics"])
router.include_router(metrics.router, prefix="/analytics", tags=["analytics"])
router.include_router(swot.router, prefix="/analytics", tags=["analytics"])
router.include_router(anomalies.router, prefix="/analytics", tags=["analytics"])
router.include_router(forecast.router, prefix="/analytics", tags=["analytics"])
router.include_router(benchmarking.router, prefix="/analytics", tags=["analytics"])
