"""Tests for the auth service and endpoints."""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.services.auth import AuthService, AuthError


class TestAuthService:
    """Unit tests for AuthService."""

    @pytest.mark.asyncio
    async def test_authenticate_user_not_found(self):
        db = AsyncMock()
        result = MagicMock()
        result.scalar_one_or_none.return_value = None
        db.execute.return_value = result

        service = AuthService(db)
        with pytest.raises(AuthError, match="Invalid username or password"):
            await service.authenticate("nonexistent", "password")

    @pytest.mark.asyncio
    async def test_authenticate_wrong_password(self):
        mock_user = MagicMock()
        mock_user.hashed_password = "hashed_value"
        mock_user.is_active = True

        db = AsyncMock()
        result = MagicMock()
        result.scalar_one_or_none.return_value = mock_user
        db.execute.return_value = result

        with patch("app.services.auth.verify_password", return_value=False):
            service = AuthService(db)
            with pytest.raises(AuthError, match="Invalid username or password"):
                await service.authenticate("testuser", "wrongpassword")

    @pytest.mark.asyncio
    async def test_authenticate_disabled_account(self):
        mock_user = MagicMock()
        mock_user.hashed_password = "hashed_value"
        mock_user.is_active = False

        db = AsyncMock()
        result = MagicMock()
        result.scalar_one_or_none.return_value = mock_user
        db.execute.return_value = result

        with patch("app.services.auth.verify_password", return_value=True):
            service = AuthService(db)
            with pytest.raises(AuthError, match="Account is disabled"):
                await service.authenticate("disableduser", "password")


class TestAuthEndpoints:
    """Integration tests for auth endpoints (requires running DB)."""

    # These tests need a running PostgreSQL database
    # Run with: DATABASE_URL=... pytest -x tests/test_auth.py

    @pytest.mark.skip(reason="Requires running test database")
    @pytest.mark.asyncio
    async def test_login_success(self, async_client):
        response = await async_client.post(
            "/api/auth/login",
            json={"username": "admin", "password": "admin123"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
