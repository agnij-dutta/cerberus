"""
Sliding-window counter algorithm.

Backed by a Redis sorted set where each member is scored by its timestamp.
The Lua script handles the atomic check-and-insert to avoid race conditions.
"""

from __future__ import annotations

import uuid
from pathlib import Path
from typing import TYPE_CHECKING, Optional

from app.core.algorithms.base import RateLimitAlgorithm, RateLimitResult
from app.utils.time import now_microseconds

if TYPE_CHECKING:
    from redis.asyncio import Redis

_LUA_PATH = Path(__file__).resolve().parent.parent / "lua" / "sliding_window.lua"


class SlidingWindowCounter(RateLimitAlgorithm):
    """
    Sliding-window rate limiter using a Redis sorted set.

    Each request is stored as a member with its timestamp as the score.
    Old entries are evicted on every call, giving us a true sliding window
    rather than the fixed-window approximation.
    """

    def __init__(self) -> None:
        self._script_src: str = _LUA_PATH.read_text()
        self._sha: Optional[str] = None

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
        limit: int,
        window_us: int,
        **_extra: int,
    ) -> RateLimitResult:
        """
        Run an atomic sliding-window check.

        Parameters
        ----------
        redis:
            Async Redis connection.
        key:
            The rate-limit key.
        limit:
            Maximum number of requests allowed in the window.
        window_us:
            Window size in microseconds.

        Returns
        -------
        RateLimitResult
        """
        now = now_microseconds()
        member = f"{now}:{uuid.uuid4().hex[:8]}"

        sha = await self._ensure_script(redis)

        try:
            result = await redis.evalsha(
                sha,
                1,
                key,
                str(now),
                str(window_us),
                str(limit),
                member,
            )
        except Exception:
            # Script might have been flushed (e.g. after Redis restart) — reload once
            self._sha = None
            sha = await self._ensure_script(redis)
            result = await redis.evalsha(
                sha,
                1,
                key,
                str(now),
                str(window_us),
                str(limit),
                member,
            )

        allowed, remaining, retry_after_us = result
        # Convert retry_after from microseconds to milliseconds for the API layer
        retry_after_ms = max(0, int(retry_after_us) // 1000)

        return RateLimitResult(
            allowed=bool(allowed),
            remaining=int(remaining),
            retry_after_ms=retry_after_ms,
        )
