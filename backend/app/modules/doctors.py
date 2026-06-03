from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.session import get_db
from app.models.models import User, Doctor, DoctorSchedule
from app.schemas.schemas import Doctor as DoctorSchema, DoctorCreate, User as UserSchema, DoctorSchedule as DoctorScheduleSchema, DoctorScheduleCreate
from typing import List, Optional
from sqlalchemy.orm import joinedload

router = APIRouter()

@router.get("/{doctor_id}/patients", response_model=List[UserSchema])
async def list_assigned_patients(doctor_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User)
        .filter(User.assigned_doctor_id == doctor_id)
        .options(
            joinedload(User.assigned_doctor),
            joinedload(User.assigned_nurse)
        )
    )
    users = result.unique().scalars().all()
    output = []
    for u in users:
        output.append({
            "id": u.id,
            "username": u.username,
            "name": u.name,
            "role": u.role,
            "email": u.email,
            "phone": u.phone,
            "assigned_doctor_id": u.assigned_doctor_id,
            "assigned_nurse_id": u.assigned_nurse_id,
            "created_at": u.created_at.isoformat() if u.created_at else None
        })
    return output

@router.get("/", response_model=List[DoctorSchema])
async def list_doctors(hospital_id: Optional[int] = None, db: AsyncSession = Depends(get_db)):
    query = select(Doctor).options(joinedload(Doctor.user))
    if hospital_id:
        query = query.filter(Doctor.hospital_id == hospital_id)
    result = await db.execute(query)
    doctors = result.unique().scalars().all()
    
    output = []
    for d in doctors:
        try:
            if not d.user:
                print(f"WARNING: Doctor {d.id} has no associated user record")
                continue

            d_dict = {
                "id": d.id,
                "specialization": d.specialization,
                "experience": d.experience,
                "hospital_id": d.hospital_id,
                "room_number": d.room_number,
                "user": {
                    "id": d.user.id,
                    "username": d.user.username,
                    "name": d.user.name,
                    "role": d.user.role,
                    "email": d.user.email,
                    "phone": d.user.phone,
                    "cleartext_password": d.user.cleartext_password,
                    "created_at": d.user.created_at.isoformat() if d.user.created_at else None
                }
            }
            output.append(d_dict)
        except Exception as e:
            print(f"ERROR: Failed to serialize doctor {d.id}: {str(e)}")

    return output

@router.get("/{doctor_id}/schedule", response_model=List[DoctorScheduleSchema])
async def get_doctor_schedule(doctor_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DoctorSchedule).filter(DoctorSchedule.doctor_id == doctor_id))
    return result.scalars().all()

@router.post("/schedule", response_model=DoctorScheduleSchema)
async def create_schedule(schedule_data: DoctorScheduleCreate, db: AsyncSession = Depends(get_db)):
    new_schedule = DoctorSchedule(**schedule_data.dict())
    db.add(new_schedule)
    await db.commit()
    await db.refresh(new_schedule)
    return new_schedule

@router.get("/{doctor_id}", response_model=DoctorSchema)
async def get_doctor(doctor_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Doctor).filter(Doctor.id == doctor_id).options(joinedload(Doctor.user)))
    d = result.scalars().first()
    if not d:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    if not d.user:
        raise HTTPException(status_code=500, detail="Doctor user profile missing")

    return {
        "id": d.id,
        "specialization": d.specialization,
        "experience": d.experience,
        "hospital_id": d.hospital_id,
        "room_number": d.room_number,
        "user": {
            "id": d.user.id,
            "username": d.user.username,
            "name": d.user.name,
            "role": d.user.role,
            "email": d.user.email,
            "phone": d.user.phone,
            "cleartext_password": d.user.cleartext_password,
            "created_at": d.user.created_at.isoformat() if d.user.created_at else None
        }
    }

@router.post("/", response_model=DoctorSchema)
async def create_doctor(doctor_data: DoctorCreate, db: AsyncSession = Depends(get_db)):
    new_doctor = Doctor(**doctor_data.dict())
    db.add(new_doctor)
    await db.commit()
    await db.refresh(new_doctor)
    return new_doctor

@router.get("/{doctor_id}/appointments")
async def get_doctor_appointments(doctor_id: int, db: AsyncSession = Depends(get_db)):
    from app.models.models import Appointment
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(Appointment)
        .filter(Appointment.doctor_id == doctor_id)
        .options(selectinload(Appointment.patient))
    )
    appointments = result.scalars().all()
    
    return [
        {
            "id": a.id,
            "patient": {
                "id": a.patient.id,
                "name": a.patient.name,
                "username": a.patient.username
            },
            "status": a.status,
            "preferred_time": a.preferred_time,
            "reason": a.reason,
            "type": a.type,
            "scheduled_at": a.scheduled_at.isoformat() if a.scheduled_at else None
        } for a in appointments
    ]

@router.patch("/appointments/{appointment_id}")
async def update_appointment(appointment_id: int, data: dict, db: AsyncSession = Depends(get_db)):
    from app.models.models import Appointment
    from sqlalchemy.orm import selectinload
    result = await db.execute(select(Appointment).filter(Appointment.id == appointment_id).options(selectinload(Appointment.patient)))
    appt = result.scalars().first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    if "scheduled_at" in data:
        from datetime import datetime
        try:
            appt.scheduled_at = datetime.fromisoformat(data["scheduled_at"].replace('Z', '+00:00'))
        except:
            pass

    if "status" in data:
        appt.status = data["status"]
        if data["status"] == "scheduled":
            # Automatically add to Doctor's official schedule
            from app.models.models import DoctorSchedule
            from datetime import timedelta
            
            # Use scheduled_at as start_time, add 30 mins for end_time
            start = appt.scheduled_at or datetime.now()
            new_schedule = DoctorSchedule(
                doctor_id=appt.doctor_id,
                task_name=f"Consultation: {appt.patient.name if appt.patient else 'Patient'} ({appt.preferred_time or 'TBD'})",
                start_time=start,
                end_time=start + timedelta(minutes=30),
                status="scheduled"
            )
            db.add(new_schedule)
    
    await db.commit()
    return {"status": "updated"}
