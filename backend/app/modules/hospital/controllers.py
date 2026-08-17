from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.modules.hospital.schemas import (
    BedCreate, HospitalRegister, HospitalConfigUpdate, RoomCreate, RoomResponse,
    OTCreate, OTResponse, FacilityCreate, FacilityResponse
)
from app.modules.hospital.services import HospitalService
from typing import Optional, List

router = APIRouter()

@router.get("/")
async def list_hospitals(db: AsyncSession = Depends(get_db)):
    return await HospitalService.list_hospitals_with_counts(db)

@router.post("/register")
async def register_hospital(data: HospitalRegister, db: AsyncSession = Depends(get_db)):
    return await HospitalService.register_hospital(db, data)

@router.put("/{hospital_id}/config")
async def update_config(hospital_id: int, data: HospitalConfigUpdate, db: AsyncSession = Depends(get_db)):
    return await HospitalService.update_config(db, hospital_id, data)

@router.get("/global/stats")
async def get_global_stats(db: AsyncSession = Depends(get_db)):
    return await HospitalService.get_global_stats(db)

@router.get("/beds")
async def get_beds(hospital_id: Optional[int] = None, db: AsyncSession = Depends(get_db)):
    return await HospitalService.get_beds(db, hospital_id)

@router.post("/beds/add")
async def add_bed(data: BedCreate, db: AsyncSession = Depends(get_db)):
    return await HospitalService.add_bed(db, data)

@router.patch("/beds/{bed_id}/status")
async def update_bed_status(bed_id: int, data: dict, db: AsyncSession = Depends(get_db)):
    status_val = data.get("status")
    return await HospitalService.update_bed_status(db, bed_id, status_val)

@router.post("/rooms", response_model=RoomResponse)
async def add_room(data: RoomCreate, db: AsyncSession = Depends(get_db)):
    return await HospitalService.add_room(db, data)

@router.get("/{hospital_id}/rooms", response_model=List[RoomResponse])
async def get_rooms(hospital_id: int, db: AsyncSession = Depends(get_db)):
    return await HospitalService.get_rooms(db, hospital_id)

@router.post("/ot", response_model=OTResponse)
async def add_ot(data: OTCreate, db: AsyncSession = Depends(get_db)):
    return await HospitalService.add_ot(db, data)

@router.get("/{hospital_id}/ot", response_model=List[OTResponse])
async def get_ots(hospital_id: int, db: AsyncSession = Depends(get_db)):
    return await HospitalService.get_ots(db, hospital_id)

@router.post("/facilities", response_model=FacilityResponse)
async def add_facility(data: FacilityCreate, db: AsyncSession = Depends(get_db)):
    return await HospitalService.add_facility(db, data)

@router.get("/{hospital_id}/facilities", response_model=List[FacilityResponse])
async def get_facilities(hospital_id: int, db: AsyncSession = Depends(get_db)):
    return await HospitalService.get_facilities(db, hospital_id)
