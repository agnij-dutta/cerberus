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
    retry_after_ms: int


@dataclass(frozen=True)
class Policy:
    """A rate limit policy."""

    id: str
    tenant_id: str
    name: str
    algorithm: str
    limit: int
    window_seconds: int
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

    Usage::

        client = CerberusClient(
            base_url="http://localhost:8000",
            api_key="cerb_your_api_key",
        )

        result = client.check("policy-uuid", "user:42")
        if result.allowed:
            # proceed
        else:
            # back off
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
            base_url=f"{self._base_url}/v1",
            headers={
                "X-API-Key": api_key,
                "Content-Type": "application/json",
            },
            timeout=timeout,
        )

    def check(
        self,
        policy_id: str,
        identifier: str,
        tokens: int = 1,
    ) -> CheckResult:
        """Check a rate limit.

        Args:
            policy_id: UUID of the policy to evaluate against.
            identifier: The key to rate limit (user ID, IP, etc.)
            tokens: Number of tokens to consume (default 1).

        Returns:
            CheckResult with allowed status and remaining quota.

        Raises:
            CerberusError: If the API returns an error.
            RateLimitedError: If the request is rate limited (429).
        """
        response = self._client.post(
            "/check",
            json={"policy_id": policy_id, "identifier": identifier, "tokens": tokens},
        )
        self._raise_for_status(response)
        data = response.json()
        return CheckResult(
            allowed=data["allowed"],
            remaining=data["remaining"],
            limit=data["limit"],
            retry_after_ms=data.get("retry_after_ms", 0),
        )

    def create_policy(
        self,
        name: str,
        limit: int,
        window_seconds: int,
        algorithm: Literal["sliding_window", "token_bucket"] = "sliding_window",
    ) -> Policy:
        """Create a new rate limit policy."""
        payload: dict = {
            "name": name,
            "algorithm": algorithm,
            "limit": limit,
            "window_seconds": window_seconds,
        }
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
