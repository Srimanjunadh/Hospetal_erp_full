import pytest
from app.modules.reporting.services import ReportingService
from app.modules.reporting.schemas import ReportRequest
from unittest.mock import AsyncMock

@pytest.mark.asyncio
async def test_reporting_generate_report():
    db = AsyncMock()
    req = ReportRequest(report_type="inventory")
    res = await ReportingService.generate_report(db, req)
    assert res.status == "completed"
    assert "inventory" in res.download_url
