from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.modules.organization.schemas import (
    OrganizationCreate, OrganizationResponse, BranchCreate, BranchResponse, 
    DepartmentCreate, DepartmentResponse, SettingsUpdate, SettingsResponse, 
    PolicyCreate, PolicyResponse
)
from app.modules.organization.services import OrganizationService
from typing import List

router = APIRouter()

@router.post("/", response_model=OrganizationResponse)
async def create_organization(data: OrganizationCreate, db: AsyncSession = Depends(get_db)):
    return await OrganizationService.create_organization(db, data)

@router.get("/{org_id}", response_model=OrganizationResponse)
async def get_organization(org_id: int, db: AsyncSession = Depends(get_db)):
    return await OrganizationService.get_organization(db, org_id)

@router.post("/{org_id}/branch", response_model=BranchResponse)
async def add_branch(data: BranchCreate, db: AsyncSession = Depends(get_db)):
    return await OrganizationService.add_branch(db, data)

@router.get("/branches/{hospital_id}", response_model=List[BranchResponse])
async def get_branches(hospital_id: int, db: AsyncSession = Depends(get_db)):
    return await OrganizationService.get_branches(db, hospital_id)

@router.post("/{org_id}/department", response_model=DepartmentResponse)
async def add_department(data: DepartmentCreate, db: AsyncSession = Depends(get_db)):
    return await OrganizationService.add_department(db, data)

@router.get("/departments/{hospital_id}", response_model=List[DepartmentResponse])
async def get_departments(hospital_id: int, db: AsyncSession = Depends(get_db)):
    return await OrganizationService.get_departments(db, hospital_id)

@router.get("/{org_id}/settings", response_model=SettingsResponse)
async def get_settings(org_id: int, db: AsyncSession = Depends(get_db)):
    return await OrganizationService.get_settings(db, org_id)

@router.put("/{org_id}/settings", response_model=SettingsResponse)
async def update_settings(org_id: int, data: SettingsUpdate, db: AsyncSession = Depends(get_db)):
    return await OrganizationService.update_settings(db, org_id, data)

@router.post("/{org_id}/policy", response_model=PolicyResponse)
async def create_policy(org_id: int, data: PolicyCreate, db: AsyncSession = Depends(get_db)):
    return await OrganizationService.create_policy(db, org_id, data)

@router.get("/{org_id}/policies", response_model=List[PolicyResponse])
async def get_policies(org_id: int, db: AsyncSession = Depends(get_db)):
    return await OrganizationService.get_policies(db, org_id)
