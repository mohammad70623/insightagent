import ssl
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.config import settings

database_url = settings.DATABASE_URL

# Clean up driver prefix for async compliance
if "postgresql+asyncpg" not in database_url:
    database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)

# Strip standard query params if present to prevent asyncpg keyword errors
if "?" in database_url:
    database_url = database_url.split("?")[0]

# Create a secure SSL context required for Neon Cloud Serverless connection
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

# Initialize optimized async engine injecting native SSL parameters
engine = create_async_engine(
    database_url,
    pool_pre_ping=True,
    connect_args={"ssl": ssl_context}
)

# Thread-safe async session factory
SessionLocal = async_sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)