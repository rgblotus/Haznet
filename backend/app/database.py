from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool

from app.config import get_settings

settings = get_settings()

async_engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    pool_size=settings.postgres_pool_size,
    max_overflow=settings.postgres_max_overflow,
    pool_timeout=settings.postgres_pool_timeout,
    pool_pre_ping=True,
)

async_session_factory = async_sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    pass


def get_sync_engine():
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    engine = create_engine(
        settings.sync_database_url,
        echo=settings.debug,
        pool_pre_ping=True,
    )
    return engine, sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


async def get_db():
    async with async_session_factory() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db():
    await async_engine.dispose()


async def check_db_health() -> bool:
    try:
        from sqlalchemy import text
        async with async_engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
            return True
    except Exception:
        return False
