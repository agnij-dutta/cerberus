"""
Domain-specific exceptions.

All exceptions follow RFC 7807 Problem Details conventions so they can be
serialised into a consistent error envelope by the global exception handler.
"""

from __future__ import annotations

from typing import Any, Optional


class CerberusError(Exception):
    """Base exception for all Cerberus domain errors."""

    status_code: int = 500
    error_type: str = "https://cerberus.io/errors/internal"
    title: str = "Internal Server Error"

    def __init__(
        self,
        detail: str = "An unexpected error occurred.",
        *,
        extra: Optional[dict[str, Any]] = None,
    ) -> None:
        super().__init__(detail)
        self.detail = detail
        self.extra = extra or {}

    def to_problem_detail(self) -> dict[str, Any]:
        """Serialise to an RFC 7807 Problem Details dict."""
        body: dict[str, Any] = {
            "type": self.error_type,
            "title": self.title,
            "status": self.status_code,
            "detail": self.detail,
        }
        if self.extra:
            body.update(self.extra)
        return body


class RateLimitExceeded(CerberusError):
    """Raised when a rate-limit check fails (429)."""

    status_code = 429
    error_type = "https://cerberus.io/errors/rate-limit-exceeded"
    title = "Rate Limit Exceeded"

    def __init__(
        self,
        detail: str = "You have exceeded the rate limit.",
        *,
        retry_after_ms: int = 0,
        limit: int = 0,
    ) -> None:
        super().__init__(detail, extra={"retry_after_ms": retry_after_ms, "limit": limit})
        self.retry_after_ms = retry_after_ms
        self.limit = limit


class PolicyNotFound(CerberusError):
    """Raised when a requested policy does not exist."""

    status_code = 404
    error_type = "https://cerberus.io/errors/policy-not-found"
    title = "Policy Not Found"

    def __init__(self, policy_id: str) -> None:
        super().__init__(f"Policy '{policy_id}' does not exist.")


class TenantNotFound(CerberusError):
    """Raised when tenant lookup fails."""

    status_code = 404
    error_type = "https://cerberus.io/errors/tenant-not-found"
    title = "Tenant Not Found"

    def __init__(self, identifier: str) -> None:
        super().__init__(f"Tenant '{identifier}' does not exist.")


class AuthenticationError(CerberusError):
    """Raised on missing or invalid API key."""

    status_code = 401
    error_type = "https://cerberus.io/errors/authentication"
    title = "Authentication Required"

    def __init__(self, detail: str = "Invalid or missing API key.") -> None:
        super().__init__(detail)


class AuthorisationError(CerberusError):
    """Raised when a tenant tries to access a resource it doesn't own."""

    status_code = 403
    error_type = "https://cerberus.io/errors/forbidden"
    title = "Forbidden"

    def __init__(self, detail: str = "You do not have permission to perform this action.") -> None:
        super().__init__(detail)


class InvalidPolicy(CerberusError):
    """Raised when policy validation fails."""

    status_code = 422
    error_type = "https://cerberus.io/errors/invalid-policy"
    title = "Invalid Policy"


class RedisUnavailable(CerberusError):
    """Raised when Redis is unreachable and we can't do a graceful fallback."""

    status_code = 503
    error_type = "https://cerberus.io/errors/redis-unavailable"
    title = "Service Unavailable"

    def __init__(self) -> None:
        super().__init__("Rate-limit backend is temporarily unavailable.")
