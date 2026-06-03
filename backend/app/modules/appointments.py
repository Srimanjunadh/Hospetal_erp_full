from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.session import get_db
from app.models.models import Appointment
from app.schemas.schemas import Appointment as AppointmentSchema, AppointmentCreate
from typing import List

router = APIRouter()

@router.post("/", response_model=AppointmentSchema)
async def book_appointment(data: AppointmentCreate, db: AsyncSession = Depends(get_db)):
    new_appointment = Appointment(
        **data.dict(),
        status="pending"
    )
    db.add(new_appointment)
    await db.commit()
    await db.refresh(new_appointment)
    return new_appointment

@router.get("/patient/{patient_id}", response_model=List[AppointmentSchema])
async def get_patient_appointments(patient_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Appointment).filter(Appointment.patient_id == patient_id))
    return result.scalars().all()

@router.get("/doctor/{doctor_id}", response_model=List[AppointmentSchema])
async def get_doctor_appointments(doctor_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Appointment).filter(Appointment.doctor_id == doctor_id))
    return result.scalars().all()

@router.patch("/{appointment_id}/status")
async def update_appointment_status(appointment_id: int, status: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Appointment).filter(Appointment.id == appointment_id))
    appointment = result.scalars().first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    appointment.status = status
    await db.commit()
    return {"message": "Status updated successfully"}

@router.patch("/{appointment_id}")
async def update_appointment_details(appointment_id: int, data: dict, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Appointment).filter(Appointment.id == appointment_id))
    appointment = result.scalars().first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    if "doctor_id" in data:
        appointment.doctor_id = data["doctor_id"]
    if "scheduled_at" in data:
        from datetime import datetime
        try:
            sched_str = data["scheduled_at"]
            if sched_str:
                appointment.scheduled_at = datetime.fromisoformat(sched_str.replace("Z", "+00:00"))
        except Exception as e:
            pass
    if "preferred_time" in data:
        appointment.preferred_time = data["preferred_time"]
    if "status" in data:
        appointment.status = data["status"]
        
    await db.commit()
    return {"message": "Appointment updated successfully"}

@router.get("/hospital/{hospital_id}")
async def get_hospital_appointments(hospital_id: int, db: AsyncSession = Depends(get_db)):
    from sqlalchemy.orm import joinedload
    from app.models.models import Doctor
    result = await db.execute(
        select(Appointment)
        .options(
            joinedload(Appointment.patient), 
            joinedload(Appointment.doctor).joinedload(Doctor.user)
        )
        .filter(Appointment.hospital_id == hospital_id)
    )
    appointments = result.scalars().all()
    return [
        {
            "id": a.id,
            "patient_name": a.patient.name if a.patient else "Unknown",
            "doctor_name": a.doctor.user.name if a.doctor and a.doctor.user else "Unknown",
            "doctor_id": a.doctor_id,
            "scheduled_at": a.scheduled_at,
            "preferred_time": a.preferred_time,
            "reason": a.reason,
            "status": a.status,
            "type": a.type
        } for a in appointments
    ]

@router.post("/{appointment_id}/approve")
async def approve_appointment(appointment_id: int, db: AsyncSession = Depends(get_db)):
    from app.models.models import SystemAlert, User
    from datetime import datetime, timedelta
    
    result = await db.execute(select(Appointment).filter(Appointment.id == appointment_id))
    appointment = result.scalars().first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    appointment.status = "admin_approved"
    
    # 1. Create alert for Doctor
    # Need to find doctor's user_id
    from app.models.models import Doctor
    doc_result = await db.execute(select(Doctor).filter(Doctor.id == appointment.doctor_id))
    doctor = doc_result.scalars().first()
    
    if doctor:
        alert = SystemAlert(
            hospital_id=appointment.hospital_id,
            from_user_id=1, # Admin
            to_user_id=doctor.user_id,
            to_role="doctor",
            message=f"New Appointment Request from Patient #{appointment.patient_id} at {appointment.preferred_time}. Please review.",
            type="notification"
        )
        db.add(alert)
    
    await db.commit()
    return {"status": "Appointment Approved by Admin and Sent to Doctor"}

@router.post("/internal/sync")
async def sync_pms_appointment(data: dict, db: AsyncSession = Depends(get_db)):
    """
    Internal endpoint for PMS to sync appointments to the correct ERP hospital.
    
    The PMS sends appointment data including:
    - hospital_id: The ERP hospital ID (already resolved from PMS→ERP mapping by sync_bridge)
    - pms_hospital_id: The original PMS hospital_tieup_id (for audit)
    - patient_name, doctor_name: For reference when ERP user IDs are not set
    """
    try:
        from datetime import datetime
        
        erp_hospital_id = data.get('hospital_id', 1)
        
        # Build preferred_time from slot info
        preferred_time = data.get('preferred_time', '')
        
        # Build reason including doctor/patient info for ERP display
        raw_reason = data.get('reason', '') or ''
        doctor_name = data.get('doctor_name', '')
        patient_name = data.get('patient_name', '')
        pms_hospital_id = data.get('pms_hospital_id')
        
        # Compose a rich reason string for ERP admins
        reason_parts = []
        if raw_reason:
            reason_parts.append(raw_reason)
        if doctor_name:
            reason_parts.append(f"[Dr: {doctor_name}]")
        if patient_name:
            reason_parts.append(f"[Patient: {patient_name}]")
        if pms_hospital_id:
            reason_parts.append(f"[PMS Hospital #{pms_hospital_id}]")
        
        full_reason = " | ".join(reason_parts) or "PMS Appointment"
        
        new_appointment = Appointment(
            patient_id=data.get('patient_id') or 1,
            doctor_id=data.get('doctor_id') or 1,
            hospital_id=erp_hospital_id,
            status=data.get('status', 'scheduled'),
            reason=full_reason,
            preferred_time=preferred_time,
            type=data.get('type', 'offline'),
            token_number=data.get('token_number', 0),
            queue_position=data.get('queue_position', 0)
        )
        if data.get('scheduled_at'):
            try:
                sched_str = str(data['scheduled_at']).strip()
                # Try multiple formats
                for fmt in ['%Y-%m-%d %H:%M', '%Y_%m_%d', '%Y-%m-%d']:
                    try:
                        new_appointment.scheduled_at = datetime.strptime(sched_str, fmt)
                        break
                    except ValueError:
                        continue
            except:
                pass
        
        db.add(new_appointment)
        await db.commit()
        await db.refresh(new_appointment)
        
        return {
            "success": True, 
            "message": f"Synced to ERP Hospital #{erp_hospital_id}",
            "appointment_id": new_appointment.id,
            "erp_hospital_id": erp_hospital_id
        }
    except Exception as e:
        return {"success": False, "message": str(e)}
