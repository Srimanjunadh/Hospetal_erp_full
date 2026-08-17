from sqlalchemy.ext.asyncio import AsyncSession
from app.shared.database.models import Asset, AssetMaintenance
from app.modules.asset.repositories import AssetRepository
from app.modules.asset.schemas import (
    AssetCreate, MaintenanceCreate, AssetValuationReport
)
from fastapi import HTTPException
from datetime import datetime, date
from typing import List, Optional

class AssetService:
    @staticmethod
    async def create_asset(db: AsyncSession, data: AssetCreate) -> Asset:
        # Check unique serial number
        from sqlalchemy.future import select
        existing = await db.execute(select(Asset).filter(Asset.serial_number == data.serial_number))
        if existing.scalars().first():
            raise HTTPException(status_code=400, detail="Asset with this serial number already exists")

        asset = Asset(
            hospital_id=data.hospital_id,
            name=data.name,
            category=data.category,
            serial_number=data.serial_number,
            purchase_date=data.purchase_date,
            purchase_cost=data.purchase_cost,
            warranty_expiry=data.warranty_expiry,
            status="ACTIVE"
        )
        await AssetRepository.create_asset(db, asset)
        await AssetRepository.save(db)
        return asset

    @staticmethod
    async def get_assets(db: AsyncSession, hospital_id: Optional[int] = None) -> List[Asset]:
        return await AssetRepository.list_assets(db, hospital_id)

    @staticmethod
    async def schedule_maintenance(db: AsyncSession, data: MaintenanceCreate) -> AssetMaintenance:
        asset = await AssetRepository.get_asset_by_id(db, data.asset_id)
        if not asset:
            raise HTTPException(status_code=404, detail="Asset not found")

        # Set asset status to IN_REPAIR if it is a major repair
        if data.maintenance_type == "EMERGENCY_REPAIR":
            asset.status = "IN_REPAIR"

        ticket = AssetMaintenance(
            asset_id=data.asset_id,
            maintenance_type=data.maintenance_type,
            scheduled_date=data.scheduled_date,
            description=data.description,
            cost=0.0,
            status="PENDING"
        )
        await AssetRepository.create_maintenance_ticket(db, ticket)
        await AssetRepository.save(db)
        return ticket

    @staticmethod
    async def complete_maintenance(db: AsyncSession, ticket_id: int, cost: float) -> AssetMaintenance:
        ticket = await AssetRepository.get_maintenance_ticket_by_id(db, ticket_id)
        if not ticket:
            raise HTTPException(status_code=404, detail="Maintenance ticket not found")
        if ticket.status == "COMPLETED":
            raise HTTPException(status_code=400, detail="Ticket is already completed")

        ticket.completed_date = date.today()
        ticket.cost = cost
        ticket.status = "COMPLETED"

        # Mark parent asset ACTIVE again
        asset = await AssetRepository.get_asset_by_id(db, ticket.asset_id)
        if asset:
            asset.status = "ACTIVE"

        await AssetRepository.save(db)
        return ticket

    @staticmethod
    async def get_valuation(db: AsyncSession, hospital_id: Optional[int] = None) -> AssetValuationReport:
        assets = await AssetRepository.list_assets(db, hospital_id)
        total_cost = sum(a.purchase_cost for a in assets)
        
        breakdown = {
            "MEDICAL_EQUIPMENT": 0.0,
            "COMPUTERS": 0.0,
            "BEDS": 0.0,
            "FURNITURE": 0.0,
            "VEHICLES": 0.0
        }
        for a in assets:
            cat = a.category or "MEDICAL_EQUIPMENT"
            breakdown[cat] = breakdown.get(cat, 0.0) + a.purchase_cost

        return AssetValuationReport(
            total_assets_count=len(assets),
            total_purchase_value=total_cost,
            category_breakdown=breakdown
        )
