import pytest
from unittest.mock import AsyncMock, MagicMock
from app.modules.identity.services import IdentityService
from app.modules.identity.schemas import LoginRequest, TokenRefreshRequest
from datetime import datetime, timedelta

@pytest.mark.asyncio
async def test_identity_login_generates_refresh_token():
    db = AsyncMock()
    # Mock user query
    mock_user = MagicMock()
    mock_user.id = 1
    mock_user.username = "patient1"
    mock_user.hashed_password = "mocked_hash"
    mock_user.role = "patient"
    mock_user.hospital_id = 1
    mock_user.is_verified = True
    
    mock_res_user = MagicMock()
    mock_res_user.scalars.return_value.first.return_value = mock_user
    
    # Mock hospital query
    mock_hosp = MagicMock()
    mock_hosp.id = 1
    mock_res_hosp = MagicMock()
    mock_res_hosp.scalars.return_value.first.return_value = mock_hosp
    
    db.execute.side_effect = [mock_res_user, mock_res_hosp]
    
    # Mock password verify
    from unittest.mock import patch
    with patch("app.modules.identity.services.verify_password", return_value=True):
        req = LoginRequest(username="patient1", password="password", role="patient", node_code="NODE-01")
        res = await IdentityService.login(req, db, ip_address="127.0.0.1", user_agent="Pytest")
        
        assert "access_token" in res
        assert "refresh_token" in res
        assert res["user"]["username"] == "patient1"
        assert res["user"]["is_verified"] is True

@pytest.mark.asyncio
async def test_identity_refresh_token_rotation():
    db = AsyncMock()
    # Mock refresh token lookup
    mock_token = MagicMock()
    mock_token.user_id = 1
    mock_token.token = "valid_refresh_token"
    mock_token.revoked_at = None
    mock_token.expires_at = datetime.utcnow() + timedelta(days=5)
    
    mock_res_token = MagicMock()
    mock_res_token.scalars.return_value.first.return_value = mock_token
    
    # Mock user lookup
    mock_user = MagicMock()
    mock_user.id = 1
    mock_user.username = "patient1"
    mock_user.role = "patient"
    mock_user.hospital_id = 1
    mock_user.is_verified = True
    
    mock_res_user = MagicMock()
    mock_res_user.scalars.return_value.first.return_value = mock_user
    
    db.execute.side_effect = [mock_res_token, mock_res_user]
    
    res = await IdentityService.refresh_token(db, "valid_refresh_token", ip_address="127.0.0.1", user_agent="Pytest")
    assert "access_token" in res
    assert "refresh_token" in res
    assert res["refresh_token"] != "valid_refresh_token"
