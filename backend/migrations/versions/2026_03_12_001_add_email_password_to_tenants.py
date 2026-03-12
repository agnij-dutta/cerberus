"""Add email and password_hash columns to tenants table.

Revision ID: 001
Revises: None
Create Date: 2026-03-12
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision: str = "001"
down_revision: str | None = None
branch_labels: tuple[str, ...] | None = None
depends_on: str | None = None


def upgrade() -> None:
    # Add email column (nullable, unique, indexed)
    op.add_column(
        "tenants",
        sa.Column("email", sa.String(320), nullable=True),
    )
    op.create_index("ix_tenants_email", "tenants", ["email"], unique=True)
    op.create_unique_constraint("uq_tenants_email", "tenants", ["email"])

    # Add password_hash column (nullable)
    op.add_column(
        "tenants",
        sa.Column("password_hash", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("tenants", "password_hash")
    op.drop_constraint("uq_tenants_email", "tenants", type_="unique")
    op.drop_index("ix_tenants_email", table_name="tenants")
    op.drop_column("tenants", "email")
