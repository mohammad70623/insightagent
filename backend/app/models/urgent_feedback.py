import uuid
import datetime
from typing import Optional
from sqlalchemy import String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.db.base_class import Base

class UrgentFeedback(Base):
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("user.id", ondelete="CASCADE"), index=True, nullable=False)
    email_message_id: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    thread_id: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    subject: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    snippet: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    source: Mapped[str] = mapped_column(String(50), default="Email", nullable=False)
    sender: Mapped[str] = mapped_column(String(255), nullable=False)
    sender_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    severity: Mapped[str] = mapped_column(String(50), default="MEDIUM", nullable=False)
    timestamp: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    body: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    red_flag: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="urgent_feedbacks")
