from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.models import Ambulance
from app.schemas.schemas import AmbulanceCreate
from sqlalchemy.future import select
from app.services.ambulance_service import ambulance_service

router = APIRouter()

@router.get("/")
async def get_ambulances(hospital_id: int = None, db: AsyncSession = Depends(get_db)):
    query = select(Ambulance)
    if hospital_id:
        query = query.filter(Ambulance.hospital_id == hospital_id)
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/")
async def add_ambulance(data: AmbulanceCreate, db: AsyncSession = Depends(get_db)):
    query = select(Ambulance).filter(Ambulance.vehicle_number == data.vehicle_number)
    result = await db.execute(query)
    existing = result.scalars().first()
    if existing:
        raise HTTPException(status_code=400, detail="Ambulance with this vehicle number already exists")
    
    new_amb = Ambulance(
        hospital_id=data.hospital_id,
        vehicle_number=data.vehicle_number,
        driver_name=data.driver_name,
        driver_phone=data.driver_phone,
        vehicle_size=data.vehicle_size,
        status=data.status,
        location=data.location
    )
    db.add(new_amb)
    await db.commit()
    await db.refresh(new_amb)
    return new_amb


@router.patch("/{ambulance_id}/status")
async def update_ambulance_status(ambulance_id: int, data: dict, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Ambulance).filter(Ambulance.id == ambulance_id))
    amb = result.scalars().first()
    if amb:
        amb.status = data.get("status", amb.status)
        await db.commit()
        return {"status": "updated"}
    return {"error": "Not found"}

@router.get("/track/{driver_id}")
async def track_ambulance(driver_id: int):
    return await ambulance_service.get_live_location(driver_id)

@router.post("/dispatch")
async def dispatch_ambulance(pickup_lat: float, pickup_lng: float):
    return await ambulance_service.find_nearest_ambulance(pickup_lat, pickup_lng)
