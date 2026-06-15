from fastapi import APIRouter
from app.api.v1.endpoints import auth
from app.api.v1.endpoints import chat 
api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Identity & Authentication"])
api_router.include_router(chat.router, prefix="/chat", tags=["AI Agentic & Chat Core"]) 