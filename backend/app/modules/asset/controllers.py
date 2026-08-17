from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.modules.asset.schemas import (
    AssetCreate, AssetResponse, MaintenanceCreate, MaintenanceResponse, AssetValuationReport
)
from app.modules.asset.services import AssetService
from typing import Optional, List

router = APIRouter()

@router.post("/", response_model=AssetResponse)
async def create_asset(data: AssetCreate, db: AsyncSession = Depends(get_db)):
    return await AssetService.create_asset(db, data)

@router.get("/list", response_model=List[AssetResponse])
async def list_assets(hospital_id: Optional[int] = Query(None), db: AsyncSession = Depends(get_db)):
    return await AssetService.get_assets(db, hospital_id)

@router.post("/maintenance", response_model=MaintenanceResponse)
async def schedule_maintenance(data: MaintenanceCreate, db: AsyncSession = Depends(get_db)):
    return await AssetService.schedule_maintenance(db, data)

@router.patch("/maintenance/{ticket_id}/complete", response_model=MaintenanceResponse)
async def complete_maintenance(ticket_id: int, cost: float = Query(0.0), db: AsyncSession = Depends(get_db)):
    return await AssetService.complete_maintenance(db, ticket_id, cost)

@router.get("/reports/valuation", response_model=AssetValuationReport)
async def get_valuation_report(hospital_id: Optional[int] = Query(None), db: AsyncSession = Depends(get_db)):
    return await AssetService.get_valuation(db, hospital_id)
