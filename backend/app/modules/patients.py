from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.session import get_db
from app.models.models import User, Appointment, Doctor, Prescription
from app.schemas.schemas import User as UserSchema, Appointment as AppointmentSchema
from typing import List, Optional

router = APIRouter()

from sqlalchemy.orm import joinedload

@router.get("/", response_model=List[UserSchema])
async def list_patients(hospital_id: Optional[int] = None, db: AsyncSession = Depends(get_db)):
    query = select(User).filter(User.role == "patient")
    if hospital_id:
        query = query.filter(User.hospital_id == hospital_id)
    
    result = await db.execute(
        query.options(
            joinedload(User.assigned_doctor).joinedload(Doctor.user),
            joinedload(User.assigned_nurse)
        )
    )
    users = result.unique().scalars().all()
    
    # Convert to dict to avoid serialization issues
    output = []
    for u in users:
        u_dict = {
            "id": u.id,
            "username": u.username,
            "name": u.name,
            "role": u.role,
            "phone": u.phone,
            "cleartext_password": u.cleartext_password,
            "assigned_doctor": {
                "id": u.assigned_doctor.id,
                "user": {
                    "name": u.assigned_doctor.user.name if u.assigned_doctor.user else "Unknown"
                } if u.assigned_doctor.user else None
            } if u.assigned_doctor else None,
            "assigned_nurse": {
                "id": u.assigned_nurse.id,
                "name": u.assigned_nurse.name
            } if u.assigned_nurse else None,
            "created_at": u.created_at.isoformat() if u.created_at else None
        }
        output.append(u_dict)
    return output

@router.get("/{patient_id}", response_model=UserSchema)
async def get_patient(patient_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User)
        .filter(User.id == patient_id)
        .options(
            joinedload(User.assigned_doctor),
            joinedload(User.assigned_nurse)
        )
    )
    u = result.unique().scalars().first()
    if not u:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    return {
        "id": u.id,
        "username": u.username,
        "name": u.name,
        "role": u.role,
        "phone": u.phone,
        "email": u.email,
        "age": u.age,
        "location": u.location,
        "weight": u.weight,
        "hospital_id": u.hospital_id,
        "assigned_doctor_id": u.assigned_doctor_id,
        "assigned_nurse_id": u.assigned_nurse_id,
        "created_at": u.created_at.isoformat() if u.created_at else None
    }

@router.get("/{username}/prescriptions")
async def get_patient_prescriptions(username: str, db: AsyncSession = Depends(get_db)):
    pt_res = await db.execute(select(User).filter(User.username == username))
    patient = pt_res.scalars().first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    res = await db.execute(
        select(Prescription)
        .join(Appointment)
        .filter(Appointment.patient_id == patient.id)
    )
    prescriptions = res.scalars().all()
    
    return [
        {
            "id": p.id,
            "medicines": p.medicines,
            "notes": p.notes,
            "appointment_id": p.appointment_id
        } for p in prescriptions
    ]

@router.get("/me", response_model=UserSchema)
async def get_patient_me(current_user: User = Depends(get_db)): # Simplified for now
    return current_user

@router.get("/appointments", response_model=List[AppointmentSchema])
async def get_my_appointments(patient_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Appointment).filter(Appointment.patient_id == patient_id))
    return result.scalars().all()
