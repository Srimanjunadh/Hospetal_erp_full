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

hospital_names = [
    "Apollo Hospital",
    "Fortis Hospital",
    "Manipal Hospital",
    "Narayana Health",
    "Max Super Speciality",
    "Medanta The Medicity",
    "AIIMS Delhi",
    "Christian Medical College",
    "Tata Memorial Hospital",
    "Lilavati Hospital"
]

async def seed_multiple_hospitals():
    async with AsyncSessionLocal() as db:
        for index, h_name in enumerate(hospital_names, start=1):
            h_prefix = h_name.split()[0].lower()
            h_prefix_upper = h_prefix.upper()
            node_code = str(6000 + index)
            
            print(f"Seeding {h_name}...")
            
            # 1. Hospital
            result = await db.execute(select(Hospital).where(Hospital.name == h_name))
            hospital = result.scalar_one_or_none()
            if not hospital:
                hospital = Hospital(
                    name=h_name,
                    location=f"{h_name} Campus, City Center",
                    node_code=node_code,
                    subscription_status="ACTIVE",
                    subscription_expiry=datetime.now() + timedelta(days=365)
                )
                db.add(hospital)
                await db.flush()
            else:
                hospital.node_code = node_code
                await db.flush()

            # 2. Admin
            admin_username = f"{h_prefix}_admin"
            result = await db.execute(select(User).where(User.username == admin_username))
            admin_user = result.scalar_one_or_none()
            if not admin_user:
                admin_user = User(
                    name=f"{h_name} Admin",
                    username=admin_username,
                    hashed_password=get_password_hash("1122"),
                    cleartext_password="1122",
                    role="hospital_admin",
                    hospital_id=hospital.id
                )
                db.add(admin_user)
                await db.flush()
            hospital.admin_id = admin_user.id
            await db.flush()

            # 3. Doctors & Nurses
            doctors = []
            specs = ["Cardiology", "Neurology", "Pediatrics", "Oncology", "Orthopedics"]
            for i in range(1, 4):
                uname = f"{h_prefix_upper}_DOC{i}"
                res = await db.execute(select(User).where(User.username == uname))
                u = res.scalar_one_or_none()
                if not u:
                    u = User(name=f"Dr. {h_prefix_upper} {i}", username=uname, role="doctor", hospital_id=hospital.id, hashed_password=get_password_hash("1122"), cleartext_password="1122")
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
            for i in range(1, 4):
                uname = f"{h_prefix_upper}_NRS{i}"
                res = await db.execute(select(User).where(User.username == uname))
                u = res.scalar_one_or_none()
                if not u:
                    u = User(name=f"Nurse {h_prefix_upper} {i}", username=uname, role="nurse", hospital_id=hospital.id, hashed_password=get_password_hash("1122"), cleartext_password="1122")
                    db.add(u)
                    await db.flush()
                nurses.append(u)

            # 3.5 Lab Staff
            lab_uname = f"{h_prefix_upper}_LAB"
            res = await db.execute(select(User).where(User.username == lab_uname))
            u = res.scalar_one_or_none()
            if not u:
                u = User(name=f"{h_prefix_upper} Lab Tech", username=lab_uname, role="lab", hospital_id=hospital.id, hashed_password=get_password_hash("1122"), cleartext_password="1122")
                db.add(u)
                await db.flush()

            # 4. Patients
            patients = []
            for i in range(1, 11):
                uname = f"{h_prefix_upper}_PAT{i}"
                res = await db.execute(select(User).where(User.username == uname))
                u = res.scalar_one_or_none()
                if not u:
                    u = User(
                        name=f"Patient {h_prefix_upper} {i}", 
                        username=uname, 
                        role="patient", 
                        hospital_id=hospital.id, 
                        age=random.randint(18, 85), 
                        location="City Center",
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
                ("Surgical Masks", "Equipment", 2000, 100, 0.5),
                ("Normal Saline 500ml", "Medicine", 400, 40, 8.0)
            ]
            for name, cat, qty, thresh, price in inv_items:
                res = await db.execute(select(InventoryItem).where(InventoryItem.name == name, InventoryItem.hospital_id == hospital.id))
                item = res.scalar_one_or_none()
                if not item:
                    db.add(InventoryItem(hospital_id=hospital.id, name=name, category=cat, quantity=qty, min_threshold=thresh, unit_price=price, expiry_date=datetime.now()+timedelta(days=365)))
                else:
                    item.quantity += 50

            # 6. Appointments & Lab Tests & Prescriptions
            for i, p in enumerate(patients):
                res = await db.execute(select(Appointment).where(Appointment.patient_id == p.id, Appointment.status == "pending"))
                if not res.scalar_one_or_none():
                    db.add(Appointment(patient_id=p.id, doctor_id=doctors[i % len(doctors)].id, hospital_id=hospital.id, status="pending", preferred_time=f"{9+i%8}:00 AM", reason=random.choice(["Chronic Pain", "Follow-up", "Checkup"]), type="offline"))
                
                t_id = f"{h_prefix_upper}-LT-{3000+i}"
                res = await db.execute(select(LabTest).where(LabTest.test_id == t_id))
                if not res.scalar_one_or_none():
                    db.add(LabTest(hospital_id=hospital.id, patient_id=p.id, doctor_id=doctors[i % len(doctors)].id, test_name=random.choice(["CBC", "Liver Panel"]), status="pending", test_id=t_id, cost=random.uniform(200, 1500)))
                
                res = await db.execute(select(Prescription).where(Prescription.patient_id == p.id))
                if not res.scalar_one_or_none():
                    meds = [{"name": "Paracetamol", "dosage": "500mg", "duration": "5 days"}]
                    db.add(Prescription(patient_id=p.id, doctor_id=doctors[i % len(doctors)].id, medicines=meds, notes="Monitor daily", status="sent_to_pharmacy"))

            # 7. Pharmacy Orders
            for p in patients[0:2]:
                db.add(PharmacyOrder(hospital_id=hospital.id, patient_id=p.id, medicines=[{"name": "Paracetamol", "quantity": 10}], total_amount=15.0, status="pending"))

            # 8. Ward Beds
            for f in ["1", "2"]:
                for r in range(101, 106):
                    for b in ["A", "B"]:
                        res = await db.execute(select(WardBed).where(WardBed.hospital_id == hospital.id, WardBed.floor == f, WardBed.room_number == str(r), WardBed.bed_number == b))
                        if not res.scalar_one_or_none():
                            db.add(WardBed(hospital_id=hospital.id, floor=f, room_number=str(r), bed_number=b, status="available"))
            await db.flush()

            # 9. Admissions
            for i, p in enumerate(patients[0:2]):
                db.add(Admission(patient_id=p.id, doctor_id=doctors[i % len(doctors)].id, hospital_id=hospital.id, reason="Observation Required", status="requested"))

            # 10. Billing
            for p in patients:
                db.add(Billing(patient_id=p.id, hospital_id=hospital.id, amount=random.uniform(1000, 5000), reason="Clinical Services", status="unpaid"))

            # 11. Blood Bank
            for bg in ["A+", "O+"]:
                res = await db.execute(select(BloodBank).where(BloodBank.hospital_id == hospital.id, BloodBank.blood_group == bg))
                bb = res.scalar_one_or_none()
                if not bb:
                    db.add(BloodBank(hospital_id=hospital.id, blood_group=bg, units_available=random.randint(10, 50)))
                else:
                    bb.units_available += 10

            # 12. Risk Scores
            for p in patients:
                res = await db.execute(select(PatientRiskScore).where(PatientRiskScore.patient_id == p.id))
                if not res.scalar_one_or_none():
                    db.add(PatientRiskScore(patient_id=p.id, score_value=random.uniform(1.0, 9.5), risk_level=random.choice(["LOW", "MODERATE", "HIGH", "CRITICAL"]), indicators={"vitals": "monitoring", "comorbidities": random.randint(0, 3)}))
            
            await db.commit()
            print(f"{h_name} seeding complete.")

if __name__ == "__main__":
    asyncio.run(seed_multiple_hospitals())
