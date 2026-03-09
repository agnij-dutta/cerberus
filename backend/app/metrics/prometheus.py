"""
Custom Prometheus metrics for Cerberus.

We define domain-specific counters and histograms here rather than relying
solely on the generic HTTP metrics from ``prometheus-fastapi-instrumentator``.
These give us visibility into rate-limit decisions, Redis health, and
policy cache effectiveness.
"""

from __future__ import annotations

from prometheus_client import Counter, Gauge, Histogram

# ---------------------------------------------------------------------------
# Rate-limit check metrics
# ---------------------------------------------------------------------------

CHECKS_ALLOWED = Counter(
    "cerberus_checks_allowed_total",
    "Total number of rate-limit checks that were allowed.",
)

CHECKS_REJECTED = Counter(
    "cerberus_checks_rejected_total",
    "Total number of rate-limit checks that were rejected (429).",
)

CHECK_DURATION = Histogram(
    "cerberus_check_duration_seconds",
    "Time spent executing a rate-limit check (including Redis round-trip).",
    buckets=(0.0005, 0.001, 0.0025, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5),
)

# ---------------------------------------------------------------------------
# Redis metrics
# ---------------------------------------------------------------------------

REDIS_ERRORS = Counter(
    "cerberus_redis_errors_total",
    "Total number of Redis errors encountered during checks.",
)

REDIS_LATENCY = Histogram(
    "cerberus_redis_latency_seconds",
    "Latency of Redis operations.",
    buckets=(0.0001, 0.0005, 0.001, 0.005, 0.01, 0.05, 0.1),
)

# ---------------------------------------------------------------------------
# Policy cache metrics
# ---------------------------------------------------------------------------

CACHE_HITS = Counter(
    "cerberus_policy_cache_hits_total",
    "Number of policy lookups served from the in-process cache.",
)

CACHE_MISSES = Counter(
    "cerberus_policy_cache_misses_total",
    "Number of policy lookups that required a database query.",
)

# ---------------------------------------------------------------------------
# Operational gauges
# ---------------------------------------------------------------------------

ACTIVE_TENANTS = Gauge(
    "cerberus_active_tenants",
    "Current number of active tenants.",
)

ACTIVE_POLICIES = Gauge(
    "cerberus_active_policies",
    "Current number of active rate-limit policies.",
)
