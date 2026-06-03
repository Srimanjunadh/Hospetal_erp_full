from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload
from app.db.session import get_db
from app.models.models import User, PatientVitals, LabTest, Billing, Doctor, Admission, Prescription, PharmacyOrder, AmbulanceRequest, SystemAlert, Hospital
from pydantic import BaseModel
from typing import List, Optional
import os
import uuid
from datetime import datetime

router = APIRouter()

# --- SCHEMAS ---
class VitalsUpdate(BaseModel):
    patient_id: int
    nurse_id: int
    blood_pressure: str
    heart_rate: int
    temperature: float
    spo2: int
    glucose: float
    nursing_notes: Optional[str] = ""

class AmbulanceReq(BaseModel):
    hospital_id: int
    patient_id: int
    nurse_id: int
    pickup_location: str

class TestRequest(BaseModel):
    hospital_id: int
    patient_id: int
    doctor_id: int
    test_name: str
    cost: Optional[float] = 500.0

class PrescribeRequest(BaseModel):
    hospital_id: int
    patient_id: int
    doctor_id: int
    medicines: List[dict]
    notes: Optional[str] = ""

class AdmitRequest(BaseModel):
    hospital_id: int
    patient_id: int
    doctor_id: int
    reason: Optional[str] = "Clinical Observation Required"

# --- NURSE PORTAL OPS ---

@router.get("/nurse/{nurse_id}/patients")
async def get_nurse_assigned_patients(nurse_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).filter(User.assigned_nurse_id == nurse_id, User.role == "patient"))
    return result.scalars().all()

@router.post("/nurse/vitals")
async def update_patient_vitals(data: VitalsUpdate, db: AsyncSession = Depends(get_db)):
    vitals = PatientVitals(
        patient_id=data.patient_id,
        nurse_id=data.nurse_id,
        blood_pressure=data.blood_pressure,
        heart_rate=data.heart_rate,
        temperature=data.temperature,
        spo2=data.spo2,
        glucose=data.glucose,
        nursing_notes=data.nursing_notes
    )
    db.add(vitals)
    
    # Notify doctor
    pt_res = await db.execute(select(User).filter(User.id == data.patient_id))
    patient = pt_res.scalars().first()
    if patient and patient.assigned_doctor_id:
        alert = SystemAlert(
            hospital_id=patient.hospital_id,
            from_user_id=data.nurse_id,
            to_user_id=patient.assigned_doctor_id,
            message=f"Vitals updated for patient {patient.name}",
            type="notification"
        )
        db.add(alert)

    await db.commit()
    return {"status": "Vitals Updated & Doctor Notified"}

class AlertCreate(BaseModel):
    hospital_id: int
    from_user_id: int
    to_user_id: Optional[int] = None
    to_role: Optional[str] = None
    message: str
    type: Optional[str] = "notification"

@router.post("/alerts")
async def create_alert(data: AlertCreate, db: AsyncSession = Depends(get_db)):
    alert = SystemAlert(
        hospital_id=data.hospital_id,
        from_user_id=data.from_user_id,
        to_user_id=data.to_user_id,
        to_role=data.to_role,
        message=data.message,
        type=data.type
    )
    db.add(alert)
    await db.commit()
    return {"status": "Alert Created"}

@router.post("/emergency")
async def send_emergency_alert(data: dict, db: AsyncSession = Depends(get_db)):
    alert = SystemAlert(
        hospital_id=data['hospital_id'],
        from_user_id=data['from_user_id'],
        to_role='doctor', 
        message=data['message'],
        type="emergency"
    )
    db.add(alert)
    await db.commit()
    return {"status": "Emergency Alert Transmitted"}

@router.post("/ambulance-request")
async def request_ambulance(data: AmbulanceReq, db: AsyncSession = Depends(get_db)):
    request = AmbulanceRequest(
        hospital_id=data.hospital_id,
        patient_id=data.patient_id,
        nurse_id=data.nurse_id,
        pickup_location=data.pickup_location
    )
    db.add(request)
    await db.commit()
    return {"status": "Ambulance Dispatched", "request_id": request.id}

