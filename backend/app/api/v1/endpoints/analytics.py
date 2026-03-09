"""
Analytics endpoint — returns daily usage statistics for a tenant.

Data is pulled from Redis counters that are incremented on every check.
This is intentionally approximate — we trade strict accuracy for zero
impact on the hot path.
"""

from __future__ import annotations

from datetime import date, timedelta

from fastapi import APIRouter, Query

from app.api.v1.schemas.analytics import AnalyticsResponse, DailyStats
from app.core.keys import analytics_counter_key, analytics_rejected_key
from app.dependencies import CurrentTenant, Redis

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get(
    "",
    response_model=AnalyticsResponse,
    summary="Usage analytics",
)
async def get_analytics(
    tenant: CurrentTenant,
    redis: Redis,
    days: int = Query(7, ge=1, le=30, description="Number of days to look back."),
) -> AnalyticsResponse:
    """
    Return daily check/rejection counts for the authenticated tenant.

    Data is stored in Redis with a 7-day TTL, so requesting more than 7 days
    may return partial results.
    """
    tenant_id = str(tenant.id)
    today = date.today()
    daily_stats: list[DailyStats] = []
    grand_total = 0
    grand_rejected = 0

    # Batch the Redis lookups into a pipeline for efficiency
    pipe = redis.pipeline(transaction=False)
    date_keys: list[str] = []

    for offset in range(days):
        d = today - timedelta(days=offset)
        date_str = d.isoformat()
        date_keys.append(date_str)
        pipe.get(analytics_counter_key(tenant_id, date_str))
        pipe.get(analytics_rejected_key(tenant_id, date_str))

    results = await pipe.execute()

    # Results come back as pairs: [total_0, rejected_0, total_1, rejected_1, ...]
    for i, date_str in enumerate(date_keys):
        raw_total = results[i * 2]
        raw_rejected = results[i * 2 + 1]

        total_checks = int(raw_total) if raw_total else 0
        rejected_checks = int(raw_rejected) if raw_rejected else 0
        allowed_checks = total_checks - rejected_checks

        daily_stats.append(
            DailyStats(
                date=date_str,
                total_checks=total_checks,
                rejected_checks=rejected_checks,
                allowed_checks=allowed_checks,
            )
        )

        grand_total += total_checks
        grand_rejected += rejected_checks

    return AnalyticsResponse(
        tenant_id=tenant_id,
        days=daily_stats,
        total_checks=grand_total,
        total_rejected=grand_rejected,
    )
