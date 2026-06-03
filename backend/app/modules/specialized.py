from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.session import get_db
from app.models.models import BloodBank, BloodRequest, SurgicalSchedule, PatientRiskScore, User, Doctor, SystemAlert, DoctorSchedule
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter()

# --- Schemas ---
class BloodStockBase(BaseModel):
    blood_group: str
    units_available: float

class BloodRequestCreate(BaseModel):
    hospital_id: int
    patient_id: int
    doctor_id: int
    blood_group: str
    units_required: float
    urgency: str

class SurgicalScheduleCreate(BaseModel):
    hospital_id: int
    patient_id: int
    doctor_id: int
    ot_room_number: str
    procedure_name: str
    scheduled_at: datetime
    notes: Optional[str] = None

# --- Blood Bank Endpoints ---

@router.get("/blood-stock/{hospital_id}")
async def get_blood_stock(hospital_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BloodBank).filter(BloodBank.hospital_id == hospital_id))
    stock = result.scalars().all()
    if not stock:
        # Initialize default stock if empty
        groups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
        for g in groups:
            db.add(BloodBank(hospital_id=hospital_id, blood_group=g, units_available=10.0))
        await db.commit()
        result = await db.execute(select(BloodBank).filter(BloodBank.hospital_id == hospital_id))
        stock = result.scalars().all()
    return stock

@router.patch("/blood-stock/{hospital_id}")
async def update_blood_stock(hospital_id: int, data: dict, db: AsyncSession = Depends(get_db)):
    blood_group = data.get("blood_group")
    units = data.get("units")
    
    if not blood_group:
        raise HTTPException(status_code=400, detail="blood_group is required")
        
    result = await db.execute(
        select(BloodBank)
        .filter(BloodBank.hospital_id == hospital_id, BloodBank.blood_group == blood_group)
    )
    stock = result.scalars().first()
    if not stock:
        stock = BloodBank(hospital_id=hospital_id, blood_group=blood_group, units_available=float(units or 0.0))
        db.add(stock)
    else:
        if units is not None:
            stock.units_available = float(units)
            
    await db.commit()
    return {"message": "Blood stock updated successfully", "blood_group": blood_group, "units_available": stock.units_available}

@router.post("/blood-request")
async def create_blood_request(req: BloodRequestCreate, db: AsyncSession = Depends(get_db)):
    new_req = BloodRequest(**req.dict())
    db.add(new_req)
    await db.commit()
    await db.refresh(new_req)
    return new_req

@router.get("/blood-requests/{hospital_id}")
async def get_blood_requests(hospital_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(BloodRequest)
        .filter(BloodRequest.hospital_id == hospital_id)
        .order_by(BloodRequest.created_at.desc())
    )
    return result.scalars().all()

# --- Surgical Schedule (OT) Endpoints ---

@router.post("/surgical-schedule")
async def schedule_surgery(data: SurgicalScheduleCreate, db: AsyncSession = Depends(get_db)):
    new_surgery = SurgicalSchedule(**data.dict())
    new_surgery.status = "PENDING_APPROVAL"
    new_surgery.checklist_status = {
        "Patient Identity Confirmed": False,
        "Site Marked": False,
        "Anesthesia Safety Check": False,
        "Pulse Oximeter On": False,
        "Known Allergy Checked": False
    }
    db.add(new_surgery)
    await db.commit()
    await db.refresh(new_surgery)
    
    # Get doctor to find user_id for alert
    doc_res = await db.execute(select(Doctor).filter(Doctor.id == data.doctor_id))
    doc = doc_res.scalar_one_or_none()
    if doc:
        alert = SystemAlert(
            hospital_id=data.hospital_id,
            from_user_id=1,
            to_user_id=doc.user_id,
            to_role="doctor",
            message=f"Surgical OT Request: {data.procedure_name} scheduled for {data.scheduled_at.strftime('%Y-%m-%d %H:%M')}. Click Approve to confirm.",
            type="surgery_approval"
        )
        db.add(alert)
        await db.commit()
        
    return new_surgery

@router.post("/surgical-schedule/{id}/approve")
async def approve_surgery(id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SurgicalSchedule).filter(SurgicalSchedule.id == id))
    surgery = result.scalar_one_or_none()
    if not surgery:
        raise HTTPException(status_code=404, detail="Surgery not found")
    
    surgery.status = "SCHEDULED"
    
    # Add to DoctorSchedule
    doc_sched = DoctorSchedule(
        doctor_id=surgery.doctor_id,
        task_name=f"Surgery: {surgery.procedure_name}",
        start_time=surgery.scheduled_at,
        end_time=surgery.scheduled_at,
        status="CONFIRMED",
        notes=f"OT Room: {surgery.ot_room_number}"
    )
    db.add(doc_sched)
    
    # Send Intimation Alert to Patient
    alert = SystemAlert(
        hospital_id=surgery.hospital_id,
        from_user_id=1,
        to_user_id=surgery.patient_id,
        to_role="patient",
        message=f"Your surgery {surgery.procedure_name} has been confirmed by your doctor for {surgery.scheduled_at.strftime('%Y-%m-%d %H:%M')} in OT Room {surgery.ot_room_number}.",
        type="notification"
    )
    db.add(alert)
    await db.commit()
    return surgery

