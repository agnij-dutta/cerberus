"""
Prometheus middleware setup.

Uses ``prometheus-fastapi-instrumentator`` for automatic HTTP metrics
(request count, latency histograms, in-flight gauge) plus our custom
domain metrics defined in ``app.metrics.prometheus``.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from prometheus_fastapi_instrumentator import Instrumentator

if TYPE_CHECKING:
    from fastapi import FastAPI


def setup_prometheus(app: FastAPI) -> None:
    """
    Attach Prometheus instrumentation to the FastAPI application.

    The ``/metrics`` endpoint is exposed automatically.
    """
    instrumentator = Instrumentator(
        should_group_status_codes=True,
        should_ignore_untemplated=True,
        should_respect_env_var=False,
        excluded_handlers=["/healthz", "/readyz", "/metrics"],
        env_var_name="CERBERUS_METRICS_ENABLED",
        inprogress_name="cerberus_http_requests_inprogress",
        inprogress_labels=True,
    )

    instrumentator.instrument(app).expose(
        app,
        endpoint="/metrics",
        include_in_schema=False,
        should_gzip=True,
    )
