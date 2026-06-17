import logging
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Literal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.models.chat import ChatSession, ChatMessage

logger = logging.getLogger(__name__)

class ChatHistoryService:
    
    async def create_new_session(self, db: AsyncSession, user_id: uuid.UUID, title: str = "New Chat Adventure") -> ChatSession:
        """Provisions an isolated chat workspace container under explicit atomic commit blocks."""
        try:
            new_session = ChatSession(
                id=uuid.uuid4(),
                user_id=user_id,
                title=title
            )
            db.add(new_session)
            await db.commit()
            await db.refresh(new_session)
            
            logger.info(f'{{"event": "chat_session_finalized", "session_id": "{str(new_session.id)}", "user_id": "{str(user_id)}"}}')
            return new_session
        except Exception as e:
            await db.rollback()
            logger.error(f'{{"event": "session_creation_failed", "user_id": "{str(user_id)}", "error_details": "{str(e)}"}}')
            raise

    async def append_chat_message(
        self, db: AsyncSession, session_id: uuid.UUID, role: Literal["user", "assistant"], content: str
    ) -> ChatMessage:
        """Locks validated conversation segments directly with strict atomicity guarantees."""
        try:
            new_message = ChatMessage(
                id=uuid.uuid4(),
                session_id=session_id,
                role=role,
                content=content.strip()
            )
            db.add(new_message)
            await db.commit()
            await db.refresh(new_message)
            return new_message
        except Exception as e:
            await db.rollback()
            logger.error(f'{{"event": "message_append_failed", "session_id": "{str(session_id)}", "error_details": "{str(e)}"}}')
            raise

    async def get_cursor_paginated_history(
        self, 
        db: AsyncSession, 
        session_id: uuid.UUID, 
        limit: int = 30, 
        last_seen_timestamp: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        """Retrieves non-degraded message history buckets via indexed timestamp deltas."""
        try:
           
            query = select(ChatMessage).where(
                ChatMessage.session_id == session_id,
                ChatMessage.deleted_at == None
            )
            
            if last_seen_timestamp:
                query = query.where(ChatMessage.created_at < last_seen_timestamp)
                
            query = query.order_by(ChatMessage.created_at.desc()).limit(limit)
            
            result = await db.execute(query)
            messages = result.scalars().all()
            
            return [
                {
                    "id": str(msg.id),
                    "role": msg.role,
                    "content": msg.content,
                    "created_at": msg.created_at.isoformat()
                } for msg in messages
            ]
        except Exception as e:
            logger.error(f'{{"event": "cursor_history_failed", "session_id": "{str(session_id)}", "error_details": "{str(e)}"}}')
            raise

   
    async def execute_soft_delete_session(self, db: AsyncSession, session_id: uuid.UUID) -> bool:
        """Executes soft deletion sweep over full active session contexts without losing history trails."""
        try:
            now_utc = datetime.now(timezone.utc)
            
            await db.execute(
                update(ChatMessage)
                .where(ChatMessage.session_id == session_id)
                .values(deleted_at=now_utc)
            )
            
            session_stmt = (
                update(ChatSession)
                .where(ChatSession.id == session_id)
                .values(deleted_at=now_utc)
            )
            result = await db.execute(session_stmt)
            await db.commit()
            
            logger.info(f'{{"event": "session_soft_deleted", "session_id": "{str(session_id)}", "timestamp": "{now_utc.isoformat()}"}}')
            return result.rowcount > 0
        except Exception as e:
            await db.rollback()
            logger.error(f'{{"event": "session_soft_delete_crash", "session_id": "{str(session_id)}", "error_details": "{str(e)}"}}')
            raise

    async def get_user_sessions(self, db: AsyncSession, user_id: uuid.UUID) -> List[ChatSession]:
        """Retrieves all non-deleted chat sessions for a specific user, ordered by creation date desc."""
        try:
            query = select(ChatSession).where(
                ChatSession.user_id == user_id,
                ChatSession.deleted_at == None
            ).order_by(ChatSession.created_at.desc())
            
            result = await db.execute(query)
            return list(result.scalars().all())
        except Exception as e:
            logger.error(f'{{"event": "get_user_sessions_failed", "user_id": "{str(user_id)}", "error": "{str(e)}"}}')
            raise

chat_history_service = ChatHistoryService()