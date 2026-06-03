from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.session import get_db
from app.models.models import Hospital
from typing import List

router = APIRouter()

from sqlalchemy.orm import joinedload

from app.models.models import Hospital, Doctor, User
from sqlalchemy import func

@router.get("/")
async def list_hospitals(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Hospital).options(joinedload(Hospital.admin)))
    hospitals = result.unique().scalars().all()
    
    output = []
    for h in hospitals:
        # Count Doctors
        doc_res = await db.execute(select(func.count(User.id)).filter(User.hospital_id == h.id, User.role == "doctor"))
        doctor_count = doc_res.scalar() or 0

        # Count Staff (Nurses, Lab, etc)
        staff_res = await db.execute(select(func.count(User.id)).filter(User.hospital_id == h.id, User.role.in_(["nurse", "lab", "pharmacist"])))
        staff_count = staff_res.scalar() or 0

        # Count Patients
        pat_res = await db.execute(select(func.count(User.id)).filter(User.hospital_id == h.id, User.role == "patient"))
        patient_count = pat_res.scalar() or 0

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
            "created_at": h.created_at.isoformat() if h.created_at else None
        }
        
        if h.admin:
            h_dict["admin"] = {
                "id": h.admin.id,
                "name": h.admin.name,
                "username": h.admin.username,
                "cleartext_password": h.admin.cleartext_password
            }
        
        output.append(h_dict)
        
    return output

@router.get("/global/stats")
async def get_global_stats(db: AsyncSession = Depends(get_db)):
    h_res = await db.execute(select(func.count(Hospital.id)))
    h_count = h_res.scalar() or 0
    
    u_res = await db.execute(select(func.count(User.id)).filter(User.role == "doctor"))
    d_count = u_res.scalar() or 0
    
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
        "total_revenue": total_rev
    }
