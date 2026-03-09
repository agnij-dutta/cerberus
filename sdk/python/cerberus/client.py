"""Cerberus Python SDK client."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

import httpx


@dataclass(frozen=True)
class CheckResult:
    """Result of a rate limit check."""

    allowed: bool
    remaining: int
    limit: int
    reset: int
    retry_after: float | None


@dataclass(frozen=True)
class Policy:
    """A rate limit policy."""

    id: str
    tenant_id: str
    name: str
    algorithm: str
    limit: int
    window_seconds: int
    burst_limit: int | None
    is_active: bool


class CerberusError(Exception):
    """Base exception for Cerberus SDK errors."""

    def __init__(self, status_code: int, detail: str) -> None:
        self.status_code = status_code
        self.detail = detail
        super().__init__(f"Cerberus API error {status_code}: {detail}")


class RateLimitedError(CerberusError):
    """Raised when the caller itself is rate limited by Cerberus."""

    def __init__(self, retry_after: float, detail: str = "Rate limited") -> None:
        self.retry_after = retry_after
        super().__init__(429, detail)


class CerberusClient:
    """Client for the Cerberus rate limiting API.

    Usage:
        client = CerberusClient(
            base_url="http://localhost:8000",
            api_key="your-tenant-api-key",
        )

        result = client.check("user:42", "standard-api")
        if result.allowed:
            # proceed
        else:
            # back off for result.retry_after seconds
    """

    def __init__(
        self,
        base_url: str,
        api_key: str,
        timeout: float = 5.0,
    ) -> None:
        self._base_url = base_url.rstrip("/")
        self._api_key = api_key
        self._client = httpx.Client(
            base_url=f"{self._base_url}/api/v1",
            headers={
                "X-API-Key": api_key,
                "Content-Type": "application/json",
            },
            timeout=timeout,
        )

    def check(
        self,
        key: str,
        policy: str,
        cost: int = 1,
    ) -> CheckResult:
        """Check a rate limit. This is the hot path — keep it fast.

        Args:
            key: The identifier to rate limit (user ID, IP, etc.)
            policy: Name of the policy to check against.
            cost: How many tokens this request costs (default 1).

        Returns:
            CheckResult with allowed status and remaining quota.

        Raises:
            CerberusError: If the API returns an error.
        """
        response = self._client.post(
            "/check",
            json={"key": key, "policy": policy, "cost": cost},
        )
        self._raise_for_status(response)
        data = response.json()
        return CheckResult(
            allowed=data["allowed"],
            remaining=data["remaining"],
            limit=data["limit"],
            reset=data["reset"],
            retry_after=data.get("retry_after"),
        )

    def create_policy(
        self,
        name: str,
        limit: int,
        window_seconds: int,
        algorithm: Literal["sliding_window", "fixed_window", "token_bucket"] = "sliding_window",
        burst_limit: int | None = None,
    ) -> Policy:
        """Create a new rate limit policy.

        Args:
            name: Unique policy name within your tenant.
            limit: Maximum requests per window.
            window_seconds: Window duration in seconds.
            algorithm: Rate limiting algorithm to use.
            burst_limit: Max burst size (token_bucket only).

        Returns:
            The created Policy.
        """
        payload: dict = {
            "name": name,
            "algorithm": algorithm,
            "limit": limit,
            "window_seconds": window_seconds,
        }
        if burst_limit is not None:
            payload["burst_limit"] = burst_limit

        response = self._client.post("/policies", json=payload)
        self._raise_for_status(response)
        return self._parse_policy(response.json())

    def list_policies(self) -> list[Policy]:
        """List all policies for the authenticated tenant."""
        response = self._client.get("/policies")
        self._raise_for_status(response)
        data = response.json()
        return [self._parse_policy(p) for p in data["items"]]

    def get_policy(self, policy_id: str) -> Policy:
        """Get a specific policy by ID."""
        response = self._client.get(f"/policies/{policy_id}")
        self._raise_for_status(response)
        return self._parse_policy(response.json())

    def delete_policy(self, policy_id: str) -> None:
        """Delete a policy."""
        response = self._client.delete(f"/policies/{policy_id}")
        self._raise_for_status(response)

    def health(self) -> dict:
        """Check the Cerberus service health."""
        response = self._client.get("/health")
        return response.json()

    def close(self) -> None:
        """Close the underlying HTTP client."""
        self._client.close()

    def __enter__(self) -> CerberusClient:
        return self

    def __exit__(self, *args: object) -> None:
        self.close()

    @staticmethod
    def _parse_policy(data: dict) -> Policy:
        return Policy(
            id=data["id"],
            tenant_id=data["tenant_id"],
            name=data["name"],
            algorithm=data["algorithm"],
            limit=data["limit"],
            window_seconds=data["window_seconds"],
            burst_limit=data.get("burst_limit"),
            is_active=data["is_active"],
        )

    @staticmethod
    def _raise_for_status(response: httpx.Response) -> None:
        if response.status_code >= 400:
            try:
                detail = response.json().get("detail", response.text)
            except Exception:
                detail = response.text

            if response.status_code == 429:
                retry_after = float(response.headers.get("Retry-After", 1.0))
                raise RateLimitedError(retry_after=retry_after, detail=str(detail))

            raise CerberusError(response.status_code, str(detail))
