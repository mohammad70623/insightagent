import uuid
from sqlalchemy import String, Boolean, DateTime, Integer, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.db.base_class import Base

class User(Base):
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default="user", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    subscription_tier: Mapped[str] = mapped_column(String(50), default="Free", nullable=False)
    uploaded_files_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    subscription_started_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), nullable=True)
    subscription_expires_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), nullable=True)
    workspace_name: Mapped[str] = mapped_column(String(255), nullable=True)
    workspace_logo: Mapped[str] = mapped_column(String, nullable=True)
    profile_picture: Mapped[str] = mapped_column(String, nullable=True)
    is_2fa_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # Onboarding Progress Checklist Flags
    has_uploaded_data: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    has_processed_data: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    has_explored_insights: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    chat_sessions = relationship("ChatSession", back_populates="user", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="user", cascade="all, delete-orphan")

class Invoice(Base):
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("user.id"), index=True, nullable=False)
    plan_name: Mapped[str] = mapped_column(String(50), nullable=False)
    amount_paid: Mapped[float] = mapped_column(Float, nullable=False)
    transaction_id: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    billing_date: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="invoices")