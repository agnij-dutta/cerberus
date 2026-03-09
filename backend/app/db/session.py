"""
Async SQLAlchemy engine and session factory.

The engine is created once at startup (via lifespan) and shared across all
requests.  Each request gets its own session from the factory.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.config import get_settings

if TYPE_CHECKING:
    from collections.abc import AsyncGenerator

# Module-level singletons — initialised by ``init_db`` at startup.
_engine: AsyncEngine | None = None
_session_factory: async_sessionmaker[AsyncSession] | None = None


def init_db() -> None:
    """
    Create the async engine and session factory.

    Called once during application lifespan startup.
    """
    global _engine, _session_factory

    settings = get_settings()

    # Neon and other hosted Postgres services use postgresql:// URLs.
    # SQLAlchemy async needs the asyncpg driver prefix.
    db_url = str(settings.database_url)
    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

    # Neon requires SSL — pass connect_args for asyncpg when sslmode is present
    connect_args = {}
    if "sslmode=require" in db_url or (
        db_url.startswith("postgresql+asyncpg://") and "neon.tech" in db_url
    ):
        connect_args["ssl"] = True

    _engine = create_async_engine(
        db_url,
        pool_size=settings.db_pool_size,
        max_overflow=settings.db_max_overflow,
        pool_recycle=settings.db_pool_recycle,
        pool_pre_ping=True,
        echo=settings.debug,
        connect_args=connect_args,
    )

    _session_factory = async_sessionmaker(
        bind=_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )


async def close_db() -> None:
    """Dispose of the engine's connection pool.  Called at shutdown."""
    global _engine
    if _engine is not None:
        await _engine.dispose()
        _engine = None


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Yield an async session that is committed on success and rolled back on error.

    Used as a FastAPI dependency.
    """
    if _session_factory is None:
        raise RuntimeError("Database not initialised — call init_db() first.")

    async with _session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


def get_engine() -> AsyncEngine:
    """Return the current engine (for health checks and migrations)."""
    if _engine is None:
        raise RuntimeError("Database not initialised — call init_db() first.")
    return _engine
