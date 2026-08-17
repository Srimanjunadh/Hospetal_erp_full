import pytest
from unittest.mock import AsyncMock, MagicMock
from app.modules.organization.services import OrganizationService
from app.modules.organization.schemas import OrganizationCreate

@pytest.mark.asyncio
async def test_organization_creation_provisions_settings():
    db = AsyncMock()
    data = OrganizationCreate(name="St. Jude Healthcare")
    
    org = await OrganizationService.create_organization(db, data)
    assert org.name == "St. Jude Healthcare"
    assert db.add.called
