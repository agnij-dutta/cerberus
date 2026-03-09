"""
Unit tests for the sliding-window rate limiter.

Uses fakeredis to simulate Redis without a running server.
"""

from __future__ import annotations

import pytest

from app.core.algorithms.sliding_window import SlidingWindowCounter


@pytest.fixture
def algo() -> SlidingWindowCounter:
    return SlidingWindowCounter()


@pytest.mark.asyncio
async def test_allows_requests_under_limit(fake_redis, algo):
    """Requests below the limit should all be allowed."""
    key = "rl:test:sliding:under"
    window_us = 60_000_000  # 60 seconds in microseconds

    for i in range(5):
        result = await algo.check(fake_redis, key, limit=10, window_us=window_us)
        assert result.allowed is True
        assert result.remaining == 10 - i - 1  # remaining decrements each iteration
        assert result.retry_after_ms == 0


@pytest.mark.asyncio
async def test_rejects_requests_at_limit(fake_redis, algo):
    """Once the limit is reached, subsequent requests should be rejected."""
    key = "rl:test:sliding:at_limit"
    window_us = 60_000_000
    limit = 3

    # Fill up the window
    for _ in range(limit):
        result = await algo.check(fake_redis, key, limit=limit, window_us=window_us)
        assert result.allowed is True

    # This one should be rejected
    result = await algo.check(fake_redis, key, limit=limit, window_us=window_us)
    assert result.allowed is False
    assert result.remaining == 0
    assert result.retry_after_ms > 0


@pytest.mark.asyncio
async def test_single_request_allowed(fake_redis, algo):
    """A single request against a limit of 1 should be allowed."""
    key = "rl:test:sliding:single"
    result = await algo.check(fake_redis, key, limit=1, window_us=10_000_000)
    assert result.allowed is True
    assert result.remaining == 0


@pytest.mark.asyncio
async def test_different_keys_are_independent(fake_redis, algo):
    """Rate limits on different keys should not interfere."""
    window_us = 60_000_000

    for _ in range(5):
        await algo.check(fake_redis, "rl:key_a", limit=5, window_us=window_us)

    # key_a is now exhausted
    result_a = await algo.check(fake_redis, "rl:key_a", limit=5, window_us=window_us)
    assert result_a.allowed is False

    # key_b should still have capacity
    result_b = await algo.check(fake_redis, "rl:key_b", limit=5, window_us=window_us)
    assert result_b.allowed is True


@pytest.mark.asyncio
async def test_script_reload_on_noscript(fake_redis, algo):
    """
    Verify that the algorithm recovers when the script SHA is evicted.

    We simulate this by clearing the internal SHA cache.
    """
    key = "rl:test:sliding:reload"
    await algo.check(fake_redis, key, limit=10, window_us=60_000_000)

    # Simulate script cache eviction
    algo._sha = "deadbeef_invalid_sha"

    # Should recover automatically
    result = await algo.check(fake_redis, key, limit=10, window_us=60_000_000)
    assert result.allowed is True
