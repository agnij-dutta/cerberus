"""
Unit tests for the PolicyManager.

These tests exercise the caching logic without hitting a real database.
We mock the SQLAlchemy session to return controlled results.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.core.exceptions import PolicyNotFound
from app.core.policy import PolicyManager


def _make_policy(
    policy_id: uuid.UUID | None = None,
    tenant_id: uuid.UUID | None = None,
    name: str = "test-policy",
    algorithm: str = "sliding_window",
    limit: int = 100,
    window_seconds: int = 60,
    refill_rate: float | None = None,
    is_active: bool = True,
):
    """Create a mock Policy object for testing."""
    policy = MagicMock()
    policy.id = policy_id or uuid.uuid4()
    policy.tenant_id = tenant_id or uuid.uuid4()
    policy.name = name
    policy.algorithm = algorithm
    policy.limit = limit
    policy.window_seconds = window_seconds
    policy.refill_rate = refill_rate
    policy.is_active = is_active
    policy.created_at = datetime.now(timezone.utc)
    policy.updated_at = datetime.now(timezone.utc)
    return policy


class TestPolicyManagerCache:
    def test_cache_starts_empty(self, policy_manager: PolicyManager):
        random_id = uuid.uuid4()
        assert policy_manager._get_cached(random_id) is None

    def test_set_and_get_cached(self, policy_manager: PolicyManager):
        policy = _make_policy()
        policy_manager._set_cached(policy)

        cached = policy_manager._get_cached(policy.id)
        assert cached is not None
        assert cached.id == policy.id

    def test_cache_invalidation(self, policy_manager: PolicyManager):
        policy = _make_policy()
        policy_manager._set_cached(policy)

        policy_manager.invalidate(policy.id)
        assert policy_manager._get_cached(policy.id) is None

    def test_invalidate_all(self, policy_manager: PolicyManager):
        for _ in range(5):
            policy_manager._set_cached(_make_policy())

        policy_manager.invalidate_all()
        # Can't check emptiness without inspecting internals, but this
        # at least verifies no exception is raised.
        assert len(policy_manager._cache) == 0

    def test_expired_entries_are_evicted(self):
        """Entries past their TTL should not be returned."""
        pm = PolicyManager(cache_ttl=0.0)  # immediate expiry
        policy = _make_policy()
        pm._set_cached(policy)

        # Should already be expired
        assert pm._get_cached(policy.id) is None


class TestPolicyManagerGet:
    @pytest.mark.asyncio
    async def test_returns_policy_from_db(self, policy_manager: PolicyManager):
        """When not cached, the manager should query the database."""
        policy = _make_policy()

        # Mock the session
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = policy
        mock_session = AsyncMock()
        mock_session.execute.return_value = mock_result

        result = await policy_manager.get(mock_session, policy.id)
        assert result.id == policy.id

        # Should now be cached
        assert policy_manager._get_cached(policy.id) is not None

    @pytest.mark.asyncio
    async def test_raises_not_found(self, policy_manager: PolicyManager):
        """Missing policies should raise PolicyNotFound."""
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_session = AsyncMock()
        mock_session.execute.return_value = mock_result

        with pytest.raises(PolicyNotFound):
            await policy_manager.get(mock_session, uuid.uuid4())

    @pytest.mark.asyncio
    async def test_serves_from_cache_on_second_call(self, policy_manager: PolicyManager):
        """The second call should not hit the database."""
        policy = _make_policy()

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = policy
        mock_session = AsyncMock()
        mock_session.execute.return_value = mock_result

        # First call — hits DB
        await policy_manager.get(mock_session, policy.id)
        assert mock_session.execute.call_count == 1

        # Second call — served from cache
        await policy_manager.get(mock_session, policy.id)
        assert mock_session.execute.call_count == 1  # no additional call
