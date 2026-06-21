from fastapi import APIRouter
from app.api.v1.endpoints import auth
from app.api.v1.endpoints import chat 
from app.api.v1.endpoints import admin
api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Identity & Authentication"])
api_router.include_router(chat.router, prefix="/chat", tags=["AI Agentic & Chat Core"]) 
api_router.include_router(admin.router, tags=["Admin Global System"]) 