import pytest
from unittest.mock import AsyncMock, MagicMock
from app.modules.identity.services import IdentityService
from app.modules.identity.schemas import LoginRequest

@pytest.mark.asyncio
async def test_identity_login_master():
    # Test master login override
    req = LoginRequest(username="Manju", password="1122")
    db = AsyncMock()
    
    # Mock UserRepository response returning None
    mock_result = MagicMock()
    mock_result.scalars = MagicMock()
    mock_result.scalars.return_value.first.return_value = None
    db.execute.return_value = mock_result
    
    result = await IdentityService.login(req, db)
    assert "access_token" in result
    assert result["user"]["username"] == "Manju"
    assert result["user"]["role"] == "super_admin"
