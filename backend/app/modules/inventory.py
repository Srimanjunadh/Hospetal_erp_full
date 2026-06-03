from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.session import get_db
from app.models.models import InventoryItem
from app.schemas.schemas import InventoryItem as InventoryItemSchema
from typing import List

router = APIRouter()

@router.get("/{hospital_id}", response_model=List[InventoryItemSchema])
async def get_hospital_inventory(hospital_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(InventoryItem).filter(InventoryItem.hospital_id == hospital_id))
    return result.scalars().all()

@router.post("/")
async def add_inventory_item(data: dict, db: AsyncSession = Depends(get_db)):
    item = InventoryItem(
        hospital_id=data['hospital_id'],
        name=data['name'],
        category=data['category'],
        quantity=data['quantity'],
        min_threshold=data.get('min_threshold', 10),
        unit_price=data['unit_price'],
        expiry_date=data.get('expiry_date') # Should be datetime
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item

@router.patch("/{item_id}")
async def update_stock(item_id: int, quantity_change: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(InventoryItem).filter(InventoryItem.id == item_id))
    item = result.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    item.quantity += quantity_change
    await db.commit()
    return {"status": "Stock Updated", "new_quantity": item.quantity}
