from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.config import settings

# Safe driver extraction to ensure asyncpg is enforced without breaking existing schemas
database_url = settings.DATABASE_URL
if database_url.startswith("postgresql://"):
    database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)

# Initialize optimized async engine
engine = create_async_engine(
    database_url,
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True
)

# Async thread-safe session maker factory
SessionLocal = async_sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)