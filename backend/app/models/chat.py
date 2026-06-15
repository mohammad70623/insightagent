import uuid
import enum
from datetime import datetime
from sqlalchemy import String, ForeignKey, DateTime, CheckConstraint, Index, UniqueConstraint, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.db.base_class import Base

class ChatRoleEnum(str, enum.Enum):
    USER = "user"
    ASSISTANT = "assistant"


class ChatSession(Base):
    __tablename__ = "chat_session"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("user.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), default="New Chat Adventure", nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    deleted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan", lazy="selectin")

    
    __table_args__ = (
        
        Index("ix_chat_session_user_created", "user_id", "created_at"),
        Index("ix_chat_session_active_lookup", "id", "deleted_at"),
        UniqueConstraint("user_id", "title", name="uq_user_session_title"),
    )


class ChatMessage(Base):
    __tablename__ = "chat_message"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4, index=True)
    session_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("chat_session.id", ondelete="CASCADE"), nullable=False, index=True)
    
    role: Mapped[ChatRoleEnum] = mapped_column(Enum(ChatRoleEnum, native_enum=True), nullable=False)
    content: Mapped[str] = mapped_column(String, nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    deleted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)

    session = relationship("ChatSession", back_populates="messages")

    __table_args__ = (
        Index("ix_chat_msg_session_timeline", "session_id", "created_at"),
        Index("ix_chat_msg_active_history", "session_id", "deleted_at"),
    )