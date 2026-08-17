import pytest
from unittest.mock import AsyncMock, MagicMock
from app.modules.hr.services import HRService

@pytest.mark.asyncio
async def test_hr_get_schedule():
    db = AsyncMock()
    mock_sched = MagicMock()
    mock_sched.staff_id = 99
    mock_sched.task_name = "Shift A"
    
    mock_res = MagicMock()
    mock_res.scalars.return_value.all.return_value = [mock_sched]
    db.execute.return_value = mock_res
    
    schedules = await HRService.get_staff_schedule(db, 99)
    assert len(schedules) == 1
    assert schedules[0].staff_id == 99
    assert schedules[0].task_name == "Shift A"
