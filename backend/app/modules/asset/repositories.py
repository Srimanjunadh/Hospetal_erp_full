from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.shared.database.models import Asset, AssetMaintenance
from typing import List, Optional

class AssetRepository:
    @staticmethod
    async def create_asset(db: AsyncSession, asset: Asset) -> Asset:
        db.add(asset)
        await db.flush()
        return asset

    @staticmethod
    async def get_asset_by_id(db: AsyncSession, asset_id: int) -> Optional[Asset]:
        result = await db.execute(select(Asset).filter(Asset.id == asset_id))
        return result.scalars().first()

    @staticmethod
    async def list_assets(db: AsyncSession, hospital_id: Optional[int] = None) -> List[Asset]:
        query = select(Asset)
        if hospital_id:
            query = query.filter(Asset.hospital_id == hospital_id)
        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def create_maintenance_ticket(db: AsyncSession, ticket: AssetMaintenance) -> AssetMaintenance:
        db.add(ticket)
        await db.flush()
        return ticket

    @staticmethod
    async def get_maintenance_ticket_by_id(db: AsyncSession, ticket_id: int) -> Optional[AssetMaintenance]:
        result = await db.execute(select(AssetMaintenance).filter(AssetMaintenance.id == ticket_id))
        return result.scalars().first()

    @staticmethod
    async def get_maintenance_history(db: AsyncSession, asset_id: int) -> List[AssetMaintenance]:
        result = await db.execute(select(AssetMaintenance).filter(AssetMaintenance.asset_id == asset_id))
        return result.scalars().all()

    @staticmethod
    async def save(db: AsyncSession) -> None:
        await db.commit()
