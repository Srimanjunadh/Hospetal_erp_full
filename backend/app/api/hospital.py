from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.services.inventory_service import inventory_service
from app.models.models import WardBed, Hospital
from sqlalchemy.future import select

router = APIRouter()

@router.get("/inventory")
async def get_inventory(hospital_id: int = None, db: AsyncSession = Depends(get_db)):
    return await inventory_service.get_all_inventory(db, hospital_id)

@router.get("/inventory/alerts")
async def get_inventory_alerts(hospital_id: int = None, db: AsyncSession = Depends(get_db)):
    return await inventory_service.get_stock_alerts(db, hospital_id)

@router.get("/inventory/predictive")
async def predict_reorder(db: AsyncSession = Depends(get_db)):
    return await inventory_service.predict_reorder(db)

@router.post("/inventory/add")
async def add_stock(data: dict, db: AsyncSession = Depends(get_db)):
    success = await inventory_service.add_stock(db, data['item_id'], data['quantity'])
    if not success:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Item not found")
    return {"status": "Stock added"}

@router.post("/inventory/new")
async def create_item(data: dict, db: AsyncSession = Depends(get_db)):
    item = await inventory_service.create_item(db, data['hospital_id'], data['name'], data['category'], data['quantity'], data['min_threshold'])
    return {"status": "Item created", "id": item.id}

@router.put("/inventory/update/{item_id}")
async def update_item(item_id: int, data: dict, db: AsyncSession = Depends(get_db)):
    success = await inventory_service.update_item(db, item_id, data)
    if not success:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Item not found")
    return {"status": "Item updated"}

@router.delete("/inventory/delete/{item_id}")
async def delete_item(item_id: int, db: AsyncSession = Depends(get_db)):
    success = await inventory_service.delete_item(db, item_id)
    if not success:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Item not found")
    return {"status": "Item deleted"}

@router.get("/beds")
async def get_beds(hospital_id: int = None, db: AsyncSession = Depends(get_db)):
    query = select(WardBed)
    if hospital_id:
        query = query.filter(WardBed.hospital_id == hospital_id)
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/beds/add")
async def add_bed(data: dict, db: AsyncSession = Depends(get_db)):
    new_bed = WardBed(
        hospital_id=data['hospital_id'],
        floor=str(data['floor']),
        room_number=data['room_number'],
        bed_number=data['bed_number'],
        status="available"
    )
    db.add(new_bed)
    await db.commit()
    await db.refresh(new_bed)
    return {"status": "Bed added", "id": new_bed.id}

@router.patch("/beds/{bed_id}/status")
async def update_bed_status(bed_id: int, data: dict, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WardBed).filter(WardBed.id == bed_id))
    bed = result.scalars().first()
    if bed:
        bed.status = data.get("status", bed.status)
        await db.commit()
        return {"status": "updated"}
    return {"error": "Not found"}
