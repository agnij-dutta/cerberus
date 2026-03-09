"""
FastAPI application factory for Cerberus.

The ``create_app`` function builds a fully configured FastAPI instance
with middleware, routers, exception handlers, and lifespan management.
"""

from __future__ import annotations

from contextlib import asynccontextmanager
from typing import Any, AsyncGenerator

import structlog
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from redis.asyncio import ConnectionPool, Redis

from app.api.middleware.logging import setup_logging
from app.api.middleware.metrics import setup_prometheus
from app.api.v1.endpoints.health import router as health_router
from app.api.v1.router import router as v1_router
from app.config import get_settings
from app.core.exceptions import CerberusError
from app.db.session import close_db, init_db

logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Manage application startup and shutdown.

    Initialises the database engine, Redis connection pool, and structured
    logging.  Cleans up all resources on shutdown.
    """
    settings = get_settings()

    # -- Logging ---------------------------------------------------------------
    setup_logging(
        log_level=settings.log_level,
        json_output=settings.is_production,
    )
    logger.info(
        "starting_cerberus",
        environment=settings.environment.value,
        debug=settings.debug,
    )

    # -- Database --------------------------------------------------------------
    init_db()
    logger.info("database_initialised")

    # -- Redis -----------------------------------------------------------------
    pool = ConnectionPool.from_url(
        str(settings.redis_url),
        max_connections=settings.redis_max_connections,
        socket_timeout=settings.redis_socket_timeout,
        socket_connect_timeout=settings.redis_socket_connect_timeout,
        decode_responses=True,
    )
    app.state.redis = Redis(connection_pool=pool)
    logger.info("redis_pool_created", max_connections=settings.redis_max_connections)

    yield

    # -- Shutdown --------------------------------------------------------------
    logger.info("shutting_down")
    await app.state.redis.aclose()
    await pool.aclose()
    await close_db()
    logger.info("shutdown_complete")


def create_app() -> FastAPI:
    """
    Build and return the FastAPI application.

    This is the entry point for both ``uvicorn`` and ``gunicorn``.
    """
    settings = get_settings()

    app = FastAPI(
        title="Cerberus",
        description="Production-grade Rate-Limit-as-a-Service",
        version="1.0.0",
        docs_url="/docs" if not settings.is_production else None,
        redoc_url="/redoc" if not settings.is_production else None,
        lifespan=lifespan,
    )

    # -- Middleware (order matters — outermost first) --------------------------
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # -- Prometheus metrics ----------------------------------------------------
    if settings.metrics_enabled:
        setup_prometheus(app)

    # -- Exception handlers ----------------------------------------------------
    _register_exception_handlers(app)

    # -- Routes ----------------------------------------------------------------
    app.include_router(health_router)  # /healthz, /readyz at root
    app.include_router(v1_router)      # everything else under /v1

    return app


def _register_exception_handlers(app: FastAPI) -> None:
    """Wire up global exception handlers for consistent error responses."""

    @app.exception_handler(CerberusError)
    async def cerberus_error_handler(request: Request, exc: CerberusError) -> JSONResponse:
        """Handle domain exceptions as RFC 7807 Problem Details."""
        return JSONResponse(
            status_code=exc.status_code,
            content=exc.to_problem_detail(),
            media_type="application/problem+json",
        )

    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(
        request: Request,
        exc: RequestValidationError,
    ) -> JSONResponse:
        """Translate Pydantic validation errors into Problem Details format."""
        # Sanitise errors so that non-serialisable objects (e.g. ValueError
        # instances in ``ctx``) don't break JSON encoding.
        sanitised_errors = []
        for err in exc.errors():
            clean = {**err}
            if "ctx" in clean:
                clean["ctx"] = {
                    k: str(v) if not isinstance(v, (str, int, float, bool, type(None))) else v
                    for k, v in clean["ctx"].items()
                }
            sanitised_errors.append(clean)

        return JSONResponse(
            status_code=422,
            content={
                "type": "https://cerberus.io/errors/validation",
                "title": "Validation Error",
                "status": 422,
                "detail": "Request body failed validation.",
                "errors": sanitised_errors,
            },
            media_type="application/problem+json",
        )

    @app.exception_handler(Exception)
    async def unhandled_error_handler(request: Request, exc: Exception) -> JSONResponse:
        """
        Catch-all for unhandled exceptions.

        In production we don't leak stack traces; in dev we include the repr.
        """
        settings = get_settings()
        logger.error("unhandled_exception", error=str(exc), exc_info=True)

        detail = "An unexpected error occurred."
        if settings.debug:
            detail = repr(exc)

        return JSONResponse(
            status_code=500,
            content={
                "type": "https://cerberus.io/errors/internal",
                "title": "Internal Server Error",
                "status": 500,
                "detail": detail,
            },
            media_type="application/problem+json",
        )
