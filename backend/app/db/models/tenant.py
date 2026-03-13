"""
Tenant model.

Each tenant gets one API key.  We store a SHA-256 hash of the full key and
keep the first 8 characters as a prefix for fast lookup (indexed).
"""

from __future__ import annotations

import enum

from sqlalchemy import Boolean, Enum, Index, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKey


class TenantTier(enum.StrEnum):
    FREE = "free"
    PRO = "pro"
    ENTERPRISE = "enterprise"


class Tenant(Base, UUIDPrimaryKey, TimestampMixin):
    """
    A tenant is an organisation or user that consumes the rate-limit service.

    The API key is generated once at creation time and returned in cleartext
    exactly once.  After that, only the hash is stored.
    """

    __tablename__ = "tenants"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str | None] = mapped_column(String(320), nullable=True, unique=True, index=True)
    password_hash: Mapped[str | None] = mapped_column(Text, nullable=True)
    api_key_hash: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    api_key_prefix: Mapped[str] = mapped_column(String(16), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    tier: Mapped[TenantTier] = mapped_column(
        Enum(TenantTier, name="tenant_tier"),
        default=TenantTier.FREE,
        nullable=False,
    )

    # Relationship — a tenant owns many policies
    policies = relationship("Policy", back_populates="tenant", lazy="selectin")

    __table_args__ = (
        Index("ix_tenants_api_key_prefix", "api_key_prefix"),
        UniqueConstraint("email", name="uq_tenants_email"),
    )

    def __repr__(self) -> str:
        return f"<Tenant {self.name} ({self.tier.value})>"
