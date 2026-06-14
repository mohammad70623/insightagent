from fastapi import APIRouter
from app.api.v1.endpoints import auth

# Initialize the primary V1 Router Matrix
api_router = APIRouter()

# 🔌 ROUTER MODULE INJECTIONS
# Link the identity and authentication subsystem under the '/auth' context scope
api_router.include_router(auth.router, prefix="/auth", tags=["Identity & Authentication"])

# FUTURE RAG & AGENT WORKFLOWS INJECTIONS:
# api_router.include_router(agent.router, prefix="/agent", tags=["Agentic Workflows"])
# api_router.include_router(chat.router, prefix="/chat", tags=["RAG Stream Engine"])