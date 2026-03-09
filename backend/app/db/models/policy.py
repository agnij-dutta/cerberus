"""
Rate-limit policy model.

A policy defines the algorithm, window, and limit for a specific use case.
Tenants can have multiple policies (e.g., one for their public API, another
for webhooks, etc.).
"""

from __future__ import annotations

import enum
from typing import Optional
from uuid import UUID

from sqlalchemy import Boolean, Enum, Float, ForeignKey, Index, Integer, String
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKey


class Algorithm(str, enum.Enum):
    SLIDING_WINDOW = "sliding_window"
    TOKEN_BUCKET = "token_bucket"


class Policy(Base, UUIDPrimaryKey, TimestampMixin):
    """
    A rate-limit policy belonging to a tenant.

    For sliding-window policies, ``limit`` is the max requests per ``window_seconds``.
    For token-bucket policies, ``limit`` is the bucket capacity and ``refill_rate``
    is tokens per second.
    """

    __tablename__ = "policies"

    tenant_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    algorithm: Mapped[Algorithm] = mapped_column(
        Enum(Algorithm, name="algorithm_type"),
        nullable=False,
    )
    limit: Mapped[int] = mapped_column(Integer, nullable=False)
    window_seconds: Mapped[int] = mapped_column(Integer, nullable=False, default=60)
    refill_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationship back to tenant
    tenant = relationship("Tenant", back_populates="policies")

    __table_args__ = (
        Index("ix_policies_tenant_active", "tenant_id", "is_active"),
    )

    def __repr__(self) -> str:
        return f"<Policy {self.name} [{self.algorithm.value}] limit={self.limit}>"
