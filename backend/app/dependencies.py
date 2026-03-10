"""
FastAPI dependency injection.

Centralises all injectable dependencies so endpoints stay thin and testable.
"""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

import jwt
import structlog
from fastapi import Depends, Header, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.middleware.auth import authenticate_api_key, is_admin_key
from app.config import Settings, get_settings
from app.core.exceptions import AuthenticationError, AuthorisationError
from app.core.limiter import LimiterService
from app.core.policy import PolicyManager
from app.db.models.tenant import Tenant
from app.db.session import get_session

logger = structlog.get_logger(__name__)

# ---------------------------------------------------------------------------
# Singletons (created once at import time, shared across requests)
# ---------------------------------------------------------------------------

_policy_manager = PolicyManager()
_limiter_service = LimiterService(_policy_manager)


def get_policy_manager() -> PolicyManager:
    """Return the shared PolicyManager instance."""
    return _policy_manager


def get_limiter_service() -> LimiterService:
    """Return the shared LimiterService instance."""
    return _limiter_service


# ---------------------------------------------------------------------------
# Redis
# ---------------------------------------------------------------------------


async def get_redis(request: Request):
    """
    Yield the async Redis client from the application state.

    The client is created during lifespan startup and stored on ``app.state``.
    """
    return request.app.state.redis


# ---------------------------------------------------------------------------
# Database session
# ---------------------------------------------------------------------------

DBSession = Annotated[AsyncSession, Depends(get_session)]


# ---------------------------------------------------------------------------
# Authentication
# ---------------------------------------------------------------------------


async def get_current_tenant(
    x_api_key: Annotated[str, Header()],
    session: DBSession,
) -> Tenant:
    """
    Dependency that authenticates the request and returns the tenant.

    Reads the ``X-API-Key`` header, validates it, and resolves the tenant.
    """
    return await authenticate_api_key(x_api_key, session)


async def require_admin(
    x_api_key: Annotated[str, Header()],
    session: DBSession,
) -> Tenant | None:
    """
    Dependency for admin-only endpoints.

    Accepts either the bootstrap admin key (returns None for the tenant)
    or a valid tenant key with enterprise tier.
    """
    if is_admin_key(x_api_key):
        return None

    tenant = await authenticate_api_key(x_api_key, session)
    if tenant.tier.value != "enterprise":
        raise AuthorisationError("Admin access requires an enterprise-tier account.")
    return tenant


# ---------------------------------------------------------------------------
# JWT Authentication
# ---------------------------------------------------------------------------

_bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_tenant_from_jwt(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer_scheme)],
    session: DBSession,
) -> Tenant:
    """
    Dependency that authenticates a request via a JWT Bearer token.

    Extracts the token from the ``Authorization: Bearer <token>`` header,
    decodes it, and loads the corresponding tenant from the database.
    """
    if credentials is None:
        raise AuthenticationError("Missing Bearer token.")

    settings = get_settings()
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
    except jwt.ExpiredSignatureError:
        raise AuthenticationError("Token has expired.")
    except jwt.InvalidTokenError:
        raise AuthenticationError("Invalid token.")

    tenant_id_str: str | None = payload.get("sub")
    if tenant_id_str is None:
        raise AuthenticationError("Invalid token payload.")

    try:
        tenant_id = UUID(tenant_id_str)
    except ValueError:
        raise AuthenticationError("Invalid token payload.")

    result = await session.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()

    if tenant is None:
        raise AuthenticationError("Tenant not found.")

    if not tenant.is_active:
        raise AuthenticationError("This account has been deactivated.")

    return tenant


# ---------------------------------------------------------------------------
# Convenience type aliases for endpoints
# ---------------------------------------------------------------------------

CurrentTenant = Annotated[Tenant, Depends(get_current_tenant)]
AdminTenant = Annotated[Tenant | None, Depends(require_admin)]
JWTTenant = Annotated[Tenant, Depends(get_current_tenant_from_jwt)]
SettingsDep = Annotated[Settings, Depends(get_settings)]
Redis = Annotated[object, Depends(get_redis)]
Limiter = Annotated[LimiterService, Depends(get_limiter_service)]
PolicyMgr = Annotated[PolicyManager, Depends(get_policy_manager)]
