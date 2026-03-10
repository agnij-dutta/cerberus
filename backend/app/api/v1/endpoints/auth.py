"""
JWT authentication endpoints for browser-based dashboard access.

Provides signup, login, and token-based identity retrieval alongside the
existing API-key authentication flow.
"""

from __future__ import annotations

import secrets
from datetime import UTC, datetime, timedelta

import jwt
import structlog
from fastapi import APIRouter
from passlib.context import CryptContext
from sqlalchemy import select

from app.api.middleware.auth import api_key_prefix, hash_api_key
from app.api.v1.schemas.auth import (
    AuthTenantResponse,
    LoginRequest,
    LoginResponse,
    MeResponse,
    SignupRequest,
    SignupResponse,
)
from app.config import get_settings
from app.core.exceptions import AuthenticationError, CerberusError
from app.db.models.tenant import Tenant, TenantTier
from app.dependencies import DBSession, JWTTenant

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])

# Password hashing context -- bcrypt with automatic salt.
_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Key format matches the tenant creation endpoint.
_KEY_PREFIX = "cerb_"
_KEY_RANDOM_BYTES = 24  # 24 bytes = 48 hex chars


class EmailConflictError(CerberusError):
    """Raised when a signup is attempted with an already-registered email."""

    status_code = 409
    error_type = "https://cerberus.io/errors/email-conflict"
    title = "Email Already Registered"

    def __init__(self) -> None:
        super().__init__("A tenant with this email address already exists.")


def _hash_password(plain: str) -> str:
    """Hash a plaintext password with bcrypt."""
    return _pwd_context.hash(plain)


def _verify_password(plain: str, hashed: str) -> bool:
    """Verify a plaintext password against its bcrypt hash."""
    return _pwd_context.verify(plain, hashed)


def _create_access_token(tenant_id: str) -> str:
    """
    Create a signed JWT for the given tenant.

    The token contains:
    - ``sub``: tenant ID as a string
    - ``iat``: issued-at timestamp
    - ``exp``: expiration timestamp
    """
    settings = get_settings()
    now = datetime.now(UTC)
    payload = {
        "sub": tenant_id,
        "iat": now,
        "exp": now + timedelta(minutes=settings.jwt_expire_minutes),
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def _generate_api_key() -> str:
    """Generate a new API key with a recognisable prefix."""
    return _KEY_PREFIX + secrets.token_hex(_KEY_RANDOM_BYTES)


@router.post(
    "/signup",
    response_model=SignupResponse,
    status_code=201,
    summary="Register a new tenant",
)
async def signup(body: SignupRequest, session: DBSession) -> SignupResponse:
    """
    Create a new tenant with email and password.

    Returns a JWT access token for immediate dashboard use and the raw API
    key (shown exactly once).
    """
    # Check for duplicate email
    existing = await session.execute(
        select(Tenant).where(Tenant.email == body.email)
    )
    if existing.scalar_one_or_none() is not None:
        raise EmailConflictError()

    raw_key = _generate_api_key()

    tenant = Tenant(
        name=body.name,
        email=body.email,
        password_hash=_hash_password(body.password),
        api_key_hash=hash_api_key(raw_key),
        api_key_prefix=api_key_prefix(raw_key),
        tier=TenantTier.FREE,
    )

    session.add(tenant)
    await session.flush()
    await session.refresh(tenant)

    access_token = _create_access_token(str(tenant.id))

    logger.info("tenant_signup", tenant_id=str(tenant.id), email=body.email)

    return SignupResponse(
        tenant=AuthTenantResponse.model_validate(tenant),
        access_token=access_token,
        api_key=raw_key,
    )


@router.post(
    "/login",
    response_model=LoginResponse,
    summary="Login with email and password",
)
async def login(body: LoginRequest, session: DBSession) -> LoginResponse:
    """
    Authenticate a tenant by email and password.

    Returns a JWT access token on success.
    """
    result = await session.execute(
        select(Tenant).where(Tenant.email == body.email)
    )
    tenant = result.scalar_one_or_none()

    if tenant is None or tenant.password_hash is None:
        raise AuthenticationError("Invalid email or password.")

    if not _verify_password(body.password, tenant.password_hash):
        raise AuthenticationError("Invalid email or password.")

    if not tenant.is_active:
        raise AuthenticationError("This account has been deactivated.")

    access_token = _create_access_token(str(tenant.id))

    logger.info("tenant_login", tenant_id=str(tenant.id))

    return LoginResponse(
        tenant=AuthTenantResponse.model_validate(tenant),
        access_token=access_token,
    )


@router.get(
    "/me",
    response_model=MeResponse,
    summary="Get current tenant profile",
)
async def me(tenant: JWTTenant) -> MeResponse:
    """
    Return the profile of the currently authenticated tenant.

    Requires a valid JWT Bearer token.
    """
    return MeResponse.model_validate(tenant)
