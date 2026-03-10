"""
Application configuration via environment variables.

All settings are prefixed with ``CERBERUS_`` so they don't collide with
other services in the same pod / compose stack.
"""

from __future__ import annotations

from enum import StrEnum
from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Environment(StrEnum):
    """Deployment environment."""

    DEV = "dev"
    STAGING = "staging"
    PRODUCTION = "production"


class Settings(BaseSettings):
    """
    Root settings object.

    Reads from environment variables with the ``CERBERUS_`` prefix.
    For example ``CERBERUS_REDIS_URL`` maps to ``redis_url``.
    """

    model_config = SettingsConfigDict(
        env_prefix="CERBERUS_",
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # -- General ---------------------------------------------------------------
    environment: Environment = Environment.DEV
    debug: bool = False
    service_name: str = "cerberus"
    log_level: str = "INFO"

    # -- HTTP ------------------------------------------------------------------
    host: str = "0.0.0.0"
    port: int = 8000
    allowed_origins: list[str] = Field(default_factory=lambda: ["*"])

    # -- Redis -----------------------------------------------------------------
    redis_url: str = "redis://localhost:6379/0"
    redis_max_connections: int = 50
    redis_socket_timeout: float = 1.0  # seconds
    redis_socket_connect_timeout: float = 1.0

    # -- PostgreSQL ------------------------------------------------------------
    database_url: str = "postgresql+asyncpg://cerberus:cerberus@localhost:5432/cerberus"
    db_pool_size: int = 10
    db_max_overflow: int = 20
    db_pool_recycle: int = 300  # seconds

    # -- Auth ------------------------------------------------------------------
    admin_api_key: str | None = None  # bootstrap key for tenant management
    api_key_cache_size: int = 1024
    api_key_cache_ttl: int = 300  # seconds

    # -- JWT -------------------------------------------------------------------
    jwt_secret_key: str = "CHANGE-ME-in-production"  # noqa: S105
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440  # 24 hours

    # -- Rate-limit defaults ---------------------------------------------------
    default_window_seconds: int = 60
    default_limit: int = 100

    # -- Metrics ---------------------------------------------------------------
    metrics_enabled: bool = True

    @property
    def is_production(self) -> bool:
        return self.environment == Environment.PRODUCTION


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """
    Return a cached singleton of the application settings.

    Using ``lru_cache`` means we parse the environment exactly once,
    which is fine because settings don't change at runtime.
    """
    return Settings()
