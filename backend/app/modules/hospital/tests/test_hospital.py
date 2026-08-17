import pytest
from unittest.mock import AsyncMock, MagicMock
from app.modules.hospital.services import HospitalService

@pytest.mark.asyncio
async def test_hospital_get_global_stats():
    db = AsyncMock()
    
    # Mock return values for h_res, u_res, s_res, p_res, rev_res
    mock_h = MagicMock()
    mock_h.scalar.return_value = 5
    
    mock_d = MagicMock()
    mock_d.scalar.return_value = 12
    
    mock_s = MagicMock()
    mock_s.scalar.return_value = 25
    
    mock_p = MagicMock()
    mock_p.scalar.return_value = 100
    
    mock_rev = MagicMock()
    mock_rev.scalar.return_value = 50000.0
    
    db.execute.side_effect = [mock_h, mock_d, mock_s, mock_p, mock_rev]
    
    stats = await HospitalService.get_global_stats(db)
    assert stats["total_hospitals"] == 5
    assert stats["total_doctors"] == 12
    assert stats["total_staff"] == 25
    assert stats["total_patients"] == 100
    assert stats["total_revenue"] == 50000.0
