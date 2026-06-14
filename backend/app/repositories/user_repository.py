import uuid
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.schemas.user import UserCreate

class UserRepository:
    """
    Data Access Layer for handling database storage operations on the User entity.
    Encapsulates raw SQLAlchemy 2.0 async queries.
    """
    
    @staticmethod
    async def get_by_id(db: AsyncSession, user_id: uuid.UUID) -> Optional[User]:
        """Fetch a specific user profile using their unique primary identity."""
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_email(db: AsyncSession, email: str) -> Optional[User]:
        """Query user accounts using an indexed email address string."""
        result = await db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    @staticmethod
    async def create(db: AsyncSession, *, obj_in: UserCreate, hashed_password: str) -> User:
        """Persist a newly registered user instance securely into cloud storage."""
        db_obj = User(
            email=obj_in.email,
            hashed_password=hashed_password,
            first_name=obj_in.first_name,
            last_name=obj_in.last_name,
            role="user",
            is_active=True,
            is_verified=False
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj