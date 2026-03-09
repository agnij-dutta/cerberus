"""
Tenant management endpoints (admin-only).

Creating tenants generates a random API key that is returned in cleartext
exactly once.  After creation, only the SHA-256 hash and an 8-character
prefix are stored.
"""

from __future__ import annotations

import secrets

from fastapi import APIRouter, Query
from sqlalchemy import func, select

from app.api.middleware.auth import api_key_prefix, hash_api_key
from app.api.v1.schemas.tenant import (
    TenantCreate,
    TenantCreateResponse,
    TenantListResponse,
    TenantResponse,
)
from app.db.models.tenant import Tenant, TenantTier
from app.dependencies import AdminTenant, DBSession

router = APIRouter(prefix="/tenants", tags=["tenants"])

# Key format: cerb_ + 48 random hex chars = 53 chars total.
# The prefix makes keys easy to identify in logs and config files.
_KEY_PREFIX = "cerb_"
_KEY_RANDOM_BYTES = 24  # 24 bytes = 48 hex chars


def _generate_api_key() -> str:
    """Generate a new API key with a recognisable prefix."""
    return _KEY_PREFIX + secrets.token_hex(_KEY_RANDOM_BYTES)


@router.post(
    "",
    response_model=TenantCreateResponse,
    status_code=201,
    summary="Create tenant",
)
async def create_tenant(
    body: TenantCreate,
    admin: AdminTenant,
    session: DBSession,
) -> TenantCreateResponse:
    """
    Provision a new tenant and return the API key.

    The key is shown exactly once in the response.  There is no way to
    retrieve it later — if lost, a new key must be rotated in.
    """
    raw_key = _generate_api_key()

    tenant = Tenant(
        name=body.name,
        api_key_hash=hash_api_key(raw_key),
        api_key_prefix=api_key_prefix(raw_key),
        tier=TenantTier(body.tier.value),
    )

    session.add(tenant)
    await session.flush()
    await session.refresh(tenant)

    return TenantCreateResponse(
        id=tenant.id,
        name=tenant.name,
        api_key=raw_key,
        api_key_prefix=tenant.api_key_prefix,
        tier=body.tier,
        created_at=tenant.created_at,
    )


@router.get(
    "",
    response_model=TenantListResponse,
    summary="List tenants",
)
async def list_tenants(
    admin: AdminTenant,
    session: DBSession,
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
) -> TenantListResponse:
    """List all tenants (admin-only)."""
    count_stmt = select(func.count()).select_from(Tenant).where(Tenant.is_active.is_(True))
    total_result = await session.execute(count_stmt)
    total = total_result.scalar_one()

    stmt = (
        select(Tenant)
        .where(Tenant.is_active.is_(True))
        .order_by(Tenant.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    result = await session.execute(stmt)
    tenants = list(result.scalars().all())

    return TenantListResponse(
        items=[TenantResponse.model_validate(t) for t in tenants],
        total=total,
        offset=offset,
        limit=limit,
    )
