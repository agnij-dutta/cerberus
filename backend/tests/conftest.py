"""
Shared fixtures for the Cerberus test suite.

Uses ``fakeredis`` for unit and integration tests to avoid requiring a
running Redis instance in CI.  End-to-end tests should use a real Redis.
"""

from __future__ import annotations

import uuid
from typing import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock

import fakeredis.aioredis
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.api.middleware.auth import hash_api_key
from app.config import Settings
from app.core.limiter import LimiterService
from app.core.policy import PolicyManager
from app.db.session import get_session
from app.main import create_app


@pytest.fixture(scope="session")
def settings() -> Settings:
    """Return test settings (no env file)."""
    return Settings(
        environment="dev",
        debug=True,
        redis_url="redis://localhost:6379/15",
        database_url="postgresql+asyncpg://cerberus:cerberus@localhost:5432/cerberus_test",
        admin_api_key="test-admin-key-1234567890",
    )


@pytest_asyncio.fixture
async def fake_redis() -> AsyncGenerator[fakeredis.aioredis.FakeRedis, None]:
    """
    Provide an in-memory Redis instance via fakeredis.

    This is the workhorse fixture for unit and integration tests.
    """
    redis = fakeredis.aioredis.FakeRedis(decode_responses=True)
    yield redis
    await redis.aclose()


@pytest.fixture
def policy_manager() -> PolicyManager:
    """Fresh PolicyManager with no cached state."""
    return PolicyManager(cache_ttl=5.0)


@pytest.fixture
def limiter_service(policy_manager: PolicyManager) -> LimiterService:
    """LimiterService wired to a fresh PolicyManager."""
    return LimiterService(policy_manager)


@pytest.fixture
def sample_tenant_id() -> uuid.UUID:
    """A deterministic tenant UUID for tests."""
    return uuid.UUID("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee")


@pytest.fixture
def sample_policy_id() -> uuid.UUID:
    """A deterministic policy UUID for tests."""
    return uuid.UUID("11111111-2222-3333-4444-555555555555")


@pytest.fixture
def sample_api_key() -> str:
    """A test API key."""
    return "cerb_" + "a" * 48


@pytest.fixture
def sample_api_key_hash(sample_api_key: str) -> str:
    """SHA-256 hash of the test API key."""
    return hash_api_key(sample_api_key)


@pytest.fixture
def mock_db_session():
    """
    Provide a MagicMock that stands in for an AsyncSession.

    This mock is injected via dependency_overrides so that no real
    database connection is needed during integration tests.

    ``add`` is a regular MagicMock because SQLAlchemy's ``session.add()``
    is synchronous.  All other session methods that are awaited in
    production code (``flush``, ``refresh``, ``commit``, ``rollback``,
    ``close``, ``execute``) are AsyncMocks.
    """
    session = MagicMock()
    session.add = MagicMock()
    session.flush = AsyncMock()
    session.refresh = AsyncMock()
    session.commit = AsyncMock()
    session.rollback = AsyncMock()
    session.close = AsyncMock()
    session.execute = AsyncMock()
    return session


@pytest_asyncio.fixture
async def test_app(fake_redis, mock_db_session):
    """
    Create a FastAPI test application with fakeredis and a mocked DB
    session injected.

    This fixture uses ``app.dependency_overrides`` to replace the real
    ``get_session`` dependency with a mock, so integration tests never
    need a running PostgreSQL instance.
    """
    app = create_app()
    app.state.redis = fake_redis

    # Override the get_session dependency to yield our mock session
    # instead of attempting to connect to a real database.
    async def _override_get_session():
        yield mock_db_session

    app.dependency_overrides[get_session] = _override_get_session

    yield app

    # Clean up overrides after each test
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def client(test_app) -> AsyncGenerator[AsyncClient, None]:
    """
    Async HTTP client for making requests against the test app.
    """
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
