"""Route-level rate limiting decorator for FastAPI."""

from __future__ import annotations

import functools
import logging
from typing import Any, Callable

from fastapi import Request
from starlette.responses import JSONResponse

from cerberus.client import CerberusClient, CerberusError, RateLimitedError

logger = logging.getLogger("cerberus_fastapi")

# Module-level client, set via configure()
_client: CerberusClient | None = None


def configure(base_url: str, api_key: str) -> None:
    """Configure the global Cerberus client for decorator use.

    Call once at application startup::

        from cerberus_fastapi.decorators import configure
        configure("https://api.cerberus.dev", "cerb_your_api_key")
    """
    global _client  # noqa: PLW0603
    _client = CerberusClient(base_url=base_url, api_key=api_key)


def rate_limit(
    policy_id: str,
    *,
    identifier_fn: Callable[[Request], str] | None = None,
    fail_open: bool = False,
) -> Callable:  # type: ignore[type-arg]
    """Decorator to rate-limit a single FastAPI route.

    Usage::

        from cerberus_fastapi.decorators import configure, rate_limit

        configure("https://api.cerberus.dev", "cerb_your_api_key")

        @app.get("/resource")
        @rate_limit("policy-uuid")
        async def get_resource(request: Request):
            return {"data": "ok"}
    """

    def _get_identifier(request: Request) -> str:
        if identifier_fn:
            return identifier_fn(request)
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
        @functools.wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            if _client is None:
                raise RuntimeError(
                    "Cerberus client not configured. "
                    "Call cerberus_fastapi.decorators.configure() at startup."
                )

            request: Request | None = kwargs.get("request")
            if request is None:
                for arg in args:
                    if isinstance(arg, Request):
                        request = arg
                        break

            if request is None:
                raise TypeError(
                    "rate_limit decorator requires a 'request: Request' parameter "
                    "in the route function."
                )

            identifier = _get_identifier(request)

            try:
                result = _client.check(policy_id, identifier)
            except RateLimitedError:
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Rate limited"},
                )
            except CerberusError as exc:
                logger.error("Cerberus API error: %s", exc)
                if not fail_open:
                    return JSONResponse(
                        status_code=503,
                        content={"detail": "Rate limit service unavailable"},
                    )
                return await func(*args, **kwargs)
            except Exception:
                logger.exception("Unexpected error in Cerberus rate limiter")
                if not fail_open:
                    return JSONResponse(
                        status_code=503,
                        content={"detail": "Rate limit service unavailable"},
                    )
                return await func(*args, **kwargs)

            if not result.allowed:
                return JSONResponse(
                    status_code=429,
                    content={
                        "detail": "Rate limit exceeded",
                        "retry_after_ms": result.retry_after_ms,
                    },
                    headers={
                        "Retry-After": str(result.retry_after_ms / 1000),
                        "X-RateLimit-Limit": str(result.limit),
                        "X-RateLimit-Remaining": "0",
                    },
                )

            return await func(*args, **kwargs)

        return wrapper

    return decorator
