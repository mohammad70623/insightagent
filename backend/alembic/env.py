import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

# 🔗 Import our central application infrastructure configuration matrix
from app.core.config import settings
from app.db.base_class import Base

# =========================================================================
# 🦾 FIX: CRITICAL MODEL LIFECYCLE INJECTION
# Explicitly import all multi-tenant tables to bind models with global metadata context
# =========================================================================
from app.models.user import User  # noqa
from app.models.chat import ChatSession, ChatMessage  # 🔥 Injected live for tracking

# This is the Alembic Config object, which provides access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# 📊 Dynamically map target metadata tracking matrices from our SQLAlchemy Base Class
target_metadata = Base.metadata

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    # Read the synchronous/asynchronous clean database URL directly from settings matrix
    url = settings.DATABASE_URL
    if "postgresql+asyncpg" not in url:
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def do_run_migrations(connection):
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()

async def run_migrations_online() -> None:
    """Run migrations in 'online' mode (Asynchronous Pipeline Compatible)."""
    configuration = config.get_section(config.config_ini_section) or {}
    
    # Inject dynamically fetched configuration context parameters 
    url = settings.DATABASE_URL
    if "postgresql+asyncpg" not in url:
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if "?" in url:
        url = url.split("?")[0]
        
    configuration["sqlalchemy.url"] = url

    connect_args = {}
    # Secure serverless cloud connections require automated SSL contexts injection
    import ssl
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE
    connect_args["ssl"] = ssl_context

    connectable = async_engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
        connect_args=connect_args
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()

if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())