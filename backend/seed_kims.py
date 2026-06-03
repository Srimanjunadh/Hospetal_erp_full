import asyncio
import random
from datetime import datetime, timedelta
from app.db.session import AsyncSessionLocal, engine, Base
from app.models.models import (
    User, Hospital, Doctor, InventoryItem, Appointment, 
    Prescription, PatientVitals, LabTest, PharmacyOrder, Admission
)
from app.core.security import get_password_hash

async def seed():
    # Note: We are NOT dropping tables here, just adding new data.
    
    async with AsyncSessionLocal() as db:
        # 1. Check if KIMS hospital already exists
        from sqlalchemy import select
        result = await db.execute(select(Hospital).where(Hospital.name == "KIMS"))
        existing_hospital = result.scalar_one_or_none()
        
        if existing_hospital:
            print("Hospital 'KIMS' already exists. Skipping creation.")
            hospital = existing_hospital
        else:
            # 2. Create KIMS Hospital
            hospital = Hospital(
                name="KIMS Hospital",
                location="KIMS Campus, Bangalore",
                node_code="KIMS",
                subscription_status="ACTIVE",
                subscription_expiry=datetime.now() + timedelta(days=365)
            )
            db.add(hospital)
            await db.flush()
            print(f"Created hospital: {hospital.name}")

        # 3. Hospital Admin (KIMS)
        result = await db.execute(select(User).where(User.username == "kims"))
        existing_admin = result.scalar_one_or_none()
        
        if existing_admin:
            print("Admin 'kims' already exists. Updating password.")
            existing_admin.hashed_password = get_password_hash("1122")
            existing_admin.cleartext_password = "1122"
            admin_user = existing_admin
        else:
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
            print(f"Created admin: {admin_user.username}")
        
        hospital.admin_id = admin_user.id

        # 4. Add Doctors
        specializations = ["Cardiology", "Neurology", "Pediatrics", "Orthopedics", "Oncology", "General Medicine"]
        doctors = []
        for i in range(1, 5):
            username = f"KIMS_DOC{i}"
            result = await db.execute(select(User).where(User.username == username))
            if result.scalar_one_or_none():
                continue
                
            d_user = User(
                name=f"Dr. KIMS {i}",
                username=username,
                hashed_password=get_password_hash(f"doc{i}123"),
                cleartext_password=f"doc{i}123",
                role="doctor",
                hospital_id=hospital.id
            )
            db.add(d_user)
            await db.flush()

            doc = Doctor(
                user_id=d_user.id,
                specialization=random.choice(specializations),
                experience=random.randint(5, 25),
                hospital_id=hospital.id,
                room_number=f"KIMS-R{100 + i}",
                status="on-duty"
            )
            db.add(doc)
            await db.flush()
            doctors.append(doc)
            print(f"Added doctor: {d_user.username}")

        # 5. Add Staff (Nurses)
        nurses = []
        for i in range(1, 4):
            username = f"KIMS_NRS{i}"
            result = await db.execute(select(User).where(User.username == username))
            if result.scalar_one_or_none():
                continue
            n_user = User(
                name=f"Nurse KIMS {i}",
                username=username,
                hashed_password=get_password_hash(f"nurse{i}123"),
                cleartext_password=f"nurse{i}123",
                role="nurse",
                hospital_id=hospital.id
            )
            db.add(n_user)
            await db.flush()
            nurses.append(n_user)
            print(f"Added nurse: {n_user.username}")

        # 6. Add Patients
        conditions = ["Hypertension", "Diabetes", "Asthma", "Migraine", "Fever"]
        for i in range(1, 11):
            username = f"KIMS_PAT{i}"
            result = await db.execute(select(User).where(User.username == username))
            if result.scalar_one_or_none():
                continue
                
            assigned_doc = random.choice(doctors) if doctors else None
            assigned_nurse = random.choice(nurses) if nurses else None
            
            p_user = User(
                name=f"Patient KIMS {i}",
                username=username,
                hashed_password=get_password_hash(f"pat{i}123"),
                cleartext_password=f"pat{i}123",
                role="patient",
                hospital_id=hospital.id,
                age=random.randint(18, 85),
                location="Bangalore",
                weight=random.uniform(50.0, 100.0),
                assigned_doctor_id=assigned_doc.id if assigned_doc else None,
                assigned_nurse_id=assigned_nurse.id if assigned_nurse else None
            )
            db.add(p_user)
            await db.flush()
            print(f"Added patient: {p_user.username}")

            # Vitals
            if assigned_nurse:
                vital = PatientVitals(
                    patient_id=p_user.id,
                    nurse_id=assigned_nurse.id,
                    blood_pressure=f"{random.randint(110, 140)}/{random.randint(70, 90)}",
                    heart_rate=random.randint(60, 100),
                    temperature=round(random.uniform(97.0, 99.5), 1),
                    spo2=random.randint(95, 100),
                    glucose=random.uniform(80, 140),
                    nursing_notes=f"Initial checkup for KIMS patient.",
                    medication_status="Stabilizing"
                )
                db.add(vital)

            # Appointments
            if assigned_doc:
                appt = Appointment(
                    patient_id=p_user.id,
                    doctor_id=assigned_doc.id,
                    hospital_id=hospital.id,
                    status="scheduled",
                    scheduled_at=datetime.now() + timedelta(days=random.randint(1, 5)),
                    reason=f"Consultation for {random.choice(conditions)}",
                    type="offline"
                )
                db.add(appt)
                await db.flush()

        # 7. Inventory
        items = [
            InventoryItem(hospital_id=hospital.id, name="KIMS First Aid Kit", category="equipment", quantity=100, min_threshold=10, unit_price=25.0, expiry_date=datetime.now()+timedelta(days=730)),
            InventoryItem(hospital_id=hospital.id, name="KIMS Insulin", category="medicine", quantity=50, min_threshold=5, unit_price=15.0, expiry_date=datetime.now()+timedelta(days=365)),
            InventoryItem(hospital_id=hospital.id, name="KIMS Oxygen Tank", category="equipment", quantity=20, min_threshold=2, unit_price=200.0, expiry_date=datetime.now()+timedelta(days=1000)),
        ]
        # Check if items already exist to avoid duplicates if run multiple times
        for item in items:
            result = await db.execute(select(InventoryItem).where(InventoryItem.hospital_id == hospital.id, InventoryItem.name == item.name))
            if not result.scalar_one_or_none():
                db.add(item)

        await db.commit()
        
        print("\nSuccessfully seeded KIMS Hospital data.")
        print("-" * 30)
        print(f"Hospital Admin: {admin_user.username} / 1122")
        print(f"Hospital Node: {hospital.node_code}")
        print("-" * 30)

if __name__ == "__main__":
    asyncio.run(seed())
