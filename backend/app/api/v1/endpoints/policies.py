"""
CRUD endpoints for rate-limit policies.

Tenants can create, read, update, and soft-delete their own policies.
Cross-tenant access is blocked at the service layer.
"""

from uuid import UUID

from fastapi import APIRouter, Query

from app.api.v1.schemas.policy import (
    PolicyCreate,
    PolicyListResponse,
    PolicyResponse,
    PolicyUpdate,
)
from app.db.models.policy import Algorithm, Policy
from app.dependencies import CurrentTenant, DBSession, PolicyMgr

router = APIRouter(prefix="/policies", tags=["policies"])


@router.get(
    "",
    response_model=PolicyListResponse,
    summary="List policies",
)
async def list_policies(
    tenant: CurrentTenant,
    session: DBSession,
    policy_mgr: PolicyMgr,
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
) -> PolicyListResponse:
    """Return all active policies for the authenticated tenant."""
    policies = await policy_mgr.list_for_tenant(
        session,
        tenant.id,
        offset=offset,
        limit=limit,
    )
    return PolicyListResponse(
        items=[PolicyResponse.model_validate(p) for p in policies],
        total=len(policies),  # TODO: add a proper COUNT query for accurate pagination
        offset=offset,
        limit=limit,
    )


@router.post(
    "",
    response_model=PolicyResponse,
    status_code=201,
    summary="Create policy",
)
async def create_policy(
    body: PolicyCreate,
    tenant: CurrentTenant,
    session: DBSession,
    policy_mgr: PolicyMgr,
) -> PolicyResponse:
    """Create a new rate-limit policy for the authenticated tenant."""
    policy = Policy(
        tenant_id=tenant.id,
        name=body.name,
        algorithm=Algorithm(body.algorithm.value),
        limit=body.limit,
        window_seconds=body.window_seconds,
        refill_rate=body.refill_rate,
    )
    created = await policy_mgr.create(session, policy)
    return PolicyResponse.model_validate(created)


@router.get(
    "/{policy_id}",
    response_model=PolicyResponse,
    summary="Get policy",
)
async def get_policy(
    policy_id: UUID,
    tenant: CurrentTenant,
    session: DBSession,
    policy_mgr: PolicyMgr,
) -> PolicyResponse:
    """Fetch a single policy by ID."""
    policy = await policy_mgr.get(session, policy_id)
    # Ownership check
    if policy.tenant_id != tenant.id:
        from app.core.exceptions import AuthorisationError

        raise AuthorisationError()
    return PolicyResponse.model_validate(policy)


@router.put(
    "/{policy_id}",
    response_model=PolicyResponse,
    summary="Update policy",
)
async def update_policy(
    policy_id: UUID,
    body: PolicyUpdate,
    tenant: CurrentTenant,
    session: DBSession,
    policy_mgr: PolicyMgr,
) -> PolicyResponse:
    """Update fields on an existing policy."""
    updated = await policy_mgr.update(
        session,
        policy_id,
        tenant.id,
        **body.model_dump(exclude_unset=True),
    )
    return PolicyResponse.model_validate(updated)


@router.delete(
    "/{policy_id}",
    status_code=204,
    summary="Delete policy",
)
async def delete_policy(
    policy_id: UUID,
    tenant: CurrentTenant,
    session: DBSession,
    policy_mgr: PolicyMgr,
) -> None:
    """Soft-delete a policy (marks it inactive)."""
    await policy_mgr.soft_delete(session, policy_id, tenant.id)