# --- LAB (TEST) PORTAL OPS ---

@router.get("/lab/pending")
async def get_pending_tests(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(LabTest).filter(LabTest.status == "pending").options(joinedload(LabTest.patient), joinedload(LabTest.doctor).joinedload(Doctor.user)))
    return result.scalars().all()

@router.post("/lab/upload/{test_id}")
async def upload_test_result(test_id: str, file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(LabTest).filter(LabTest.test_id == test_id))
    test = result.scalars().first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    
    file_path = f"uploads/results/{test_id}_{file.filename}"
    os.makedirs("uploads/results", exist_ok=True)
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())
    
    test.status = "completed"
    test.file_path = file_path
    
    # Notify Doctor, Patient, Nurse
    pt_res = await db.execute(select(User).filter(User.id == test.patient_id))
    patient = pt_res.scalars().first()
    
    if patient:
        # To Doctor
        db.add(SystemAlert(hospital_id=test.hospital_id, from_user_id=test.patient_id, to_user_id=patient.assigned_doctor_id, message=f"Test results available for {patient.name}", type="notification"))
        # To Nurse
        db.add(SystemAlert(hospital_id=test.hospital_id, from_user_id=test.patient_id, to_user_id=patient.assigned_nurse_id, message=f"Test results available for {patient.name}", type="notification"))
        # To Patient
        db.add(SystemAlert(hospital_id=test.hospital_id, from_user_id=test.patient_id, to_user_id=patient.id, message=f"Your test results for {test.test_name} are ready", type="notification"))

    await db.commit()
    return {"status": "Result Uploaded & Parties Notified", "path": file_path}

# --- DOCTOR PORTAL OPS ---

@router.post("/doctor/test-request")
async def request_lab_test(data: TestRequest, db: AsyncSession = Depends(get_db)):
    test = LabTest(
        hospital_id=data.hospital_id,
        patient_id=data.patient_id,
        doctor_id=data.doctor_id,
        test_name=data.test_name,
        status="pending",
        test_id=f"TEST-{uuid.uuid4().hex[:8].upper()}",
        cost=data.cost
    )
    db.add(test)
    await db.commit()
    return {"status": "Test Requested", "test_id": test.test_id}

@router.post("/doctor/prescribe")
async def prescribe_medication(data: PrescribeRequest, db: AsyncSession = Depends(get_db)):
    new_pres = Prescription(
        patient_id=data.patient_id,
        doctor_id=data.doctor_id,
        medicines=data.medicines,
        notes=data.notes,
        status="sent_to_pharmacy"
    )
    db.add(new_pres)
    await db.flush()
    
    pharm_order = PharmacyOrder(
        hospital_id=data.hospital_id,
        patient_id=data.patient_id,
        prescription_id=new_pres.id,
        medicines=data.medicines,
        total_amount=0.0,
        status="pending"
    )
    db.add(pharm_order)
    
    await db.commit()
    return {"status": "Prescription Transmitted to Pharmacy", "prescription_id": new_pres.id}

@router.post("/doctor/admit-request")
async def request_admission(data: AdmitRequest, db: AsyncSession = Depends(get_db)):
    admission = Admission(
        patient_id=data.patient_id,
        doctor_id=data.doctor_id,
        hospital_id=data.hospital_id,
        reason=data.reason,
        status="requested"
    )
    db.add(admission)
    
    # Get Patient, Nurse, and Doctor Details for richer notification
    pt_res = await db.execute(select(User).filter(User.id == data.patient_id).options(joinedload(User.assigned_nurse)))
    patient = pt_res.scalars().first()
    nurse_name = patient.assigned_nurse.name if patient and patient.assigned_nurse else "None"
    patient_name = patient.name if patient else f"ID {data.patient_id}"
    
    doc_res = await db.execute(select(Doctor).filter(Doctor.id == data.doctor_id).options(joinedload(Doctor.user)))
    doctor_record = doc_res.scalars().first()
    doctor_name = doctor_record.user.name if doctor_record and doctor_record.user else f"ID {data.doctor_id}"
    from_user_id = doctor_record.user_id if doctor_record else data.doctor_id

    # Notify Admin
    h_res = await db.execute(select(Hospital).filter(Hospital.id == data.hospital_id))
    hospital = h_res.scalars().first()
    if hospital:
        alert = SystemAlert(
            hospital_id=hospital.id,
            from_user_id=from_user_id,
            to_user_id=hospital.admin_id,
            message=f"Admission request for {patient_name} (Assigned Nurse: {nurse_name}) recommended by Dr. {doctor_name}. Reason: {data.reason}",
            type="task"
        )
        db.add(alert)
        
    await db.commit()
    return {"status": "Admission Requested. Waiting for Admin Room Assignment"}

