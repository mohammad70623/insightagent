import uuid
import logging
import asyncio
from typing import Optional
from pydantic import BaseModel, Field, constr
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api import deps
from app.models.user import User
from app.models.chat import ChatSession
from app.services.rag.history import chat_history_service
from app.services.rag.rag_engine import rag_engine

from app.api.v1.endpoints.analytics.router import router as analytics_router

router = APIRouter()
logger = logging.getLogger(__name__)

# Include the newly extracted analytics router
router.include_router(analytics_router)

# ============================================================
# REQUEST SCHEMAS
# ============================================================

class ChatStreamRequest(BaseModel):
    user_prompt: constr(min_length=1, max_length=4000, strip_whitespace=True) = Field(
        ..., description="The highly sanitized core prompt string from verified tenants."
    )

class ChatSessionCreateRequest(BaseModel):
    title: Optional[constr(max_length=150, strip_whitespace=True)] = "New Chat"


# ============================================================
# SESSION MANAGEMENT ENDPOINTS
# ============================================================

@router.post("/session", status_code=status.HTTP_201_CREATED)
async def create_chat_workspace(
    payload: ChatSessionCreateRequest,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    return await chat_history_service.create_new_session(db, user_id=current_user.id, title=payload.title)


@router.get("/session")
async def get_chat_workspaces(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    sessions = await chat_history_service.get_user_sessions(db, user_id=current_user.id)
    return sessions


@router.get("/session/{session_id}/messages")
async def get_chat_workspace_history(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    session_query = select(ChatSession).where(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id,
        ChatSession.deleted_at == None
    )
    session_check = await db.execute(session_query)
    if not session_check.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found or access is unauthorized."
        )

    history_frames = await chat_history_service.get_cursor_paginated_history(db, session_id=session_id, limit=50)
    history_frames.reverse()
    return history_frames


@router.delete("/session/{session_id}")
async def purge_chat_workspace(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    owner_query = select(ChatSession).where(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    )
    owner_check = await db.execute(owner_query)
    if not owner_check.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or access unauthorized."
        )

    success = await chat_history_service.execute_soft_delete_session(db, session_id=session_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database mutation failed."
        )
    return {"status": "success", "detail": "Chat workspace soft-deleted gracefully."}


# ============================================================
# RAG STREAMING ENDPOINT
# ============================================================

@router.post("/stream/{session_id}")
async def trigger_live_agent_stream(
    session_id: uuid.UUID,
    payload: ChatStreamRequest,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    session_query = select(ChatSession).where(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id,
        ChatSession.deleted_at == None
    )
    session_check = await db.execute(session_query)
    if not session_check.scalar_one_or_none():
        logger.warning(
            f'{{"event": "unauthorized_stream_blocked", "user_id": "{str(current_user.id)}", "session_id": "{str(session_id)}"}}'
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: session does not exist or is unauthorized."
        )

    history_frames = await chat_history_service.get_cursor_paginated_history(
        db, session_id=session_id, limit=15
    )
    llm_history = [{"role": f["role"], "content": f["content"]} for f in history_frames]

    await chat_history_service.append_chat_message(
        db, session_id=session_id, role="user", content=payload.user_prompt
    )

    tenant_collection_namespace = f"tenant_cluster_{str(current_user.id).replace('-', '_')}"

    async def token_stream_generator():
        full_response_accumulator = []
        try:
            async for token in rag_engine.stream_agent_handshake(
                collection_name=tenant_collection_namespace,
                user_id=current_user.id,
                user_prompt=payload.user_prompt,
                chat_history=llm_history
            ):
                if token is not None:
                    full_response_accumulator.append(token)
                    yield f"data: {token}\n\n"
                    await asyncio.sleep(0.005)

            if full_response_accumulator:
                await chat_history_service.append_chat_message(
                    db,
                    session_id=session_id,
                    role="assistant",
                    content="".join(full_response_accumulator)
                )
        except Exception as streaming_fault:
            logger.error(
                f'{{"event": "stream_engine_collapsed", "session_id": "{str(session_id)}", "error": "{str(streaming_fault)}"}}'
            )
            yield "data: \n[SYSTEM NOTICE]: Streaming temporarily unavailable. Please retry.\n\n"

    return StreamingResponse(token_stream_generator(), media_type="text/event-stream")