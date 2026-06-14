from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.v1.api import api_router

# Initialize Enterprise FastAPI Application Engine
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Enterprise RAG Engine running optimized multi-agent workflows.",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS GATEWAY MIDDLEWARE CONFIGURATION
# Secures backend from unauthorized cross-origin resource execution requests
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin).strip("/") for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

#GLOBAL API ROUTER COUPLING
# Inject the assembled V1 Router cluster into the main app core runtime
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Health Check"])
async def root_health_check():
    """System-wide infrastructure health check telemetry gateway."""
    return {
        "status": "online",
        "engine": settings.PROJECT_NAME,
        "environment": "development",
        "gateway_status": "healthy"
    }