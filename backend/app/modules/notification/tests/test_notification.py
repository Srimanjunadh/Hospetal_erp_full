import pytest
from unittest.mock import AsyncMock, MagicMock
from app.modules.notification.services import NotificationService
from app.modules.notification.schemas import AlertCreate

@pytest.mark.asyncio
async def test_notification_create_alert():
    db = AsyncMock()
    data = AlertCreate(
        hospital_id=1,
        from_user_id=2,
        to_user_id=3,
        message="Test alert message",
        type="notification"
    )
    
    result = await NotificationService.create_alert(db, data)
    assert result["status"] == "Alert Created"
    assert db.add.called
