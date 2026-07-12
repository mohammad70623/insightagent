import os
import json
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.v1.api import api_router
from app.api.v1.endpoints.analytics.analyze import router as analyze_router

logger = logging.getLogger(__name__)

# Initialize Enterprise FastAPI Application Engine
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Enterprise RAG Engine running optimized multi-agent workflows.",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)


raw_origins = getattr(settings, "BACKEND_CORS_ORIGINS", None) or os.getenv("BACKEND_CORS_ORIGINS", "[]")
allowed_origins = []

if isinstance(raw_origins, list):
    allowed_origins = [str(origin).strip("/") for origin in raw_origins]
elif isinstance(raw_origins, str):
    try:

        parsed = json.loads(raw_origins)
        if isinstance(parsed, list):
            allowed_origins = [str(origin).strip("/") for origin in parsed]
    except json.JSONDecodeError:
  
        allowed_origins = [origin.strip().strip("/") for origin in raw_origins.split(",") if origin.strip()]

if not allowed_origins:
    logger.warning("⚠️ No CORS origins configured! Falling back to strict localhost defaults.")
    allowed_origins = [
        "http://localhost:5173",  
        "http://localhost:3000",
        "http://127.0.0.1:5173"
    ]

logger.info(f"🔒 Secure CORS origins loaded: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins, 
    allow_credentials=True,
    allow_methods=["*"],            
    allow_headers=["*"],            
)



app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(analyze_router, prefix="/api")


@app.on_event("startup")
async def startup_event():
    from app.db.session import engine
    from sqlalchemy import text
    try:
        async with engine.begin() as conn:
            await conn.execute(text('ALTER TABLE "user" ADD COLUMN IF NOT EXISTS profile_picture VARCHAR;'))
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS ticket (
                    id VARCHAR(50) PRIMARY KEY,
                    user_id VARCHAR(50) NOT NULL,
                    category VARCHAR(255) NOT NULL,
                    urgency VARCHAR(50) NOT NULL,
                    description TEXT NOT NULL,
                    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
                    admin_reply TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
                );
            """))
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS notification (
                    id UUID PRIMARY KEY,
                    user_id VARCHAR(50) NOT NULL,
                    title VARCHAR(255) NOT NULL,
                    message TEXT NOT NULL,
                    redirect_url VARCHAR(255) NOT NULL,
                    is_read BOOLEAN DEFAULT FALSE NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
                );
            """))
            print("✅ Database migration: ADD COLUMN profile_picture, CREATE TABLE ticket & notification successful!")
    except Exception as e:
        print(f"⚠️ Database migration info/error: {e}")


@app.get("/", tags=["Health Check"])
async def root_health_check():
    """System-wide infrastructure health check telemetry gateway."""
    return {
        "status": "online",
        "engine": settings.PROJECT_NAME,
        "environment": "production",
        "gateway_status": "healthy"
    }