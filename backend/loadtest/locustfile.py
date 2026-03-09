"""
Locust load test for the Cerberus rate-limit check endpoint.

Usage:
    locust -f loadtest/locustfile.py --host=http://localhost:8000

Configuration is done via environment variables:
    CERBERUS_LT_API_KEY   — API key for the test tenant
    CERBERUS_LT_POLICY_ID — UUID of the policy to test against

The test simulates realistic traffic patterns with a mix of different
identifiers (simulating multiple end-users behind the rate limiter).
"""

from __future__ import annotations

import os
import random
import string

from locust import HttpUser, between, task

_API_KEY = os.getenv("CERBERUS_LT_API_KEY", "cerb_test_key_placeholder")
_POLICY_ID = os.getenv("CERBERUS_LT_POLICY_ID", "11111111-2222-3333-4444-555555555555")

# Pre-generate a pool of identifiers to simulate multiple callers
_IDENTIFIERS = [
    f"user-{i}" for i in range(100)
] + [
    f"{''.join(random.choices(string.digits, k=3))}.{''.join(random.choices(string.digits, k=3))}."
    f"{''.join(random.choices(string.digits, k=3))}.{''.join(random.choices(string.digits, k=3))}"
    for _ in range(50)
]


class RateLimitUser(HttpUser):
    """
    Simulates a client making rate-limit checks.

    Wait time is set to mimic a moderately busy API gateway forwarding
    check requests — roughly 10-50 ms between calls per user.
    """

    wait_time = between(0.01, 0.05)

    @task(weight=10)
    def check_rate_limit(self):
        """Hot-path: POST /v1/check with a random identifier."""
        identifier = random.choice(_IDENTIFIERS)

        with self.client.post(
            "/v1/check",
            json={
                "policy_id": _POLICY_ID,
                "identifier": identifier,
            },
            headers={"X-API-Key": _API_KEY},
            catch_response=True,
            name="/v1/check",
        ) as response:
            if response.status_code in (200, 429):
                response.success()
            else:
                response.failure(f"Unexpected status: {response.status_code}")

    @task(weight=1)
    def health_check(self):
        """Low-frequency liveness check to verify the service is up."""
        self.client.get("/healthz", name="/healthz")

    @task(weight=1)
    def readiness_check(self):
        """Low-frequency readiness check."""
        with self.client.get("/readyz", catch_response=True, name="/readyz") as response:
            if response.status_code in (200, 503):
                response.success()
