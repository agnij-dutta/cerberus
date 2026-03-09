"""
Unit tests for the Redis key namespace builder.

These are intentionally simple — the key builder is a pure function with
no side effects, so we just verify the format.
"""

from __future__ import annotations

from app.core.keys import (
    analytics_counter_key,
    analytics_rejected_key,
    policy_cache_key,
    rate_limit_key,
    tenant_cache_key,
)


class TestRateLimitKey:
    def test_basic_format(self):
        key = rate_limit_key("tenant-abc", "policy-123", "192.168.1.1")
        assert key == "rl:t:tenant-abc:p:policy-123:i:192.168.1.1"

    def test_with_uuid_strings(self):
        key = rate_limit_key(
            "550e8400-e29b-41d4-a716-446655440000",
            "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
            "user:42",
        )
        assert key.startswith("rl:t:")
        assert ":p:" in key
        assert key.endswith(":i:user:42")

    def test_special_characters_in_identifier(self):
        """Identifiers might contain colons or slashes — that's fine."""
        key = rate_limit_key("t1", "p1", "GET:/api/v1/users")
        assert "GET:/api/v1/users" in key


class TestPolicyCacheKey:
    def test_format(self):
        assert policy_cache_key("abc-123") == "rl:policy:abc-123"


class TestTenantCacheKey:
    def test_format(self):
        assert tenant_cache_key("cerb_abc") == "rl:tenant:cerb_abc"


class TestAnalyticsKeys:
    def test_counter_key(self):
        key = analytics_counter_key("tenant-1", "2026-03-10")
        assert key == "rl:analytics:tenant-1:2026-03-10"

    def test_rejected_key(self):
        key = analytics_rejected_key("tenant-1", "2026-03-10")
        assert key == "rl:analytics:rejected:tenant-1:2026-03-10"
