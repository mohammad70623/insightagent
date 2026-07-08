import datetime
import random
from sqlalchemy import String, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from app.db.base_class import Base

def generate_ticket_id() -> str:
    """Generates a custom ticket ID format: TKT-XXXX"""
    return f"TKT-{random.randint(1000, 9999)}"

class Ticket(Base):
    id: Mapped[str] = mapped_column(String(50), primary_key=True, default=generate_ticket_id, index=True)
    user_id: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    category: Mapped[str] = mapped_column(String(255), nullable=False)
    urgency: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="PENDING", nullable=False)
    admin_reply: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
