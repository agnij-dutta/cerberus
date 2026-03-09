"""
Integration tests for tenant authentication.

Tests the API key auth flow including hashing, prefix lookup, and
cache behaviour.
"""

from __future__ import annotations

import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.api.middleware.auth import (
    api_key_prefix,
    authenticate_api_key,
    hash_api_key,
    invalidate_tenant_cache,
)
from app.core.exceptions import AuthenticationError


class TestHashApiKey:
    def test_deterministic(self):
        """Same input should always produce the same hash."""
        key = "cerb_abc123"
        assert hash_api_key(key) == hash_api_key(key)

    def test_different_keys_produce_different_hashes(self):
        assert hash_api_key("cerb_aaa") != hash_api_key("cerb_bbb")

    def test_hash_is_hex_string(self):
        h = hash_api_key("cerb_test")
        assert len(h) == 64  # SHA-256 hex digest
        assert all(c in "0123456789abcdef" for c in h)


class TestApiKeyPrefix:
    def test_prefix_extraction(self):
        assert api_key_prefix("cerb_abcdef1234567890") == "cerb_abc"

    def test_short_key(self):
        assert api_key_prefix("cerb_ab") == "cerb_ab"


class TestAuthenticateApiKey:
    @pytest.fixture(autouse=True)
    def _clear_cache(self):
        invalidate_tenant_cache()
        yield
        invalidate_tenant_cache()

    @pytest.mark.asyncio
    async def test_rejects_empty_key(self):
        session = AsyncMock()
        with pytest.raises(AuthenticationError, match="missing or too short"):
            await authenticate_api_key("", session)

    @pytest.mark.asyncio
    async def test_rejects_short_key(self):
        session = AsyncMock()
        with pytest.raises(AuthenticationError, match="missing or too short"):
            await authenticate_api_key("short", session)

    @pytest.mark.asyncio
    async def test_rejects_unknown_key(self):
        """A key that doesn't match any tenant should be rejected."""
        raw_key = "cerb_" + "x" * 48

        # Mock session that returns no matching tenants
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_session = AsyncMock()
        mock_session.execute.return_value = mock_result

        with pytest.raises(AuthenticationError, match="Invalid API key"):
            await authenticate_api_key(raw_key, mock_session)

    @pytest.mark.asyncio
    async def test_accepts_valid_key(self):
        """A key matching a tenant hash should authenticate successfully."""
        raw_key = "cerb_" + "v" * 48
        key_hash = hash_api_key(raw_key)

        tenant = MagicMock()
        tenant.id = uuid.uuid4()
        tenant.api_key_hash = key_hash
        tenant.api_key_prefix = api_key_prefix(raw_key)
        tenant.is_active = True
        tenant.tier = MagicMock(value="pro")

        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [tenant]
        mock_session = AsyncMock()
        mock_session.execute.return_value = mock_result

        result = await authenticate_api_key(raw_key, mock_session)
        assert result.id == tenant.id

    @pytest.mark.asyncio
    async def test_rejects_inactive_tenant(self):
        """An inactive tenant's key should be rejected."""
        raw_key = "cerb_" + "w" * 48
        key_hash = hash_api_key(raw_key)

        tenant = MagicMock()
        tenant.id = uuid.uuid4()
        tenant.api_key_hash = key_hash
        tenant.api_key_prefix = api_key_prefix(raw_key)
        tenant.is_active = False
        tenant.tier = MagicMock(value="free")

        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [tenant]
        mock_session = AsyncMock()
        mock_session.execute.return_value = mock_result

        with pytest.raises(AuthenticationError, match="deactivated"):
            await authenticate_api_key(raw_key, mock_session)
