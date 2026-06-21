import uuid
from datetime import datetime, timezone
from sqlmodel import SQLModel, Field, Column, String, DateTime, Boolean

class OTPVerification(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    email: str = Field(index=True, nullable=False)
    otp_code: str = Field(nullable=False)  # 6-digit cryptographic string
    purpose: str = Field(nullable=False)   # "registration" or "login"
    expires_at: datetime = Field(sa_column=Column(DateTime(timezone=True), nullable=False))
    is_used: bool = Field(default=False, nullable=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), sa_column=Column(DateTime(timezone=True)))

class PasswordResetToken(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    email: str = Field(index=True, nullable=False)
    token: str = Field(unique=True, index=True, nullable=False)
    expires_at: datetime = Field(sa_column=Column(DateTime(timezone=True), nullable=False))
    is_used: bool = Field(default=False, nullable=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), sa_column=Column(DateTime(timezone=True)))
