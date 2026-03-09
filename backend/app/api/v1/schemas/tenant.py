"""
Request/response schemas for tenant management endpoints.
"""

from datetime import datetime
from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, Field


class TenantTierSchema(StrEnum):
    FREE = "free"
    PRO = "pro"
    ENTERPRISE = "enterprise"


class TenantCreate(BaseModel):
    """Schema for creating a new tenant."""

    name: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Display name for the tenant.",
    )
    tier: TenantTierSchema = Field(
        default=TenantTierSchema.FREE,
        description="Billing tier.",
    )


class TenantResponse(BaseModel):
    """Public tenant representation (never includes the API key hash)."""

    id: UUID
    name: str
    api_key_prefix: str
    is_active: bool
    tier: TenantTierSchema
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TenantCreateResponse(BaseModel):
    """
    Returned exactly once when a tenant is created.

    The ``api_key`` field contains the raw key in cleartext.  It is never
    stored or returned again — the caller must save it immediately.
    """

    id: UUID
    name: str
    api_key: str = Field(
        ...,
        description="The raw API key. Save this — it will not be shown again.",
    )
    api_key_prefix: str
    tier: TenantTierSchema
    created_at: datetime

    model_config = {"from_attributes": True}


class TenantListResponse(BaseModel):
    """Paginated list of tenants."""

    items: list[TenantResponse]
    total: int
    offset: int
    limit: int
