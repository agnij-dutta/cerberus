"""
Abstract base class for rate-limiting algorithms.

Every algorithm must run its logic atomically inside Redis (via Lua scripts)
to guarantee correctness under concurrent access.
"""

from __future__ import annotations

import abc
from dataclasses import dataclass
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from redis.asyncio import Redis


@dataclass(frozen=True, slots=True)
class RateLimitResult:
    """
    The outcome of a single rate-limit check.

    Attributes
    ----------
    allowed:
        Whether the request should be permitted.
    remaining:
        How many more requests are allowed in the current window / bucket.
    retry_after_ms:
        If rejected, how long (in milliseconds) the caller should wait
        before retrying.  Zero when ``allowed`` is True.
    """

    allowed: bool
    remaining: int
    retry_after_ms: int


class RateLimitAlgorithm(abc.ABC):
    """
    Contract that all rate-limiting strategies must satisfy.

    Implementations should load their Lua script once at construction time
    and register it with Redis via ``SCRIPT LOAD`` so subsequent calls use
    ``EVALSHA`` instead of ``EVAL`` — saving bandwidth on every hot-path hit.
    """

    @abc.abstractmethod
    async def check(
        self,
        redis: Redis,  # type: ignore[type-arg]
        key: str,
        **params: int,
    ) -> RateLimitResult:
        """
        Execute an atomic rate-limit check against Redis.

        Parameters
        ----------
        redis:
            An async Redis client.
        key:
            The fully-qualified Redis key for this rate-limit bucket.
        **params:
            Algorithm-specific parameters (limit, window, capacity, etc.).

        Returns
        -------
        RateLimitResult
        """
        ...
