"""
Request/response schemas for JWT authentication endpoints.
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from app.api.v1.schemas.tenant import TenantTierSchema


class SignupRequest(BaseModel):
    """Schema for tenant registration with email and password."""

    name: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Display name for the tenant.",
    )
    email: EmailStr = Field(
        ...,
        description="Email address used for login.",
    )
    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description="Password (min 8 characters).",
    )


class LoginRequest(BaseModel):
    """Schema for email/password login."""

    email: EmailStr
    password: str = Field(..., min_length=1)


class AuthTenantResponse(BaseModel):
    """Tenant info included in auth responses."""

    id: UUID
    name: str
    email: str | None = None
    tier: TenantTierSchema

    model_config = {"from_attributes": True}


class SignupResponse(BaseModel):
    """Returned after successful signup."""

    tenant: AuthTenantResponse
    access_token: str = Field(
        ...,
        description="JWT access token for subsequent requests.",
    )
    api_key: str = Field(
        ...,
        description="The raw API key. Save this -- it will not be shown again.",
    )


class LoginResponse(BaseModel):
    """Returned after successful login."""

    tenant: AuthTenantResponse
    access_token: str = Field(
        ...,
        description="JWT access token for subsequent requests.",
    )


class MeResponse(BaseModel):
    """Current tenant profile."""

    id: UUID
    name: str
    email: str | None = None
    tier: TenantTierSchema
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