@router.get("/admissions")
async def get_all_admissions(hospital_id: Optional[int] = None, db: AsyncSession = Depends(get_db)):
    query = select(Admission).options(joinedload(Admission.patient), joinedload(Admission.doctor))
    if hospital_id:
        query = query.filter(Admission.hospital_id == hospital_id)
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/admissions/pending")
async def get_pending_admissions(hospital_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Admission).filter(Admission.hospital_id == hospital_id, Admission.status == "requested").options(joinedload(Admission.patient), joinedload(Admission.doctor)))
    return result.scalars().all()

@router.post("/admissions/finalize")
async def finalize_admission(data: dict, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Admission).filter(Admission.id == data['admission_id']))
    admission = result.scalars().first()
    if not admission:
        raise HTTPException(status_code=404, detail="Request not found")
    
    admission.room_number = data['room_number']
    admission.status = "admitted"
    
    # Notify Nurse
    pt_res = await db.execute(select(User).filter(User.id == admission.patient_id))
    patient = pt_res.scalars().first()
    if patient and patient.assigned_nurse_id:
        alert = SystemAlert(
            hospital_id=admission.hospital_id,
            from_user_id=admission.hospital_id, # System
            to_user_id=patient.assigned_nurse_id,
            message=f"New patient {patient.name} admitted to room {data['room_number']}",
            type="notification"
        )
        db.add(alert)
        
    await db.commit()
    return {"status": "Patient Admitted & Nurse Notified"}

# --- PATIENT HUB ---

@router.get("/patient/{patient_id}/billing")
async def get_total_expenditure(patient_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Billing).filter(Billing.patient_id == patient_id))
    bills = result.scalars().all()
    total = sum(b.amount for b in bills)
    return {"total": total, "history": bills}
@router.get("/patient/{patient_id}/tests")
async def get_patient_tests(patient_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(LabTest).filter(LabTest.patient_id == patient_id).options(joinedload(LabTest.doctor)))
    return result.scalars().all()

@router.get("/vitals/{username}")
async def get_latest_vitals_by_username(username: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).filter(User.username == username))
    patient = result.scalars().first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    vit_res = await db.execute(select(PatientVitals).filter(PatientVitals.patient_id == patient.id).order_by(PatientVitals.created_at.desc()))
    return vit_res.scalars().first()

