"""
Health-check endpoints.

``/healthz`` — Kubernetes liveness probe.  Returns 200 if the process is alive.
``/readyz``  — Kubernetes readiness probe.  Returns 200 only if both the
               database and Redis are reachable.
"""

from __future__ import annotations

from fastapi import APIRouter, Request, Response
from sqlalchemy import text

from app.db.session import get_engine

router = APIRouter(tags=["health"])


@router.get(
    "/healthz",
    summary="Liveness probe",
    status_code=200,
)
async def liveness() -> dict[str, str]:
    """Simple liveness check — if the process can handle HTTP, it's alive."""
    return {"status": "ok"}


@router.get(
    "/readyz",
    summary="Readiness probe",
    status_code=200,
)
async def readiness(request: Request, response: Response) -> dict:
    """
    Deep readiness check.

    Verifies connectivity to PostgreSQL and Redis.  Returns 503 if either
    dependency is unreachable.
    """
    checks: dict[str, str] = {}

    # -- PostgreSQL ---
    try:
        engine = get_engine()
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        checks["postgres"] = "ok"
    except Exception as exc:
        checks["postgres"] = f"error: {exc}"

    # -- Redis ---
    try:
        redis = request.app.state.redis
        await redis.ping()
        checks["redis"] = "ok"
    except Exception as exc:
        checks["redis"] = f"error: {exc}"

    all_ok = all(v == "ok" for v in checks.values())
    if not all_ok:
        response.status_code = 503

    return {
        "status": "ready" if all_ok else "degraded",
        "checks": checks,
    }
