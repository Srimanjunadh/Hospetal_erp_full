from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.shared.database.models import (
    Organization, Branch, Department, OrganizationSetting, OrganizationPolicy, Hospital
)
from typing import List, Optional

class OrganizationRepository:
    @staticmethod
    async def create_organization(db: AsyncSession, org: Organization) -> Organization:
        db.add(org)
        await db.flush()
        return org

    @staticmethod
    async def get_organization_by_id(db: AsyncSession, org_id: int) -> Optional[Organization]:
        result = await db.execute(select(Organization).filter(Organization.id == org_id))
        return result.scalars().first()

    @staticmethod
    async def create_branch(db: AsyncSession, branch: Branch) -> Branch:
        db.add(branch)
        await db.flush()
        return branch

    @staticmethod
    async def get_branches_by_hospital(db: AsyncSession, hospital_id: int) -> List[Branch]:
        result = await db.execute(select(Branch).filter(Branch.hospital_id == hospital_id))
        return result.scalars().all()

    @staticmethod
    async def create_department(db: AsyncSession, dept: Department) -> Department:
        db.add(dept)
        await db.flush()
        return dept

    @staticmethod
    async def get_departments_by_hospital(db: AsyncSession, hospital_id: int) -> List[Department]:
        result = await db.execute(select(Department).filter(Department.hospital_id == hospital_id))
        return result.scalars().all()

    @staticmethod
    async def create_settings(db: AsyncSession, settings: OrganizationSetting) -> OrganizationSetting:
        db.add(settings)
        await db.flush()
        return settings

    @staticmethod
    async def get_settings_by_org(db: AsyncSession, org_id: int) -> Optional[OrganizationSetting]:
        result = await db.execute(select(OrganizationSetting).filter(OrganizationSetting.organization_id == org_id))
        return result.scalars().first()

    @staticmethod
    async def create_policy(db: AsyncSession, policy: OrganizationPolicy) -> OrganizationPolicy:
        db.add(policy)
        await db.flush()
        return policy

    @staticmethod
    async def get_policies_by_org(db: AsyncSession, org_id: int) -> List[OrganizationPolicy]:
        result = await db.execute(select(OrganizationPolicy).filter(OrganizationPolicy.organization_id == org_id))
        return result.scalars().all()

    @staticmethod
    async def get_hospital_by_id(db: AsyncSession, hospital_id: int) -> Optional[Hospital]:
        result = await db.execute(select(Hospital).filter(Hospital.id == hospital_id))
        return result.scalars().first()

    @staticmethod
    async def commit(db: AsyncSession) -> None:
        await db.commit()
