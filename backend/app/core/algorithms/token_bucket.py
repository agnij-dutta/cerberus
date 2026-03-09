"""
Token-bucket algorithm.

Classic leaky-bucket variant where tokens accumulate at a fixed rate up to
a maximum capacity.  Each request consumes one (or more) tokens.  The Lua
script handles refill calculation and atomic decrement.
"""

from __future__ import annotations

from pathlib import Path
from typing import TYPE_CHECKING

from app.core.algorithms.base import RateLimitAlgorithm, RateLimitResult
from app.utils.time import now_microseconds

if TYPE_CHECKING:
    from redis.asyncio import Redis

_LUA_PATH = Path(__file__).resolve().parent.parent / "lua" / "token_bucket.lua"


class TokenBucket(RateLimitAlgorithm):
    """
    Token-bucket rate limiter backed by a Redis hash.

    Stores ``tokens`` (current count) and ``last_refill`` (timestamp) in a
    hash.  Tokens refill at ``refill_rate`` per second up to ``capacity``.
    """

    def __init__(self) -> None:
        self._script_src: str = _LUA_PATH.read_text()
        self._sha: str | None = None

    async def _ensure_script(self, redis: Redis) -> str:  # type: ignore[type-arg]
        """Load the Lua script into Redis and cache the SHA."""
        if self._sha is None:
            self._sha = await redis.script_load(self._script_src)
        return self._sha

    async def check(
        self,
        redis: Redis,  # type: ignore[type-arg]
        key: str,
        *,
        capacity: int,
        refill_rate: int,
        requested: int = 1,
        **_extra: int,
    ) -> RateLimitResult:
        """
        Run an atomic token-bucket check.

        Parameters
        ----------
        redis:
            Async Redis connection.
        key:
            The rate-limit key.
        capacity:
            Maximum tokens the bucket can hold.
        refill_rate:
            Tokens added per second.
        requested:
            Number of tokens to consume (default 1).

        Returns
        -------
        RateLimitResult
        """
        now = now_microseconds()

        sha = await self._ensure_script(redis)

        try:
            result = await redis.evalsha(
                sha,
                1,
                key,
                str(capacity),
                str(refill_rate),
                str(now),
                str(requested),
            )
        except Exception:
            # Handle script cache eviction after Redis restart
            self._sha = None
            sha = await self._ensure_script(redis)
            result = await redis.evalsha(
                sha,
                1,
                key,
                str(capacity),
                str(refill_rate),
                str(now),
                str(requested),
            )

        allowed, remaining, retry_after_us = result
        retry_after_ms = max(0, int(retry_after_us) // 1000)

        return RateLimitResult(
            allowed=bool(allowed),
            remaining=int(remaining),
            retry_after_ms=retry_after_ms,
        )
