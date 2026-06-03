from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.session import get_db
from app.models.models import PatientVitals, User
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter()

class VitalsCreate(BaseModel):
    patient_id: str # String ID (OP-2026-...)
    nurse_id: str # String ID
    blood_pressure: str
    heart_rate: int
    temperature: float
    spo2: int
    glucose: float
    nursing_notes: Optional[str] = None

@router.post("/")
async def create_vitals(data: VitalsCreate, db: AsyncSession = Depends(get_db)):
    # Find patient user
    pt_res = await db.execute(select(User).filter(User.username == data.patient_id))
    patient = pt_res.scalars().first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    # Find nurse user
    nr_res = await db.execute(select(User).filter(User.username == data.nurse_id))
    nurse = nr_res.scalars().first()
    if not nurse:
        raise HTTPException(status_code=404, detail="Nurse not found")

    new_vitals = PatientVitals(
        patient_id=patient.id,
        nurse_id=nurse.id,
        blood_pressure=data.blood_pressure,
        heart_rate=data.heart_rate,
        temperature=data.temperature,
        spo2=data.spo2,
        glucose=data.glucose,
        nursing_notes=data.nursing_notes
    )
    db.add(new_vitals)
    await db.commit()
    await db.refresh(new_vitals)
    return new_vitals

@router.get("/{username}")
async def get_latest_vitals(username: str, db: AsyncSession = Depends(get_db)):
    pt_res = await db.execute(select(User).filter(User.username == username))
    patient = pt_res.scalars().first()
    if not patient:
        return None
        
    res = await db.execute(
        select(PatientVitals)
        .filter(PatientVitals.patient_id == patient.id)
        .order_by(PatientVitals.created_at.desc())
        .limit(1)
    )
    v = res.scalars().first()
    if not v:
        return None
    return {
        "id": v.id,
        "blood_pressure": v.blood_pressure,
        "heart_rate": v.heart_rate,
        "temperature": v.temperature,
        "spo2": v.spo2,
        "glucose": v.glucose,
        "nursing_notes": v.nursing_notes,
        "created_at": v.created_at.isoformat() if v.created_at else None
    }
