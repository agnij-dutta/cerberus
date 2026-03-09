"""
Unit tests for the token-bucket rate limiter.

Uses fakeredis to simulate Redis without a running server.
"""

from __future__ import annotations

import pytest

from app.core.algorithms.token_bucket import TokenBucket


@pytest.fixture
def algo() -> TokenBucket:
    return TokenBucket()


@pytest.mark.asyncio
async def test_allows_requests_with_tokens(fake_redis, algo):
    """A fresh bucket should allow requests up to capacity."""
    key = "rl:test:bucket:fresh"

    result = await algo.check(fake_redis, key, capacity=10, refill_rate=5)
    assert result.allowed is True
    assert result.remaining == 9  # started with 10, used 1


@pytest.mark.asyncio
async def test_exhausts_bucket(fake_redis, algo):
    """Consuming all tokens should eventually result in a rejection."""
    key = "rl:test:bucket:exhaust"
    capacity = 3

    for i in range(capacity):
        result = await algo.check(fake_redis, key, capacity=capacity, refill_rate=1)
        assert result.allowed is True, f"Request {i} should be allowed"

    # Bucket is empty now
    result = await algo.check(fake_redis, key, capacity=capacity, refill_rate=1)
    assert result.allowed is False
    assert result.remaining == 0
    assert result.retry_after_ms > 0


@pytest.mark.asyncio
async def test_multi_token_request(fake_redis, algo):
    """Requesting multiple tokens at once should work correctly."""
    key = "rl:test:bucket:multi"

    result = await algo.check(fake_redis, key, capacity=10, refill_rate=5, requested=5)
    assert result.allowed is True
    assert result.remaining == 5

    result = await algo.check(fake_redis, key, capacity=10, refill_rate=5, requested=6)
    assert result.allowed is False  # only 5 left, need 6


@pytest.mark.asyncio
async def test_retry_after_is_reasonable(fake_redis, algo):
    """When rejected, retry_after should reflect the deficit."""
    key = "rl:test:bucket:retry"
    capacity = 1
    refill_rate = 1  # 1 token per second

    # Use the only token
    await algo.check(fake_redis, key, capacity=capacity, refill_rate=refill_rate)

    # Next request should give us a retry_after around 1 second
    result = await algo.check(fake_redis, key, capacity=capacity, refill_rate=refill_rate)
    assert result.allowed is False
    # Should be roughly 1000ms, give or take timing jitter
    assert 500 <= result.retry_after_ms <= 2000


@pytest.mark.asyncio
async def test_different_keys_independent(fake_redis, algo):
    """Separate keys should have independent token buckets."""
    for _ in range(3):
        await algo.check(fake_redis, "rl:bucket_x", capacity=3, refill_rate=1)

    result_x = await algo.check(fake_redis, "rl:bucket_x", capacity=3, refill_rate=1)
    assert result_x.allowed is False

    result_y = await algo.check(fake_redis, "rl:bucket_y", capacity=3, refill_rate=1)
    assert result_y.allowed is True


@pytest.mark.asyncio
async def test_script_reload_on_noscript(fake_redis, algo):
    """Verify recovery when Redis flushes the script cache."""
    key = "rl:test:bucket:reload"
    await algo.check(fake_redis, key, capacity=10, refill_rate=5)

    algo._sha = "deadbeef_invalid_sha"

    result = await algo.check(fake_redis, key, capacity=10, refill_rate=5)
    assert result.allowed is True