@router.get("/patient/{patient_id}/history")
async def get_patient_history(patient_id: int, db: AsyncSession = Depends(get_db)):
    # Aggregate visits, prescriptions, tests, and admissions
    records = []
    
    # 1. Prescriptions
    pres_res = await db.execute(
        select(Prescription)
        .filter(Prescription.patient_id == patient_id)
        .options(joinedload(Prescription.doctor).joinedload(Doctor.user))
    )
    prescriptions = pres_res.scalars().all()
    for p in prescriptions:
        records.append({
            "id": f"PR-{p.id:04d}",
            "name": "PRESCRIPTION SUMMARY",
            "type": "PRESCRIPTION",
            "provider": f"Dr. {p.doctor.user.name}" if p.doctor else "Unknown",
            "date": p.created_at.strftime("%Y-%m-%d"),
            "size": "24 KB",
            "status": "SECURE",
            "metadata": p.medicines
        })

    # 2. Lab Tests
    test_res = await db.execute(
        select(LabTest)
        .filter(LabTest.patient_id == patient_id)
        .options(joinedload(LabTest.doctor).joinedload(Doctor.user))
    )
    tests = test_res.scalars().all()
    for t in tests:
        records.append({
            "id": t.test_id,
            "name": f"{t.test_name.upper()} RESULT",
            "type": "LAB_RESULT",
            "provider": f"Dr. {t.doctor.user.name}" if t.doctor else "Unknown",
            "date": t.created_at.strftime("%Y-%m-%d"),
            "size": "1.4 MB",
            "status": "SECURE",
            "metadata": {"status": t.status}
        })

    # 3. Admissions
    adm_res = await db.execute(
        select(Admission)
        .filter(Admission.patient_id == patient_id)
        .options(joinedload(Admission.doctor).joinedload(Doctor.user))
    )
    admissions = adm_res.scalars().all()
    for a in admissions:
        record_date = a.admitted_at or a.created_at if hasattr(a, 'created_at') else datetime.utcnow()
        records.append({
            "id": f"ADM-{a.id:04d}",
            "name": "HOSPITAL ADMISSION RECORD",
            "type": "ADMISSION",
            "provider": f"Dr. {a.doctor.user.name}" if a.doctor else "Unknown",
            "date": record_date.strftime("%Y-%m-%d") if record_date else "N/A",
            "size": "850 KB",
            "status": "SECURE",
            "metadata": {"reason": a.reason, "room": a.room_number}
        })

    # Sort by date descending
    records.sort(key=lambda x: x['date'], reverse=True)
    return records

@router.get("/pharmacy/orders")
async def get_pharmacy_orders(hospital_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(PharmacyOrder)
        .filter(PharmacyOrder.hospital_id == hospital_id, PharmacyOrder.status == "pending")
        .options(joinedload(PharmacyOrder.patient))
    )
    return result.scalars().all()

@router.patch("/pharmacy/order/{order_id}/done")
async def mark_pharmacy_order_done(order_id: int, db: AsyncSession = Depends(get_db)):
    from app.models.models import PharmacyOrder, InventoryItem, SystemAlert
    result = await db.execute(select(PharmacyOrder).filter(PharmacyOrder.id == order_id))
    order = result.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order.status = "completed"
    
    # Update Inventory
    for med in order.medicines:
        med_name = med.get('medicine') or med.get('name')
        qty_requested = int(med.get('amount') or med.get('quantity') or 1)
        
        inv_res = await db.execute(select(InventoryItem).filter(InventoryItem.hospital_id == order.hospital_id, InventoryItem.name == med_name))
        inv_item = inv_res.scalars().first()
        if inv_item:
            inv_item.quantity = max(0, inv_item.quantity - qty_requested)
            
    # Notify Patient
    alert_patient = SystemAlert(
        hospital_id=order.hospital_id,
        from_user_id=1,
        to_user_id=order.patient_id,
        message=f"Your medication order #{order.id} is ready.",
        type="notification"
    )
    db.add(alert_patient)
    
    await db.commit()
    return {"status": "Order Completed"}

@router.get("/alerts/{user_id}")
async def get_system_alerts(user_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(SystemAlert)
        .filter(SystemAlert.to_user_id == user_id)
        .order_by(SystemAlert.created_at.desc())
    )
    return result.scalars().all()

@router.get("/doctor/prescriptions/{patient_id}")
async def get_patient_prescriptions(patient_id: int, db: AsyncSession = Depends(get_db)):
    from app.models.models import Prescription
    result = await db.execute(select(Prescription).filter(Prescription.patient_id == patient_id).order_by(Prescription.created_at.desc()))
    return result.scalars().all()

@router.get("/patient/{patient_id}/prescriptions")
async def get_my_prescriptions(patient_id: int, db: AsyncSession = Depends(get_db)):
    from app.models.models import Prescription
    result = await db.execute(select(Prescription).filter(Prescription.patient_id == patient_id).order_by(Prescription.created_at.desc()))
    return result.scalars().all()

