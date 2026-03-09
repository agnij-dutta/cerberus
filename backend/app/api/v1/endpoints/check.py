"""
POST /v1/check — the core rate-limit check endpoint.

This is the hot path.  Every effort is made to keep it fast:
  - Policy lookups are cached in-process.
  - Redis operations are atomic Lua scripts (single round-trip).
  - Response construction is minimal.

Typical latency budget:
  ~0.1 ms  Python overhead
  ~0.3 ms  Redis round-trip (same AZ)
  ~0.1 ms  response serialisation
  --------
  ~0.5 ms  total
"""

from fastapi import APIRouter, Response

from app.api.v1.schemas.check import CheckRequest, CheckResponse
from app.dependencies import CurrentTenant, DBSession, Limiter, Redis
from app.utils.time import milliseconds_to_seconds_ceil

router = APIRouter(tags=["rate-limit"])


@router.post(
    "/check",
    response_model=CheckResponse,
    summary="Check rate limit",
    description="Evaluate a rate-limit policy for the given identifier.",
    responses={
        200: {"description": "Request is allowed."},
        429: {"description": "Rate limit exceeded."},
    },
)
async def check_rate_limit(
    body: CheckRequest,
    tenant: CurrentTenant,
    session: DBSession,
    redis: Redis,
    limiter: Limiter,
    response: Response,
) -> CheckResponse:
    """
    Execute a rate-limit check and return the decision.

    The response always includes standard rate-limit headers regardless of
    the outcome.  A 429 status is returned when the limit is exceeded.
    """
    result = await limiter.check(
        redis,
        session,
        tenant_id=tenant.id,
        policy_id=body.policy_id,
        identifier=body.identifier,
    )

    # Fetch limit from the policy for the response headers.
    # The limiter already cached the policy, so this is a local dict lookup.
    policy = await limiter._policy_manager.get(session, body.policy_id)

    # Standard rate-limit headers (draft-ietf-httpapi-ratelimit-headers)
    response.headers["X-RateLimit-Limit"] = str(policy.limit)
    response.headers["X-RateLimit-Remaining"] = str(result.remaining)

    if not result.allowed:
        retry_seconds = milliseconds_to_seconds_ceil(result.retry_after_ms)
        response.headers["Retry-After"] = str(retry_seconds)
        response.headers["X-RateLimit-Reset"] = str(retry_seconds)
        response.status_code = 429
    else:
        response.headers["X-RateLimit-Reset"] = "0"

    return CheckResponse(
        allowed=result.allowed,
        limit=policy.limit,
        remaining=result.remaining,
        retry_after_ms=result.retry_after_ms,
    )
