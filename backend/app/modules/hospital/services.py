from sqlalchemy.ext.asyncio import AsyncSession
from app.shared.database.models import WardBed, Hospital, Room, OperationTheatre, Facility
from app.modules.hospital.repositories import HospitalRepository
from app.modules.hospital.schemas import (
    BedCreate, HospitalRegister, HospitalConfigUpdate, RoomCreate, OTCreate, FacilityCreate
)
from fastapi import HTTPException
from typing import List, Optional

class HospitalService:
    @staticmethod
    async def list_hospitals_with_counts(db: AsyncSession) -> List[dict]:
        hospitals = await HospitalRepository.list_hospitals(db)
        output = []
        for h in hospitals:
            doctor_count = await HospitalRepository.count_doctors_by_hospital(db, h.id)
            staff_count = await HospitalRepository.count_staff_by_hospital(db, h.id)
            patient_count = await HospitalRepository.count_patients_by_hospital(db, h.id)
            
            h_dict = {
                "id": h.id,
                "name": h.name,
                "location": h.location,
                "node_code": h.node_code,
                "admin": None,
                "admin_id": h.admin_id,
                "doctor_count": doctor_count,
                "staff_count": staff_count,
                "patient_count": patient_count,
                "subscription_status": h.subscription_status,
                "subscription_expiry": h.subscription_expiry.isoformat() if h.subscription_expiry else None,
                "total_revenue": h.total_revenue,
                "organization_id": h.organization_id,
                "config_settings": h.config_settings,
                "created_at": h.created_at.isoformat() if h.created_at else None
            }
            if h.admin:
                h_dict["admin"] = {
                    "id": h.admin.id,
                    "name": h.admin.name,
                    "username": h.admin.username
                }
            output.append(h_dict)
        return output

    @staticmethod
    async def get_global_stats(db: AsyncSession) -> dict:
        return await HospitalRepository.get_global_stats(db)

    @staticmethod
    async def register_hospital(db: AsyncSession, data: HospitalRegister) -> Hospital:
        h = Hospital(
            name=data.name,
            location=data.location,
            node_code=data.node_code,
            specialization=data.specialization,
            admin_id=data.admin_id,
            organization_id=data.organization_id,
            config_settings={}
        )
        await HospitalRepository.create_hospital(db, h)
        await HospitalRepository.save(db)
        return h

    @staticmethod
    async def update_config(db: AsyncSession, hospital_id: int, data: HospitalConfigUpdate) -> Hospital:
        h = await HospitalRepository.get_hospital_by_id(db, hospital_id)
        if not h:
            raise HTTPException(status_code=404, detail="Hospital not found")
        h.config_settings = data.config_settings
        await HospitalRepository.save(db)
        return h

    @staticmethod
    async def get_beds(db: AsyncSession, hospital_id: Optional[int] = None) -> List[WardBed]:
        return await HospitalRepository.get_beds(db, hospital_id)

    @staticmethod
    async def add_bed(db: AsyncSession, data: BedCreate) -> WardBed:
        new_bed = WardBed(
            hospital_id=data.hospital_id,
            floor=data.floor,
            room_number=data.room_number,
            bed_number=data.bed_number,
            dept=data.dept,
            status="available"
        )
        return await HospitalRepository.add_bed(db, new_bed)

    @staticmethod
    async def update_bed_status(db: AsyncSession, bed_id: int, status: str) -> dict:
        bed = await HospitalRepository.get_bed_by_id(db, bed_id)
        if bed:
            bed.status = status
            await HospitalRepository.save(db)
            return {"status": "updated"}
        return {"error": "Not found"}

    @staticmethod
    async def add_room(db: AsyncSession, data: RoomCreate) -> Room:
        h = await HospitalRepository.get_hospital_by_id(db, data.hospital_id)
        if not h:
            raise HTTPException(status_code=404, detail="Hospital node not found")
        room = Room(
            hospital_id=data.hospital_id,
            room_number=data.room_number,
            room_type=data.room_type,
            floor=data.floor,
            status="AVAILABLE"
        )
        await HospitalRepository.create_room(db, room)
        await HospitalRepository.save(db)
        return room

    @staticmethod
    async def get_rooms(db: AsyncSession, hospital_id: int) -> List[Room]:
        return await HospitalRepository.get_rooms_by_hospital(db, hospital_id)

    @staticmethod
    async def add_ot(db: AsyncSession, data: OTCreate) -> OperationTheatre:
        h = await HospitalRepository.get_hospital_by_id(db, data.hospital_id)
        if not h:
            raise HTTPException(status_code=404, detail="Hospital node not found")
        ot = OperationTheatre(
            hospital_id=data.hospital_id,
            name=data.name,
            status="AVAILABLE"
        )
        await HospitalRepository.create_ot(db, ot)
        await HospitalRepository.save(db)
        return ot

    @staticmethod
    async def get_ots(db: AsyncSession, hospital_id: int) -> List[OperationTheatre]:
        return await HospitalRepository.get_ots_by_hospital(db, hospital_id)

    @staticmethod
    async def add_facility(db: AsyncSession, data: FacilityCreate) -> Facility:
        h = await HospitalRepository.get_hospital_by_id(db, data.hospital_id)
        if not h:
            raise HTTPException(status_code=404, detail="Hospital node not found")
        facility = Facility(
            hospital_id=data.hospital_id,
            name=data.name,
            category=data.category,
            status="OPERATIONAL"
        )
        await HospitalRepository.create_facility(db, facility)
        await HospitalRepository.save(db)
        return facility

    @staticmethod
    async def get_facilities(db: AsyncSession, hospital_id: int) -> List[Facility]:
        return await HospitalRepository.get_facilities_by_hospital(db, hospital_id)
