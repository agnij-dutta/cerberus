"""
Redis key namespace builder.

Centralises all key construction so we never have format-string key building
scattered across the codebase.  Every key is prefixed with ``rl:`` to make
it trivial to identify Cerberus keys in a shared Redis instance.
"""

from __future__ import annotations

_PREFIX = "rl"


def rate_limit_key(tenant_id: str, policy_id: str, identifier: str) -> str:
    """
    Build the key used to track rate-limit state for a specific caller.

    Parameters
    ----------
    tenant_id:
        UUID of the tenant that owns the policy.
    policy_id:
        UUID of the rate-limit policy.
    identifier:
        The caller-supplied identifier (IP address, user ID, etc.).

    Returns
    -------
    str
        A colon-separated key like ``rl:t:<tenant>:p:<policy>:i:<identifier>``.
    """
    return f"{_PREFIX}:t:{tenant_id}:p:{policy_id}:i:{identifier}"


def policy_cache_key(policy_id: str) -> str:
    """Key for the cached policy object."""
    return f"{_PREFIX}:policy:{policy_id}"


def tenant_cache_key(api_key_prefix: str) -> str:
    """Key for tenant lookup by API key prefix."""
    return f"{_PREFIX}:tenant:{api_key_prefix}"


def analytics_counter_key(tenant_id: str, date_str: str) -> str:
    """
    Daily analytics counter for a tenant.

    Parameters
    ----------
    tenant_id:
        UUID of the tenant.
    date_str:
        ISO date string (``YYYY-MM-DD``).
    """
    return f"{_PREFIX}:analytics:{tenant_id}:{date_str}"


def analytics_rejected_key(tenant_id: str, date_str: str) -> str:
    """Daily counter for rejected (rate-limited) requests."""
    return f"{_PREFIX}:analytics:rejected:{tenant_id}:{date_str}"
