"""
Schemas for the analytics endpoint.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class DailyStats(BaseModel):
    """Usage statistics for a single day."""

    date: str = Field(..., description="ISO date (YYYY-MM-DD).")
    total_checks: int = Field(0, ge=0)
    rejected_checks: int = Field(0, ge=0)
    allowed_checks: int = Field(0, ge=0)

    @property
    def rejection_rate(self) -> float:
        if self.total_checks == 0:
            return 0.0
        return self.rejected_checks / self.total_checks


class AnalyticsResponse(BaseModel):
    """Aggregated analytics for a tenant."""

    tenant_id: str
    days: list[DailyStats]
    total_checks: int = 0
    total_rejected: int = 0
