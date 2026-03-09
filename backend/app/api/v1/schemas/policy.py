"""
Request/response schemas for policy CRUD endpoints.
"""

from datetime import datetime
from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, Field, model_validator


class AlgorithmType(StrEnum):
    SLIDING_WINDOW = "sliding_window"
    TOKEN_BUCKET = "token_bucket"


class PolicyCreate(BaseModel):
    """Schema for creating a new rate-limit policy."""

    name: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Human-readable name for this policy.",
    )
    algorithm: AlgorithmType = Field(
        ...,
        description="Rate-limiting algorithm to use.",
    )
    limit: int = Field(
        ...,
        ge=1,
        le=10_000_000,
        description="Maximum requests (sliding_window) or bucket capacity (token_bucket).",
    )
    window_seconds: int = Field(
        default=60,
        ge=1,
        le=86400,
        description="Window duration in seconds (used by sliding_window).",
    )
    refill_rate: float | None = Field(
        default=None,
        ge=0.01,
        le=1_000_000,
        description="Tokens per second (required for token_bucket).",
    )

    @model_validator(mode="after")
    def validate_algorithm_params(self):
        """Ensure token_bucket policies have a refill_rate."""
        if self.algorithm == AlgorithmType.TOKEN_BUCKET and self.refill_rate is None:
            raise ValueError("refill_rate is required for token_bucket algorithm.")
        return self


class PolicyUpdate(BaseModel):
    """Schema for partial policy updates."""

    name: str | None = Field(None, min_length=1, max_length=255)
    limit: int | None = Field(None, ge=1, le=10_000_000)
    window_seconds: int | None = Field(None, ge=1, le=86400)
    refill_rate: float | None = Field(None, ge=0.01, le=1_000_000)
    is_active: bool | None = None


class PolicyResponse(BaseModel):
    """Schema returned for policy reads."""

    id: UUID
    tenant_id: UUID
    name: str
    algorithm: AlgorithmType
    limit: int
    window_seconds: int
    refill_rate: float | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PolicyListResponse(BaseModel):
    """Paginated list of policies."""

    items: list[PolicyResponse]
    total: int
    offset: int
    limit: int
