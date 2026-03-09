"""
Integration tests for the policies CRUD endpoints.

Validates request/response schemas and basic CRUD operations through
the HTTP layer.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import AsyncClient


def _mock_tenant():
    tenant = MagicMock()
    tenant.id = uuid.UUID("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee")
    tenant.name = "test-tenant"
    tenant.tier = MagicMock(value="pro")
    tenant.is_active = True
    return tenant


def _mock_policy(**overrides):
    """Return a MagicMock that looks like a persisted Policy row."""
    defaults = {
        "id": uuid.uuid4(),
        "tenant_id": uuid.UUID("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"),
        "name": "api-rate-limit",
        "algorithm": "sliding_window",
        "limit": 1000,
        "window_seconds": 3600,
        "refill_rate": None,
        "is_active": True,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    defaults.update(overrides)
    policy = MagicMock()
    for k, v in defaults.items():
        setattr(policy, k, v)
    return policy


@pytest.mark.asyncio
@patch("app.dependencies.authenticate_api_key", new_callable=AsyncMock)
async def test_create_policy_validation(mock_auth, client: AsyncClient):
    """Creating a token_bucket policy without refill_rate should fail."""
    mock_auth.return_value = _mock_tenant()

    response = await client.post(
        "/v1/policies",
        json={
            "name": "bad-policy",
            "algorithm": "token_bucket",
            "limit": 100,
            # missing refill_rate
        },
        headers={"X-API-Key": "cerb_" + "a" * 48},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
@patch("app.dependencies.authenticate_api_key", new_callable=AsyncMock)
@patch("app.core.policy.PolicyManager.create", new_callable=AsyncMock)
async def test_create_policy_valid_sliding_window(
    mock_create, mock_auth, client: AsyncClient
):
    """A valid sliding_window policy should be accepted (schema-level test)."""
    mock_auth.return_value = _mock_tenant()
    mock_create.return_value = _mock_policy()

    payload = {
        "name": "api-rate-limit",
        "algorithm": "sliding_window",
        "limit": 1000,
        "window_seconds": 3600,
    }

    response = await client.post(
        "/v1/policies",
        json=payload,
        headers={"X-API-Key": "cerb_" + "a" * 48},
    )
    # The request passes validation and the mocked create returns a policy
    assert response.status_code == 201


@pytest.mark.asyncio
@patch("app.dependencies.authenticate_api_key", new_callable=AsyncMock)
async def test_create_policy_invalid_algorithm(mock_auth, client: AsyncClient):
    """An unknown algorithm should be rejected by Pydantic."""
    mock_auth.return_value = _mock_tenant()

    response = await client.post(
        "/v1/policies",
        json={
            "name": "bad",
            "algorithm": "leaky_bucket",  # not a valid enum value
            "limit": 100,
        },
        headers={"X-API-Key": "cerb_" + "a" * 48},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
@patch("app.dependencies.authenticate_api_key", new_callable=AsyncMock)
async def test_list_policies_requires_auth(mock_auth, client: AsyncClient):
    """The list endpoint should require authentication."""
    mock_auth.side_effect = Exception("auth failed")

    response = await client.get("/v1/policies")
    # Missing header -> 422, or if auth mock raises -> 500
    assert response.status_code in (422, 500)


@pytest.mark.asyncio
async def test_delete_policy_no_auth(client: AsyncClient):
    """DELETE without auth should fail."""
    response = await client.delete(
        f"/v1/policies/{uuid.uuid4()}",
    )
    assert response.status_code == 422  # missing X-API-Key header