@router.post("/nurse/medicine-request")
async def create_nurse_medicine_request(data: dict, db: AsyncSession = Depends(get_db)):
    from app.models.models import NurseMedicineRequest, SystemAlert
    new_req = NurseMedicineRequest(
        hospital_id=data['hospital_id'],
        patient_id=data['patient_id'],
        nurse_id=data['nurse_id'],
        medicines=data['medicines'],
        status="pending"
    )
    db.add(new_req)
    
    # Notify Pharmacy
    alert = SystemAlert(
        hospital_id=data['hospital_id'],
        from_user_id=data['nurse_id'],
        to_role="lab", # Using 'lab' role for pharmacy for now if not defined
        message=f"New Medicine Request for Patient ID {data['patient_id']} from Nurse.",
        type="task"
    )
    db.add(alert)
    
    await db.commit()
    return {"status": "Request Sent to Pharmacy", "id": new_req.id}

@router.get("/pharmacy/nurse-requests/{hospital_id}")
async def get_pharmacy_nurse_requests(hospital_id: int, db: AsyncSession = Depends(get_db)):
    from app.models.models import NurseMedicineRequest, User
    result = await db.execute(
        select(NurseMedicineRequest)
        .options(joinedload(NurseMedicineRequest.patient), joinedload(NurseMedicineRequest.nurse))
        .filter(NurseMedicineRequest.hospital_id == hospital_id, NurseMedicineRequest.status != "done")
    )
    reqs = result.scalars().all()
    return [
        {
            "id": r.id,
            "patient_name": r.patient.name,
            "patient_id": r.patient_id,
            "nurse_name": r.nurse.name,
            "nurse_id": r.nurse_id,
            "medicines": r.medicines,
            "status": r.status,
            "created_at": r.created_at
        } for r in reqs
    ]

@router.patch("/pharmacy/nurse-request/{request_id}/done")
async def mark_nurse_request_done(request_id: int, db: AsyncSession = Depends(get_db)):
    from app.models.models import NurseMedicineRequest, SystemAlert
    result = await db.execute(select(NurseMedicineRequest).filter(NurseMedicineRequest.id == request_id))
    req = result.scalars().first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    
    req.status = "done"
    
    # Update Inventory
    for med in req.medicines:
        med_name = med.get('name') or med.get('medicine')
        qty_requested = int(med.get('quantity') or med.get('amount') or 1)
        
        # Find in inventory
        inv_res = await db.execute(select(InventoryItem).filter(InventoryItem.hospital_id == req.hospital_id, InventoryItem.name == med_name))
        inv_item = inv_res.scalars().first()
        if inv_item:
            inv_item.quantity = max(0, inv_item.quantity - qty_requested)
    
    # Notify Nurse and Patient
    alert_nurse = SystemAlert(
        hospital_id=req.hospital_id,
        from_user_id=1, 
        to_user_id=req.nurse_id,
        message=f"Pharmacy has packed medicines for Patient ID {req.patient_id}.",
        type="notification"
    )
    alert_patient = SystemAlert(
        hospital_id=req.hospital_id,
        from_user_id=1,
        to_user_id=req.patient_id,
        message=f"Your medicines are ready at the pharmacy.",
        type="notification"
    )
    db.add(alert_nurse)
    db.add(alert_patient)
    
    await db.commit()
    return {"status": "Request Completed"}
@router.post("/patient/{patient_id}/health-records")
async def upload_health_record(
    patient_id: int, 
    title: str = Body(...),
    record_type: str = Body(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    from app.models.models import HealthRecord
    
    file_path = f"uploads/records/{patient_id}_{uuid.uuid4().hex[:8]}_{file.filename}"
    os.makedirs("uploads/records", exist_ok=True)
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())
        
    new_record = HealthRecord(
        user_id=patient_id,
        title=title,
        record_type=record_type,
        attachments=[{"url": file_path, "fileName": file.filename}]
    )
    db.add(new_record)
    await db.commit()
    return {"status": "Record Uploaded", "record_id": new_record.id}
