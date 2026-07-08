from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.v1.api import api_router
from app.api.v1.endpoints.analytics.analyze import router as analyze_router

# Initialize Enterprise FastAPI Application Engine
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Enterprise RAG Engine running optimized multi-agent workflows.",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Secures backend from unauthorized cross-origin resource execution requests
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin).strip("/") for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Inject the assembled V1 Router cluster into the main app core runtime
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
            print("✅ Database migration: ADD COLUMN profile_picture & CREATE TABLE ticket successful!")
    except Exception as e:
        print(f"⚠️ Database migration info/error: {e}")


@app.get("/", tags=["Health Check"])
async def root_health_check():
    """System-wide infrastructure health check telemetry gateway."""
    return {
        "status": "online",
        "engine": settings.PROJECT_NAME,
        "environment": "development",
        "gateway_status": "healthy"
    }