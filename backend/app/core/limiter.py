"""
LimiterService — orchestrates rate-limit checks.

This is the main entry point for the hot path.  It resolves the policy,
selects the correct algorithm, builds the Redis key, and returns a result
that the API layer can translate into headers.
"""

from __future__ import annotations

from datetime import date
from typing import TYPE_CHECKING
from uuid import UUID

import structlog

from app.core.algorithms.base import RateLimitResult
from app.core.algorithms.sliding_window import SlidingWindowCounter
from app.core.algorithms.token_bucket import TokenBucket
from app.core.exceptions import InvalidPolicy, RedisUnavailable
from app.core.keys import analytics_counter_key, analytics_rejected_key, rate_limit_key
from app.core.policy import PolicyManager
from app.metrics.prometheus import (
    CACHE_HITS,
    CACHE_MISSES,
    CHECK_DURATION,
    CHECKS_ALLOWED,
    CHECKS_REJECTED,
    REDIS_ERRORS,
)

if TYPE_CHECKING:
    from redis.asyncio import Redis
    from sqlalchemy.ext.asyncio import AsyncSession

logger = structlog.get_logger(__name__)


class LimiterService:
    """
    Facade that ties together policy resolution, algorithm dispatch, and
    analytics tracking for every rate-limit check.
    """

    def __init__(self, policy_manager: PolicyManager) -> None:
        self._policy_manager = policy_manager
        self._sliding_window = SlidingWindowCounter()
        self._token_bucket = TokenBucket()

    async def check(
        self,
        redis: Redis,  # type: ignore[type-arg]
        session: AsyncSession,
        *,
        tenant_id: UUID,
        policy_id: UUID,
        identifier: str,
    ) -> RateLimitResult:
        """
        Execute a rate-limit check for the given identifier against a policy.

        This is the hot path — every inbound request from a Cerberus client
        ends up here.  We aim for sub-millisecond overhead on top of the
        Redis round-trip.

        Parameters
        ----------
        redis:
            Async Redis client.
        session:
            Database session (used only on cache miss for policy lookup).
        tenant_id:
            The authenticated tenant's ID.
        policy_id:
            Which rate-limit policy to evaluate.
        identifier:
            Caller-supplied key (e.g. IP address, user ID, API route).

        Returns
        -------
        RateLimitResult
        """
        with CHECK_DURATION.time():
            policy = await self._resolve_policy(session, policy_id)
            key = rate_limit_key(str(tenant_id), str(policy_id), identifier)

            try:
                result = await self._dispatch(redis, key, policy)
            except Exception as exc:
                REDIS_ERRORS.inc()
                logger.error(
                    "redis_check_failed",
                    key=key,
                    error=str(exc),
                    exc_info=True,
                )
                raise RedisUnavailable() from exc

        # Track analytics asynchronously — fire and forget
        await self._track_analytics(redis, tenant_id, result)

        if result.allowed:
            CHECKS_ALLOWED.inc()
        else:
            CHECKS_REJECTED.inc()

        return result

    async def _resolve_policy(self, session: AsyncSession, policy_id: UUID):
        """Look up the policy, tracking cache hit/miss for observability."""
        # The PolicyManager handles caching internally; we just track metrics
        # at this layer so the PolicyManager stays clean.
        cached = self._policy_manager._get_cached(policy_id)
        if cached is not None:
            CACHE_HITS.inc()
            return cached

        CACHE_MISSES.inc()
        return await self._policy_manager.get(session, policy_id)

    async def _dispatch(self, redis, key: str, policy) -> RateLimitResult:
        """Route to the correct algorithm based on the policy configuration."""
        if policy.algorithm == "sliding_window":
            window_us = policy.window_seconds * 1_000_000
            return await self._sliding_window.check(
                redis,
                key,
                limit=policy.limit,
                window_us=window_us,
            )
        elif policy.algorithm == "token_bucket":
            if policy.refill_rate is None:
                raise InvalidPolicy(
                    f"Policy {policy.id} uses token_bucket but has no refill_rate."
                )
            return await self._token_bucket.check(
                redis,
                key,
                capacity=policy.limit,
                refill_rate=policy.refill_rate,
            )
        else:
            raise InvalidPolicy(f"Unknown algorithm: {policy.algorithm}")

    async def _track_analytics(
        self,
        redis: Redis,  # type: ignore[type-arg]
        tenant_id: UUID,
        result: RateLimitResult,
    ) -> None:
        """Increment daily analytics counters in Redis."""
        today = date.today().isoformat()
        counter_key = analytics_counter_key(str(tenant_id), today)

        try:
            pipe = redis.pipeline(transaction=False)
            pipe.incr(counter_key)
            pipe.expire(counter_key, 86400 * 7)  # keep 7 days

            if not result.allowed:
                rejected_key = analytics_rejected_key(str(tenant_id), today)
                pipe.incr(rejected_key)
                pipe.expire(rejected_key, 86400 * 7)

            await pipe.execute()
        except Exception:
            # Analytics are best-effort — never let them break the hot path
            logger.warning("analytics_tracking_failed", tenant_id=str(tenant_id))
