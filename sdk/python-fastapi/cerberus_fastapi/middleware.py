"""FastAPI middleware for Cerberus rate limiting."""

from __future__ import annotations

import logging
from typing import Callable

from fastapi import FastAPI, Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from cerberus.client import CerberusClient, CerberusError, RateLimitedError

logger = logging.getLogger("cerberus_fastapi")


class CerberusMiddleware(BaseHTTPMiddleware):
    """FastAPI middleware that enforces Cerberus rate limits on every request.

    Usage::

        from cerberus_fastapi import CerberusMiddleware

        app = FastAPI()
        app.add_middleware(
            CerberusMiddleware,
            base_url="https://api.cerberus.dev",
            api_key="cerb_your_api_key",
            policy_id="your-policy-uuid",
        )
    """

    def __init__(
        self,
        app: FastAPI,
        *,
        base_url: str,
        api_key: str,
        policy_id: str,
        identifier_fn: Callable[[Request], str] | None = None,
        fail_open: bool = False,
    ) -> None:
        super().__init__(app)
        self.client = CerberusClient(base_url=base_url, api_key=api_key)
        self.policy_id = policy_id
        self.identifier_fn = identifier_fn or self._default_identifier
        self.fail_open = fail_open

    async def dispatch(self, request: Request, call_next: Callable) -> Response:  # type: ignore[type-arg]
        identifier = self.identifier_fn(request)

        try:
            result = self.client.check(self.policy_id, identifier)
        except RateLimitedError:
            return JSONResponse(
                status_code=429,
                content={"detail": "Rate limited"},
            )
        except CerberusError as exc:
            logger.error("Cerberus API error: %s", exc)
            if not self.fail_open:
                return JSONResponse(
                    status_code=503,
                    content={"detail": "Rate limit service unavailable"},
                )
            return await call_next(request)
        except Exception:
            logger.exception("Unexpected error in Cerberus middleware")
            if not self.fail_open:
                return JSONResponse(
                    status_code=503,
                    content={"detail": "Rate limit service unavailable"},
                )
            return await call_next(request)

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

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(result.limit)
        response.headers["X-RateLimit-Remaining"] = str(result.remaining)
        return response

    @staticmethod
    def _default_identifier(request: Request) -> str:
        """Extract client IP as the default rate limit identifier."""
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"
