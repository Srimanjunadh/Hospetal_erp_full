from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from sqlalchemy.orm import joinedload
from app.shared.database.models import Hospital, User, WardBed, Room, OperationTheatre, Facility
from typing import List, Optional

class HospitalRepository:
    @staticmethod
    async def list_hospitals(db: AsyncSession) -> List[Hospital]:
        result = await db.execute(select(Hospital).options(joinedload(Hospital.admin)))
        return result.unique().scalars().all()

    @staticmethod
    async def count_doctors_by_hospital(db: AsyncSession, hospital_id: int) -> int:
        result = await db.execute(
            select(func.count(User.id)).filter(User.hospital_id == hospital_id, User.role == "doctor")
        )
        return result.scalar() or 0

    @staticmethod
    async def count_staff_by_hospital(db: AsyncSession, hospital_id: int) -> int:
        result = await db.execute(
            select(func.count(User.id)).filter(
                User.hospital_id == hospital_id, 
                User.role.in_(["nurse", "lab", "pharmacist"])
            )
        )
        return result.scalar() or 0

    @staticmethod
    async def count_patients_by_hospital(db: AsyncSession, hospital_id: int) -> int:
        result = await db.execute(
            select(func.count(User.id)).filter(User.hospital_id == hospital_id, User.role == "patient")
        )
        return result.scalar() or 0

    @staticmethod
    async def get_global_stats(db: AsyncSession) -> dict:
        h_res = await db.execute(select(func.count(Hospital.id)))
        h_count = h_res.scalar() or 0
        
        d_res = await db.execute(select(func.count(User.id)).filter(User.role == "doctor"))
        d_count = d_res.scalar() or 0
        
        s_res = await db.execute(select(func.count(User.id)).filter(User.role.in_(["nurse", "lab", "pharmacist"])))
        s_count = s_res.scalar() or 0
        
        p_res = await db.execute(select(func.count(User.id)).filter(User.role == "patient"))
        p_count = p_res.scalar() or 0
        
        rev_res = await db.execute(select(func.sum(Hospital.total_revenue)))
        total_rev = rev_res.scalar() or 0.0
        
        return {
            "total_hospitals": h_count,
            "total_doctors": d_count,
            "total_staff": s_count,
            "total_patients": p_count,
            "total_revenue": float(total_rev)
        }

    @staticmethod
    async def get_beds(db: AsyncSession, hospital_id: Optional[int] = None) -> List[WardBed]:
        query = select(WardBed)
        if hospital_id:
            query = query.filter(WardBed.hospital_id == hospital_id)
        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def add_bed(db: AsyncSession, bed: WardBed) -> WardBed:
        db.add(bed)
        await db.commit()
        await db.refresh(bed)
        return bed

    @staticmethod
    async def get_bed_by_id(db: AsyncSession, bed_id: int) -> Optional[WardBed]:
        result = await db.execute(select(WardBed).filter(WardBed.id == bed_id))
        return result.scalars().first()

    @staticmethod
    async def create_hospital(db: AsyncSession, hospital: Hospital) -> Hospital:
        db.add(hospital)
        await db.flush()
        return hospital

    @staticmethod
    async def get_hospital_by_id(db: AsyncSession, hospital_id: int) -> Optional[Hospital]:
        result = await db.execute(select(Hospital).filter(Hospital.id == hospital_id))
        return result.scalars().first()

    @staticmethod
    async def create_room(db: AsyncSession, room) -> Room:
        from app.shared.database.models import Room
        db.add(room)
        await db.flush()
        return room

    @staticmethod
    async def get_rooms_by_hospital(db: AsyncSession, hospital_id: int) -> List[Room]:
        from app.shared.database.models import Room
        result = await db.execute(select(Room).filter(Room.hospital_id == hospital_id))
        return result.scalars().all()

    @staticmethod
    async def create_ot(db: AsyncSession, ot) -> OperationTheatre:
        from app.shared.database.models import OperationTheatre
        db.add(ot)
        await db.flush()
        return ot

    @staticmethod
    async def get_ots_by_hospital(db: AsyncSession, hospital_id: int) -> List[OperationTheatre]:
        from app.shared.database.models import OperationTheatre
        result = await db.execute(select(OperationTheatre).filter(OperationTheatre.hospital_id == hospital_id))
        return result.scalars().all()

    @staticmethod
    async def create_facility(db: AsyncSession, facility) -> Facility:
        from app.shared.database.models import Facility
        db.add(facility)
        await db.flush()
        return facility

    @staticmethod
    async def get_facilities_by_hospital(db: AsyncSession, hospital_id: int) -> List[Facility]:
        from app.shared.database.models import Facility
        result = await db.execute(select(Facility).filter(Facility.hospital_id == hospital_id))
        return result.scalars().all()

    @staticmethod
    async def save(db: AsyncSession) -> None:
        await db.commit()

