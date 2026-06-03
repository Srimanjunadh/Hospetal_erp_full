from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.models import InventoryItem
from typing import List

class InventoryService:
    @staticmethod
    async def get_all_inventory(db: AsyncSession, hospital_id: int = None) -> List[dict]:
        """
        Returns all items in the inventory as serializable dicts.
        """
        query = select(InventoryItem)
        if hospital_id:
            query = query.filter(InventoryItem.hospital_id == hospital_id)
        result = await db.execute(query)
        items = result.scalars().all()
        return [
            {
                "id": i.id,
                "name": i.name,
                "category": i.category,
                "quantity": i.quantity,
                "min_threshold": i.min_threshold,
                "unit_price": getattr(i, 'unit_price', 0.0),
                "expiry_date": i.expiry_date.isoformat() if i.expiry_date else None
            } for i in items
        ]

    @staticmethod
    async def get_stock_alerts(db: AsyncSession, hospital_id: int = None) -> List[dict]:
        """
        Returns items below threshold as serializable dicts.
        """
        query = select(InventoryItem).filter(InventoryItem.quantity <= InventoryItem.min_threshold)
        if hospital_id:
            query = query.filter(InventoryItem.hospital_id == hospital_id)
        result = await db.execute(query)
        items = result.scalars().all()
        return [
            {
                "id": i.id,
                "name": i.name,
                "category": i.category,
                "quantity": i.quantity,
                "min_threshold": i.min_threshold,
                "unit_price": getattr(i, 'unit_price', 0.0),
                "expiry_date": i.expiry_date.isoformat() if i.expiry_date else None
            } for i in items
        ]

    @staticmethod
    async def predict_reorder(db: AsyncSession):
        """
        AI-based prediction simulation: Suggests reorder amounts based on usage patterns.
        """
        # In a real app, this would use historical data and a forecasting model
        result = await db.execute(select(InventoryItem))
        items = result.scalars().all()
        
        reorder_suggestions = []
        for item in items:
            if item.quantity < item.min_threshold * 1.5:
                # Suggest reordering enough to reach 3x threshold
                suggested_amount = (item.min_threshold * 3) - item.quantity
                reorder_suggestions.append({
                    "item_id": item.id,
                    "name": item.name,
                    "suggested_amount": max(0, suggested_amount),
                    "reason": "Stock below safety level" if item.quantity < item.min_threshold else "Predictive safety margin"
                })
        return reorder_suggestions

    @staticmethod
    async def add_stock(db: AsyncSession, item_id: int, quantity: int) -> bool:
        """
        Increments the quantity of an existing item.
        """
        result = await db.execute(select(InventoryItem).filter(InventoryItem.id == item_id))
        item = result.scalars().first()
        if item:
            item.quantity += quantity
            await db.commit()
            return True
        return False

    @staticmethod
    async def create_item(db: AsyncSession, hospital_id: int, name: str, category: str, quantity: int, min_threshold: int) -> InventoryItem:
        """
        Creates a new inventory item.
        """
        new_item = InventoryItem(
            hospital_id=hospital_id,
            name=name,
            category=category,
            quantity=quantity,
            min_threshold=min_threshold
        )
        db.add(new_item)
        await db.commit()
        await db.refresh(new_item)
        return new_item

    @staticmethod
    async def update_item(db: AsyncSession, item_id: int, data: dict) -> bool:
        """
        Updates an existing inventory item.
        """
        result = await db.execute(select(InventoryItem).filter(InventoryItem.id == item_id))
        item = result.scalars().first()
        if item:
            for key, value in data.items():
                if hasattr(item, key):
                    setattr(item, key, value)
            await db.commit()
            return True
        return False

    @staticmethod
    async def delete_item(db: AsyncSession, item_id: int) -> bool:
        """
        Removes an inventory item.
        """
        result = await db.execute(select(InventoryItem).filter(InventoryItem.id == item_id))
        item = result.scalars().first()
        if item:
            await db.delete(item)
            await db.commit()
            return True
        return False

inventory_service = InventoryService()
