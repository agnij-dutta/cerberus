"""
API key authentication middleware.

Extracts the API key from the ``X-API-Key`` header, hashes it with SHA-256,
and looks up the corresponding tenant.  Results are cached in an LRU dict
to avoid hitting the database on every request.
"""

from __future__ import annotations

import hashlib
from typing import TYPE_CHECKING

import structlog
from sqlalchemy import select

from app.config import get_settings
from app.core.exceptions import AuthenticationError
from app.db.models.tenant import Tenant

if TYPE_CHECKING:
    from uuid import UUID

    from sqlalchemy.ext.asyncio import AsyncSession

logger = structlog.get_logger(__name__)


def hash_api_key(raw_key: str) -> str:
    """Return the SHA-256 hex digest of an API key."""
    return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()


def api_key_prefix(raw_key: str) -> str:
    """Extract the prefix portion of an API key (first 8 chars)."""
    return raw_key[:8]


# In-memory cache for tenant lookups keyed by API key hash.
# This avoids a DB query on every single request.  The cache is bounded
# and per-worker, which is acceptable for this use case.
_tenant_cache: dict[str, tuple[UUID, str, bool]] = {}
_CACHE_MAX = 1024


def _cache_tenant(key_hash: str, tenant: Tenant) -> None:
    """Store a tenant in the local lookup cache."""
    if len(_tenant_cache) >= _CACHE_MAX:
        # Evict oldest entry — not true LRU, but good enough.
        # TODO: switch to cachetools.LRUCache if this becomes a bottleneck
        oldest_key = next(iter(_tenant_cache))
        del _tenant_cache[oldest_key]

    _tenant_cache[key_hash] = (tenant.id, tenant.tier.value, tenant.is_active)


def invalidate_tenant_cache() -> None:
    """Flush the tenant auth cache (e.g. after key rotation)."""
    _tenant_cache.clear()


async def authenticate_api_key(
    raw_key: str,
    session: AsyncSession,
) -> Tenant:
    """
    Validate an API key and return the associated tenant.

    Parameters
    ----------
    raw_key:
        The raw API key from the request header.
    session:
        An active database session.

    Returns
    -------
    Tenant
        The authenticated tenant object.

    Raises
    ------
    AuthenticationError
        If the key is missing, malformed, or doesn't match any active tenant.
    """
    if not raw_key or len(raw_key) < 16:
        raise AuthenticationError("API key is missing or too short.")

    key_hash = hash_api_key(raw_key)

    # Check local cache first
    cached = _tenant_cache.get(key_hash)
    if cached is not None:
        tenant_id, tier, is_active = cached
        if not is_active:
            raise AuthenticationError("API key has been deactivated.")
        # Reconstruct a minimal tenant-like object from cache
        # For the hot path we only need id and tier — full object isn't required
        stmt = select(Tenant).where(Tenant.id == tenant_id)
        result = await session.execute(stmt)
        tenant = result.scalar_one_or_none()
        if tenant is None:
            del _tenant_cache[key_hash]
            raise AuthenticationError()
        return tenant

    # Cache miss — query by prefix for speed, then verify full hash
    prefix = api_key_prefix(raw_key)
    stmt = select(Tenant).where(Tenant.api_key_prefix == prefix)
    result = await session.execute(stmt)
    candidates = list(result.scalars().all())

    for tenant in candidates:
        if tenant.api_key_hash == key_hash:
            if not tenant.is_active:
                raise AuthenticationError("API key has been deactivated.")
            _cache_tenant(key_hash, tenant)
            return tenant

    raise AuthenticationError("Invalid API key.")


def is_admin_key(raw_key: str) -> bool:
    """Check whether the provided key is the bootstrap admin key."""
    settings = get_settings()
    return settings.admin_api_key is not None and raw_key == settings.admin_api_key
