"""
Top-level v1 API router.

Aggregates all endpoint modules under the ``/v1`` prefix.
"""

from __future__ import annotations

from fastapi import APIRouter

from app.api.v1.endpoints import analytics, check, health, policies, tenants

router = APIRouter(prefix="/v1")

router.include_router(check.router)
router.include_router(policies.router)
router.include_router(tenants.router)
router.include_router(analytics.router)

# Health routes live at the root (no /v1 prefix) — they're added separately
# in the main app factory.  We expose them here for convenience if someone
# wants to mount everything under /v1 in tests.
health_router = health.router
