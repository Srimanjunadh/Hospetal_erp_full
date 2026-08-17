from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
from app.shared.database.models import (
    Organization, Branch, Department, OrganizationSetting, OrganizationPolicy
)
from app.modules.organization.repositories import OrganizationRepository
from app.modules.organization.schemas import (
    OrganizationCreate, BranchCreate, DepartmentCreate, SettingsUpdate, PolicyCreate
)
from typing import List, Optional

class OrganizationService:
    @staticmethod
    async def create_organization(db: AsyncSession, data: OrganizationCreate) -> Organization:
        org = Organization(name=data.name)
        await OrganizationRepository.create_organization(db, org)
        
        # Provision default settings
        settings = OrganizationSetting(
            organization_id=org.id,
            theme_color="#5f6fff",
            logo_url=None,
            default_language="en"
        )
        await OrganizationRepository.create_settings(db, settings)
        await OrganizationRepository.commit(db)
        return org

    @staticmethod
    async def get_organization(db: AsyncSession, org_id: int) -> Organization:
        org = await OrganizationRepository.get_organization_by_id(db, org_id)
        if not org:
            raise HTTPException(status_code=404, detail="Organization not found")
        return org

    @staticmethod
    async def add_branch(db: AsyncSession, data: BranchCreate) -> Branch:
        hospital = await OrganizationRepository.get_hospital_by_id(db, data.hospital_id)
        if not hospital:
            raise HTTPException(status_code=404, detail="Hospital node not found")
            
        branch = Branch(
            hospital_id=data.hospital_id,
            name=data.name,
            location=data.location
        )
        await OrganizationRepository.create_branch(db, branch)
        await OrganizationRepository.commit(db)
        return branch

    @staticmethod
    async def get_branches(db: AsyncSession, hospital_id: int) -> List[Branch]:
        return await OrganizationRepository.get_branches_by_hospital(db, hospital_id)

    @staticmethod
    async def add_department(db: AsyncSession, data: DepartmentCreate) -> Department:
        hospital = await OrganizationRepository.get_hospital_by_id(db, data.hospital_id)
        if not hospital:
            raise HTTPException(status_code=404, detail="Hospital node not found")
            
        dept = Department(
            hospital_id=data.hospital_id,
            branch_id=data.branch_id,
            name=data.name
        )
        await OrganizationRepository.create_department(db, dept)
        await OrganizationRepository.commit(db)
        return dept

    @staticmethod
    async def get_departments(db: AsyncSession, hospital_id: int) -> List[Department]:
        return await OrganizationRepository.get_departments_by_hospital(db, hospital_id)

    @staticmethod
    async def get_settings(db: AsyncSession, org_id: int) -> OrganizationSetting:
        settings = await OrganizationRepository.get_settings_by_org(db, org_id)
        if not settings:
            raise HTTPException(status_code=404, detail="Settings not found for organization")
        return settings

    @staticmethod
    async def update_settings(db: AsyncSession, org_id: int, data: SettingsUpdate) -> OrganizationSetting:
        settings = await OrganizationRepository.get_settings_by_org(db, org_id)
        if not settings:
            raise HTTPException(status_code=404, detail="Settings not found")
            
        update_data = data.dict(exclude_unset=True)
        for key, value in update_data.items():
            if hasattr(settings, key):
                setattr(settings, key, value)
                
        await OrganizationRepository.commit(db)
        return settings

    @staticmethod
    async def create_policy(db: AsyncSession, org_id: int, data: PolicyCreate) -> OrganizationPolicy:
        org = await OrganizationRepository.get_organization_by_id(db, org_id)
        if not org:
            raise HTTPException(status_code=404, detail="Organization not found")
            
        policy = OrganizationPolicy(
            organization_id=org_id,
            title=data.title,
            content=data.content
        )
        await OrganizationRepository.create_policy(db, policy)
        await OrganizationRepository.commit(db)
        return policy

    @staticmethod
    async def get_policies(db: AsyncSession, org_id: int) -> List[OrganizationPolicy]:
        return await OrganizationRepository.get_policies_by_org(db, org_id)
