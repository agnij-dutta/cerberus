"""
Integration tests for POST /v1/check.

These tests exercise the full HTTP layer but use fakeredis and mocked
database sessions to avoid external dependencies.
"""

from __future__ import annotations

import uuid
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


def _mock_policy(algorithm="sliding_window", limit=10, window_seconds=60, refill_rate=None):
    policy = MagicMock()
    policy.id = uuid.UUID("11111111-2222-3333-4444-555555555555")
    policy.tenant_id = uuid.UUID("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee")
    policy.name = "test-policy"
    policy.algorithm = algorithm
    policy.limit = limit
    policy.window_seconds = window_seconds
    policy.refill_rate = refill_rate
    policy.is_active = True
    return policy


@pytest.mark.asyncio
@patch("app.dependencies.authenticate_api_key", new_callable=AsyncMock)
@patch("app.core.policy.PolicyManager.get", new_callable=AsyncMock)
@patch("app.core.policy.PolicyManager._get_cached")
async def test_check_allowed(
    mock_cached,
    mock_get,
    mock_auth,
    client: AsyncClient,
    fake_redis,
):
    """A request under the limit should return allowed=true and 200."""
    tenant = _mock_tenant()
    policy = _mock_policy(limit=100)

    mock_auth.return_value = tenant
    mock_cached.return_value = None
    mock_get.return_value = policy

    response = await client.post(
        "/v1/check",
        json={
            "policy_id": str(policy.id),
            "identifier": "192.168.1.1",
        },
        headers={"X-API-Key": "cerb_" + "a" * 48},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["allowed"] is True
    assert data["remaining"] >= 0
    assert "X-RateLimit-Limit" in response.headers
    assert "X-RateLimit-Remaining" in response.headers


@pytest.mark.asyncio
@patch("app.dependencies.authenticate_api_key", new_callable=AsyncMock)
@patch("app.core.policy.PolicyManager.get", new_callable=AsyncMock)
@patch("app.core.policy.PolicyManager._get_cached")
async def test_check_rejected_at_limit(
    mock_cached,
    mock_get,
    mock_auth,
    client: AsyncClient,
    fake_redis,
):
    """Once the limit is hit, the endpoint should return 429."""
    tenant = _mock_tenant()
    policy = _mock_policy(limit=2)

    mock_auth.return_value = tenant
    mock_cached.return_value = None
    mock_get.return_value = policy

    # Exhaust the limit
    for _ in range(2):
        resp = await client.post(
            "/v1/check",
            json={"policy_id": str(policy.id), "identifier": "10.0.0.1"},
            headers={"X-API-Key": "cerb_" + "a" * 48},
        )
        assert resp.status_code == 200

    # This should be rejected
    resp = await client.post(
        "/v1/check",
        json={"policy_id": str(policy.id), "identifier": "10.0.0.1"},
        headers={"X-API-Key": "cerb_" + "a" * 48},
    )

    assert resp.status_code == 429
    data = resp.json()
    assert data["allowed"] is False
    assert "Retry-After" in resp.headers


@pytest.mark.asyncio
async def test_check_missing_api_key(client: AsyncClient):
    """Requests without an API key should get 422 (missing header)."""
    response = await client.post(
        "/v1/check",
        json={
            "policy_id": "11111111-2222-3333-4444-555555555555",
            "identifier": "test",
        },
    )
    # FastAPI returns 422 for missing required headers
    assert response.status_code == 422


@pytest.mark.asyncio
@patch("app.dependencies.authenticate_api_key", new_callable=AsyncMock)
async def test_check_invalid_body(mock_auth, client: AsyncClient):
    """Malformed request bodies should return 422."""
    mock_auth.return_value = _mock_tenant()

    response = await client.post(
        "/v1/check",
        json={"identifier": "test"},  # missing policy_id
        headers={"X-API-Key": "cerb_" + "a" * 48},
    )
    assert response.status_code == 422
