from fastapi import APIRouter
from app.api.v1.endpoints import auth
from app.api.v1.endpoints import chat
from app.api.v1.endpoints import admin
from app.api.v1.endpoints import billing
from app.api.v1.endpoints import profile
from app.api.v1.endpoints import support_router
from app.api.v1.endpoints import notifications

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Identity & Authentication"])
api_router.include_router(chat.router, prefix="/chat", tags=["AI Agentic & Chat Core"]) 
api_router.include_router(admin.router, tags=["Admin Global System"]) 
api_router.include_router(billing.router, prefix="/billing", tags=["Billing & Enterprise Invoices"])
api_router.include_router(profile.router, prefix="/profile", tags=["User Profile & Workspace"])
api_router.include_router(profile.user_router, prefix="/user", tags=["User Profile & Workspace"])
api_router.include_router(support_router.router, tags=["Support & Live Takeover"])
api_router.include_router(notifications.router, tags=["Notifications System"])