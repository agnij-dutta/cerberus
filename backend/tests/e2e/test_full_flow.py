"""
End-to-end test: full flow from tenant creation through rate-limit checking.

This test requires a running PostgreSQL and Redis instance.  It's intended
for local development and CI environments with docker-compose.

To run:
    pytest tests/e2e/ -m e2e --timeout=30

Skip in environments without infrastructure:
    pytest tests/ -m "not e2e"
"""

from __future__ import annotations

import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import AsyncClient


@pytest.mark.e2e
@pytest.mark.asyncio
async def test_full_rate_limit_flow(client: AsyncClient, fake_redis):
    """
    Complete flow:
    1. Create a tenant (admin-only).
    2. Create a sliding-window policy.
    3. Make rate-limit checks until the limit is exceeded.
    4. Verify the 429 response with correct headers.
    5. Check analytics reflect the usage.

    This test mocks the database layer but uses a real (fake)redis to exercise
    the Lua scripts end-to-end.
    """
    # -- Step 1: Create tenant -------------------------------------------------
    # For this test we'll set up the mock objects directly since we're
    # testing the rate-limit flow, not the tenant creation DB logic.

    tenant_id = uuid.UUID("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee")
    policy_id = uuid.UUID("11111111-2222-3333-4444-555555555555")
    api_key = "cerb_" + "e" * 48

    tenant = MagicMock()
    tenant.id = tenant_id
    tenant.name = "e2e-tenant"
    tenant.tier = MagicMock(value="pro")
    tenant.is_active = True

    policy = MagicMock()
    policy.id = policy_id
    policy.tenant_id = tenant_id
    policy.name = "e2e-policy"
    policy.algorithm = "sliding_window"
    policy.limit = 5
    policy.window_seconds = 60
    policy.refill_rate = None
    policy.is_active = True

    # -- Step 2 & 3: Rate-limit checks ----------------------------------------
    with (
        patch("app.dependencies.authenticate_api_key", new_callable=AsyncMock) as mock_auth,
        patch("app.core.policy.PolicyManager.get", new_callable=AsyncMock) as mock_get,
        patch("app.core.policy.PolicyManager._get_cached") as mock_cached,
    ):
        mock_auth.return_value = tenant
        mock_cached.return_value = None
        mock_get.return_value = policy

        allowed_count = 0
        rejected_count = 0

        for i in range(7):
            resp = await client.post(
                "/v1/check",
                json={
                    "policy_id": str(policy_id),
                    "identifier": "e2e-user-1",
                },
                headers={"X-API-Key": api_key},
            )

            data = resp.json()

            if resp.status_code == 200:
                assert data["allowed"] is True
                allowed_count += 1
            elif resp.status_code == 429:
                assert data["allowed"] is False
                assert "Retry-After" in resp.headers
                rejected_count += 1
            else:
                pytest.fail(f"Unexpected status code: {resp.status_code}")

        # With a limit of 5, we should have 5 allowed and 2 rejected
        assert allowed_count == 5, f"Expected 5 allowed, got {allowed_count}"
        assert rejected_count == 2, f"Expected 2 rejected, got {rejected_count}"

    # -- Step 4: Check analytics -----------------------------------------------
    # Analytics are stored in Redis by the limiter service.
    # Verify the counters were incremented.
    from datetime import date

    from app.core.keys import analytics_counter_key, analytics_rejected_key

    today = date.today().isoformat()
    total = await fake_redis.get(analytics_counter_key(str(tenant_id), today))
    rejected = await fake_redis.get(analytics_rejected_key(str(tenant_id), today))

    assert total is not None
    assert int(total) == 7  # all 7 requests counted
    assert rejected is not None
    assert int(rejected) == 2  # 2 rejections


@pytest.mark.e2e
@pytest.mark.asyncio
async def test_token_bucket_flow(client: AsyncClient, fake_redis):
    """
    Token-bucket variant of the full flow.

    Verifies that the token-bucket Lua script works correctly through the
    HTTP layer.
    """
    tenant_id = uuid.UUID("bbbbbbbb-cccc-dddd-eeee-ffffffffffff")
    policy_id = uuid.UUID("22222222-3333-4444-5555-666666666666")
    api_key = "cerb_" + "f" * 48

    tenant = MagicMock()
    tenant.id = tenant_id
    tenant.name = "e2e-bucket-tenant"
    tenant.tier = MagicMock(value="enterprise")
    tenant.is_active = True

    policy = MagicMock()
    policy.id = policy_id
    policy.tenant_id = tenant_id
    policy.name = "e2e-bucket-policy"
    policy.algorithm = "token_bucket"
    policy.limit = 3  # bucket capacity
    policy.window_seconds = 60
    policy.refill_rate = 1.0  # 1 token/sec
    policy.is_active = True

    with (
        patch("app.dependencies.authenticate_api_key", new_callable=AsyncMock) as mock_auth,
        patch("app.core.policy.PolicyManager.get", new_callable=AsyncMock) as mock_get,
        patch("app.core.policy.PolicyManager._get_cached") as mock_cached,
    ):
        mock_auth.return_value = tenant
        mock_cached.return_value = None
        mock_get.return_value = policy

        # Use all 3 tokens
        for i in range(3):
            resp = await client.post(
                "/v1/check",
                json={"policy_id": str(policy_id), "identifier": "bucket-user"},
                headers={"X-API-Key": api_key},
            )
            assert resp.status_code == 200, f"Request {i} should be allowed"

        # 4th request should be rejected
        resp = await client.post(
            "/v1/check",
            json={"policy_id": str(policy_id), "identifier": "bucket-user"},
            headers={"X-API-Key": api_key},
        )
        assert resp.status_code == 429
        data = resp.json()
        assert data["retry_after_ms"] > 0
