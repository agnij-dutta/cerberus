"""
Policy manager — loads, caches, and validates rate-limit policies.

Policies are stored in PostgreSQL and cached in an in-process LRU dict with a
TTL.  The hot-path (``/v1/check``) should almost never hit the database
because policies change infrequently.
"""

from __future__ import annotations

import time
from typing import TYPE_CHECKING, Optional
from uuid import UUID

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import PolicyNotFound
from app.db.models.policy import Policy

if TYPE_CHECKING:
    pass

logger = structlog.get_logger(__name__)

# Simple TTL cache — we intentionally avoid Redis for this because the data is
# small and we want zero network hops on the hot path.
_CACHE_TTL_SECONDS = 60


class _CacheEntry:
    """Internal wrapper that pairs a value with an expiry timestamp."""

    __slots__ = ("value", "expires_at")

    def __init__(self, value: Policy, ttl: float) -> None:
        self.value = value
        self.expires_at = time.monotonic() + ttl


class PolicyManager:
    """
    Manages CRUD operations and caching for rate-limit policies.

    The cache is per-process, which is fine — a few extra DB hits after a
    deploy or worker recycle are negligible.
    """

    def __init__(self, cache_ttl: float = _CACHE_TTL_SECONDS) -> None:
        self._cache: dict[UUID, _CacheEntry] = {}
        self._cache_ttl = cache_ttl

    # -- Cache helpers ---------------------------------------------------------

    def _get_cached(self, policy_id: UUID) -> Optional[Policy]:
        entry = self._cache.get(policy_id)
        if entry is None:
            return None
        if time.monotonic() > entry.expires_at:
            del self._cache[policy_id]
            return None
        return entry.value

    def _set_cached(self, policy: Policy) -> None:
        self._cache[policy.id] = _CacheEntry(policy, self._cache_ttl)

    def invalidate(self, policy_id: UUID) -> None:
        """Remove a policy from the local cache."""
        self._cache.pop(policy_id, None)

    def invalidate_all(self) -> None:
        """Flush the entire policy cache (useful in tests)."""
        self._cache.clear()

    # -- Read ------------------------------------------------------------------

    async def get(self, session: AsyncSession, policy_id: UUID) -> Policy:
        """
        Fetch a policy by ID, using the local cache when possible.

        Raises
        ------
        PolicyNotFound
            If no active policy exists with the given ID.
        """
        cached = self._get_cached(policy_id)
        if cached is not None:
            return cached

        stmt = select(Policy).where(Policy.id == policy_id, Policy.is_active.is_(True))
        result = await session.execute(stmt)
        policy = result.scalar_one_or_none()

        if policy is None:
            raise PolicyNotFound(str(policy_id))

        self._set_cached(policy)
        return policy

    async def list_for_tenant(
        self,
        session: AsyncSession,
        tenant_id: UUID,
        *,
        offset: int = 0,
        limit: int = 50,
    ) -> list[Policy]:
        """Return all active policies belonging to a tenant."""
        stmt = (
            select(Policy)
            .where(Policy.tenant_id == tenant_id, Policy.is_active.is_(True))
            .order_by(Policy.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        result = await session.execute(stmt)
        return list(result.scalars().all())

    # -- Write -----------------------------------------------------------------

    async def create(self, session: AsyncSession, policy: Policy) -> Policy:
        """Persist a new policy."""
        session.add(policy)
        await session.flush()
        await session.refresh(policy)
        logger.info("policy_created", policy_id=str(policy.id), tenant_id=str(policy.tenant_id))
        return policy

    async def update(
        self,
        session: AsyncSession,
        policy_id: UUID,
        tenant_id: UUID,
        **fields: object,
    ) -> Policy:
        """
        Update specific fields on an existing policy.

        Only the owning tenant can update its own policies.
        """
        policy = await self.get(session, policy_id)

        if policy.tenant_id != tenant_id:
            from app.core.exceptions import AuthorisationError

            raise AuthorisationError("Cannot modify another tenant's policy.")

        for field, value in fields.items():
            if hasattr(policy, field) and value is not None:
                setattr(policy, field, value)

        await session.flush()
        await session.refresh(policy)

        # Invalidate cache so the next check picks up changes
        self.invalidate(policy_id)

        logger.info("policy_updated", policy_id=str(policy_id))
        return policy

    async def soft_delete(
        self,
        session: AsyncSession,
        policy_id: UUID,
        tenant_id: UUID,
    ) -> None:
        """Soft-delete a policy by marking it inactive."""
        policy = await self.get(session, policy_id)

        if policy.tenant_id != tenant_id:
            from app.core.exceptions import AuthorisationError

            raise AuthorisationError("Cannot delete another tenant's policy.")

        policy.is_active = False
        await session.flush()
        self.invalidate(policy_id)
        logger.info("policy_deleted", policy_id=str(policy_id))
