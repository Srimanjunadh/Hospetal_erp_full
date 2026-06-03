import asyncio
import random
from datetime import datetime, timedelta
from app.db.session import AsyncSessionLocal, Base
from app.models.models import (
    User, Hospital, Doctor, InventoryItem, Appointment, 
    Prescription, PatientVitals, LabTest, PharmacyOrder, Admission,
    Billing, SystemAlert, DoctorSchedule, StaffSchedule,
    Ambulance, AmbulanceRequest, WardBed, BloodBank, BloodRequest,
    SurgicalSchedule, PatientRiskScore, NurseMedicineRequest
)
from app.core.security import get_password_hash
from sqlalchemy import select

async def seed_full():
    async with AsyncSessionLocal() as db:
        # 1. Hospital
        result = await db.execute(select(Hospital).where(Hospital.name == "KIMS Hospital"))
        hospital = result.scalar_one_or_none()
        if not hospital:
            hospital = Hospital(
                name="KIMS Hospital",
                location="KIMS Campus, Bangalore",
                node_code="5500",
                subscription_status="ACTIVE",
                subscription_expiry=datetime.now() + timedelta(days=365)
            )
            db.add(hospital)
            await db.flush()
        else:
            hospital.node_code = "5500"
            await db.flush()

        h_id = hospital.id

        # 2. Admin
        result = await db.execute(select(User).where(User.username == "kims"))
        admin_user = result.scalar_one_or_none()
        if not admin_user:
            admin_user = User(
                name="KIMS Admin",
                username="kims",
                hashed_password=get_password_hash("1122"),
                cleartext_password="1122",
                role="hospital_admin",
                hospital_id=hospital.id
            )
            db.add(admin_user)
            await db.flush()
        hospital.admin_id = admin_user.id

        # 3. Doctors & Nurses
        doctors = []
        specs = ["Cardiology", "Neurology", "Pediatrics", "Oncology", "Orthopedics", "Dermatology"]
        for i in range(1, 7):
            uname = f"KIMS_DOC{i}"
            res = await db.execute(select(User).where(User.username == uname))
            u = res.scalar_one_or_none()
            if not u:
                u = User(name=f"Dr. KIMS {i}", username=uname, role="doctor", hospital_id=hospital.id, hashed_password=get_password_hash("1122"), cleartext_password="1122")
                db.add(u)
                await db.flush()
            
            res_doc = await db.execute(select(Doctor).where(Doctor.user_id == u.id))
            doc = res_doc.scalar_one_or_none()
            if not doc:
                doc = Doctor(user_id=u.id, specialization=specs[i-1], experience=10+i, hospital_id=hospital.id, room_number=f"OPD-{100+i}", status="on-duty")
                db.add(doc)
                await db.flush()
            doctors.append(doc)

        nurses = []
        for i in range(1, 6):
            uname = f"KIMS_NRS{i}"
            res = await db.execute(select(User).where(User.username == uname))
            u = res.scalar_one_or_none()
            if not u:
                u = User(name=f"Nurse KIMS {i}", username=uname, role="nurse", hospital_id=hospital.id, hashed_password=get_password_hash("1122"), cleartext_password="1122")
                db.add(u)
                await db.flush()
            nurses.append(u)

        # 3.5 Lab Staff
        uname = "KIMS_LAB"
        res = await db.execute(select(User).where(User.username == uname))
        u = res.scalar_one_or_none()
        if not u:
            u = User(name="KIMS Lab Tech", username=uname, role="lab", hospital_id=hospital.id, hashed_password=get_password_hash("1122"), cleartext_password="1122")
            db.add(u)
            await db.flush()

        # 4. Patients (Expanded to 30)
        patients = []
        for i in range(1, 31):
            uname = f"KIMS_PAT{i}"
            res = await db.execute(select(User).where(User.username == uname))
            u = res.scalar_one_or_none()
            if not u:
                u = User(
                    name=f"Patient KIMS {i}", 
                    username=uname, 
                    role="patient", 
                    hospital_id=hospital.id, 
                    age=random.randint(18, 85), 
                    location="Bangalore",
                    assigned_doctor_id=doctors[i % len(doctors)].id,
                    assigned_nurse_id=nurses[i % len(nurses)].id,
                    hashed_password=get_password_hash("1122"),
                    cleartext_password="1122"
                )
                db.add(u)
                await db.flush()
            patients.append(u)

        # 5. Inventory
        inv_items = [
            ("Paracetamol 500mg", "Medicine", 1000, 50, 1.5),
            ("Amoxicillin", "Medicine", 500, 20, 5.0),
            ("Surgical Masks", "Equipment", 2000, 100, 0.5),
            ("Disposable Syringes", "Equipment", 800, 50, 2.0),
            ("Atorvastatin", "Medicine", 300, 30, 12.0),
            ("Insulin Glargine", "Medicine", 100, 10, 45.0),
            ("Normal Saline 500ml", "Medicine", 400, 40, 8.0)
        ]
        for name, cat, qty, thresh, price in inv_items:
            res = await db.execute(select(InventoryItem).where(InventoryItem.name == name, InventoryItem.hospital_id == hospital.id))
            item = res.scalar_one_or_none()
            if not item:
                db.add(InventoryItem(hospital_id=hospital.id, name=name, category=cat, quantity=qty, min_threshold=thresh, unit_price=price, expiry_date=datetime.now()+timedelta(days=365)))
            else:
                item.quantity += 50 # Add more stock

        # 6. Appointments & Lab Tests & Prescriptions
        for i, p in enumerate(patients):
            # Appointment
            res = await db.execute(select(Appointment).where(Appointment.patient_id == p.id, Appointment.doctor_id == doctors[i % len(doctors)].id, Appointment.status == "pending"))
            if not res.scalar_one_or_none():
                db.add(Appointment(patient_id=p.id, doctor_id=doctors[i % len(doctors)].id, hospital_id=hospital.id, status="pending", preferred_time=f"{9+i%8}:00 AM", reason=random.choice(["Chronic Pain", "Follow-up", "Diagnostic Sync", "General Checkup"]), type="offline"))
            
            # Lab Test
            t_id = f"KIMS-LT-{2000+i}" # Use higher offset to avoid old IDs
            res = await db.execute(select(LabTest).where(LabTest.test_id == t_id))
            if not res.scalar_one_or_none():
                db.add(LabTest(hospital_id=hospital.id, patient_id=p.id, doctor_id=doctors[i % len(doctors)].id, test_name=random.choice(["CBC", "Liver Panel", "Lipid Profile", "Thyroid Sync"]), status="pending", test_id=t_id, cost=random.uniform(200, 1500)))
            
            # Prescription
            res = await db.execute(select(Prescription).where(Prescription.patient_id == p.id, Prescription.doctor_id == doctors[i % len(doctors)].id))
            if not res.scalar_one_or_none():
                meds = [{"name": "Paracetamol", "dosage": "500mg", "duration": "5 days"}]
                db.add(Prescription(patient_id=p.id, doctor_id=doctors[i % len(doctors)].id, medicines=meds, notes="Monitor temperature daily", status="sent_to_pharmacy"))

        # 7. Pharmacy Orders (Accumulating)
        for p in patients[5:15]:
            db.add(PharmacyOrder(hospital_id=hospital.id, patient_id=p.id, medicines=[{"name": "Atorvastatin", "quantity": 30}], total_amount=360.0, status="pending"))

        # 8. Ward Beds (Expanded to 30 beds)
        floors = ["1", "2", "3"]
        for f in floors:
            for r in range(101, 111): # 10 rooms per floor
                for b in ["A", "B", "C"]: # 3 beds per room
                    res = await db.execute(select(WardBed).where(WardBed.hospital_id == hospital.id, WardBed.floor == f, WardBed.room_number == str(r), WardBed.bed_number == b))
                    if not res.scalar_one_or_none():
                        db.add(WardBed(hospital_id=hospital.id, floor=f, room_number=str(r), bed_number=b, status="available"))
        await db.flush()

        # 9. Admissions (Admit 10 patients)
        for i, p in enumerate(patients[10:20]):
            db.add(Admission(patient_id=p.id, doctor_id=doctors[i % len(doctors)].id, hospital_id=hospital.id, reason="Observation Required", status="requested"))

        # 10. Billing (For all patients)
        for p in patients:
            db.add(Billing(patient_id=p.id, hospital_id=hospital.id, amount=random.uniform(1000, 5000), reason="Clinical Services", status="unpaid"))

        # 11. Blood Bank
        blood_groups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
        for bg in blood_groups:
            res = await db.execute(select(BloodBank).where(BloodBank.hospital_id == hospital.id, BloodBank.blood_group == bg))
            bb = res.scalar_one_or_none()
            if not bb:
                db.add(BloodBank(hospital_id=hospital.id, blood_group=bg, units_available=random.randint(10, 50)))
            else:
                bb.units_available += 10

        # 12. System Alerts
        db.add(SystemAlert(hospital_id=hospital.id, from_user_id=admin_user.id, to_role="doctor", message="System Upgrade Scheduled for midnight", type="notification"))

        # 13. Risk Scores (For all patients)
        for p in patients:
            res = await db.execute(select(PatientRiskScore).where(PatientRiskScore.patient_id == p.id))
            if not res.scalar_one_or_none():
                db.add(PatientRiskScore(patient_id=p.id, score_value=random.uniform(1.0, 9.5), risk_level=random.choice(["LOW", "MODERATE", "HIGH", "CRITICAL"]), indicators={"vitals": "monitoring", "comorbidities": random.randint(0, 3)}))

        await db.commit()
        print("KIMS DATA EXPANSION COMPLETE")

if __name__ == "__main__":
    asyncio.run(seed_full())
