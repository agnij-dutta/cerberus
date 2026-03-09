"""
Request/response schemas for the rate-limit check endpoint.
"""

from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel, Field


class CheckRequest(BaseModel):
    """
    Payload for POST /v1/check.

    The caller identifies itself with a free-form ``identifier`` (e.g. an
    IP address, user ID, or compound key) and references the policy to
    evaluate against.
    """

    policy_id: UUID = Field(
        ...,
        description="UUID of the rate-limit policy to evaluate.",
    )
    identifier: str = Field(
        ...,
        min_length=1,
        max_length=512,
        description="Caller identifier (IP, user ID, etc.).",
    )
    tokens: int = Field(
        default=1,
        ge=1,
        le=100,
        description="Number of tokens to consume (token-bucket only).",
    )


class CheckResponse(BaseModel):
    """
    Response from a rate-limit check.

    The HTTP response also carries standard rate-limit headers, but this
    body is useful for clients that prefer JSON.
    """

    allowed: bool = Field(
        ...,
        description="Whether the request is permitted.",
    )
    limit: int = Field(
        ...,
        description="Maximum requests/tokens allowed in the policy window.",
    )
    remaining: int = Field(
        ...,
        ge=0,
        description="How many more requests are allowed right now.",
    )
    retry_after_ms: int = Field(
        default=0,
        ge=0,
        description="Milliseconds to wait before retrying (0 if allowed).",
    )