@router.delete("/surgical-schedule/{id}")
async def delete_surgery(id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SurgicalSchedule).filter(SurgicalSchedule.id == id))
    surgery = result.scalar_one_or_none()
    if not surgery:
        raise HTTPException(status_code=404, detail="Surgery not found")
    await db.delete(surgery)
    await db.commit()
    return {"detail": "Surgery deleted successfully"}

@router.get("/surgical-schedules/{hospital_id}")
async def get_surgeries(hospital_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SurgicalSchedule).filter(SurgicalSchedule.hospital_id == hospital_id))
    surgeries = result.scalars().all()
    if not surgeries:
        # Get a patient and doctor for default assignment
        p_res = await db.execute(select(User).filter(User.role == "patient"))
        patient = p_res.scalars().first()
        d_res = await db.execute(select(Doctor))
        doctor = d_res.scalars().first()
        
        p_id = patient.id if patient else 1
        d_id = doctor.id if doctor else 1

        default_surgeries = [
            SurgicalSchedule(
                hospital_id=hospital_id,
                patient_id=p_id,
                doctor_id=d_id,
                ot_room_number="OT-101",
                procedure_name="CORONARY ARTERY BYPASS GRAFT (CABG)",
                scheduled_at=datetime.now(),
                status="IN-PROGRESS",
                checklist_status={
                    "Patient Identity Confirmed": True,
                    "Site Marked": True,
                    "Anesthesia Safety Check": True,
                    "Pulse Oximeter On": True,
                    "Known Allergy Checked": True
                },
                notes="High priority cardiac surgery"
            ),
            SurgicalSchedule(
                hospital_id=hospital_id,
                patient_id=p_id,
                doctor_id=d_id,
                ot_room_number="OT-102",
                procedure_name="TOTAL KNEE REPLACEMENT (ARTHROPLASTY)",
                scheduled_at=datetime.now(),
                status="SCHEDULED",
                checklist_status={
                    "Patient Identity Confirmed": True,
                    "Site Marked": True,
                    "Anesthesia Safety Check": False,
                    "Pulse Oximeter On": False,
                    "Known Allergy Checked": True
                },
                notes="Standard orthopedic procedure"
            ),
            SurgicalSchedule(
                hospital_id=hospital_id,
                patient_id=p_id,
                doctor_id=d_id,
                ot_room_number="OT-204",
                procedure_name="CRANIOTOMY FOR TUMOR RESECTION",
                scheduled_at=datetime.now(),
                status="SCHEDULED",
                checklist_status={
                    "Patient Identity Confirmed": False,
                    "Site Marked": False,
                    "Anesthesia Safety Check": False,
                    "Pulse Oximeter On": False,
                    "Known Allergy Checked": False
                },
                notes="Complex neurosurgical oncology"
            )
        ]
        for s in default_surgeries:
            db.add(s)
        await db.commit()
        
        result = await db.execute(select(SurgicalSchedule).filter(SurgicalSchedule.hospital_id == hospital_id))
        surgeries = result.scalars().all()
    return surgeries

@router.patch("/surgical-schedule/{id}/checklist")
async def update_checklist(id: int, checklist: dict, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SurgicalSchedule).filter(SurgicalSchedule.id == id))
    surgery = result.scalar_one_or_none()
    if not surgery:
        raise HTTPException(status_code=404, detail="Surgery not found")
    surgery.checklist_status = checklist
    await db.commit()
    return surgery

# --- Patient Risk Score (AI-Ready) ---

@router.get("/patient/{patient_id}/risk-score")
async def get_risk_score(patient_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(PatientRiskScore)
        .filter(PatientRiskScore.patient_id == patient_id)
        .order_by(PatientRiskScore.calculated_at.desc())
    )
    score = result.scalars().first()
    if not score:
        import random
        val = round(random.uniform(1.0, 9.0), 1)
        level = "LOW"
        if val > 7: level = "CRITICAL"
        elif val > 5: level = "HIGH"
        elif val > 3: level = "MODERATE"
        
        score = PatientRiskScore(
            patient_id=patient_id,
            score_value=val,
            risk_level=level,
            indicators={"age_factor": 1.2, "vital_stability": "variable"}
        )
        db.add(score)
        await db.commit()
        await db.refresh(score)
    return score
@router.get("/hospital/{hospital_id}/risk-scores")
async def get_hospital_risk_scores(hospital_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(PatientRiskScore, User.name, User.username)
        .join(User, PatientRiskScore.patient_id == User.id)
        .filter(User.hospital_id == hospital_id)
        .order_by(PatientRiskScore.score_value.desc())
    )
    rows = result.all()
    return [
        {
            "id": r.PatientRiskScore.id,
            "patient_id": r.PatientRiskScore.patient_id,
            "patient_name": r.name,
            "patient_username": r.username,
            "score_value": r.PatientRiskScore.score_value,
            "risk_level": r.PatientRiskScore.risk_level,
            "indicators": r.PatientRiskScore.indicators,
            "calculated_at": r.PatientRiskScore.calculated_at
        } for r in rows
    ]
