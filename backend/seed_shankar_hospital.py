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
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # 1. Super Admin
        manju_user = User(
            name="Manju SuperAdmin",
            username="Manju",
            hashed_password=get_password_hash("1122"),
            cleartext_password="1122",
            role="super_admin"
        )
        db.add(manju_user)
        await db.flush()

        # 2. Shankar's Hospital
        hospital = Hospital(
            name="Shankar Multi-Specialty Hospital",
            location="Metropolis",
            node_code="SHNK",
            subscription_status="ACTIVE",
            subscription_expiry=datetime.now() + timedelta(days=365)
        )
        db.add(hospital)
        await db.flush()

        # 3. Hospital Admin (Shankar)
        shankar = User(
            name="Shankar Admin",
            username="shankar",
            hashed_password=get_password_hash("123123"),
            cleartext_password="123123",
            role="hospital_admin",
            hospital_id=hospital.id
        )
        db.add(shankar)
        await db.flush()
        hospital.admin_id = shankar.id

        # 4. Add 6 Doctors
        specializations = ["Cardiology", "Neurology", "Pediatrics", "Orthopedics", "Oncology", "General Medicine"]
        doctors = []
        doctor_users = []
        for i in range(1, 7):
            d_user = User(
                name=f"Dr. Example {i}",
                username=f"DOC{i}",
                hashed_password=get_password_hash(f"doc{i}123"),
                cleartext_password=f"doc{i}123",
                role="doctor",
                hospital_id=hospital.id
            )
            db.add(d_user)
            await db.flush()
            doctor_users.append(d_user)

            doc = Doctor(
                user_id=d_user.id,
                specialization=specializations[i-1],
                experience=random.randint(5, 25),
                hospital_id=hospital.id,
                room_number=f"Room {100 + i}",
                status="on-duty"
            )
            db.add(doc)
            await db.flush()
            doctors.append(doc)

        # 5. Add 10 Staff (5 Nurses, 5 Lab)
        nurses = []
        for i in range(1, 6):
            n_user = User(
                name=f"Nurse Example {i}",
                username=f"NRS{i}",
                hashed_password=get_password_hash(f"nurse{i}123"),
                cleartext_password=f"nurse{i}123",
                role="nurse",
                hospital_id=hospital.id
            )
            db.add(n_user)
            await db.flush()
            nurses.append(n_user)

        lab_staff = []
        for i in range(1, 6):
            l_user = User(
                name=f"Lab Tech {i}",
                username=f"LAB{i}",
                hashed_password=get_password_hash(f"lab{i}123"),
                cleartext_password=f"lab{i}123",
                role="lab",
                hospital_id=hospital.id
            )
            db.add(l_user)
            await db.flush()
            lab_staff.append(l_user)

        # 6. Add 20 Patients
        patients = []
        conditions = ["Hypertension", "Diabetes Type 2", "Asthma", "Migraine", "Healthy", "Fracture Recovery", "Anemia"]
        for i in range(1, 21):
            assigned_doc = random.choice(doctors)
            assigned_nurse = random.choice(nurses)
            p_user = User(
                name=f"Patient {i} Doe",
                username=f"PAT{i}",
                hashed_password=get_password_hash(f"pat{i}123"),
                cleartext_password=f"pat{i}123",
                role="patient",
                hospital_id=hospital.id,
                age=random.randint(18, 85),
                location="City Region",
                weight=random.uniform(50.0, 100.0),
                assigned_doctor_id=assigned_doc.id,
                assigned_nurse_id=assigned_nurse.id
            )
            db.add(p_user)
            await db.flush()
            patients.append(p_user)

            # Vitals
            vital = PatientVitals(
                patient_id=p_user.id,
                nurse_id=assigned_nurse.id,
                blood_pressure=f"{random.randint(110, 140)}/{random.randint(70, 90)}",
                heart_rate=random.randint(60, 100),
                temperature=round(random.uniform(97.0, 99.5), 1),
                spo2=random.randint(95, 100),
                glucose=random.uniform(80, 140),
                nursing_notes=f"Patient complains of mild {random.choice(['headache', 'fatigue', 'nausea', 'cough'])}.",
                medication_status="Adhering to schedule"
            )
            db.add(vital)

            # Appointments
            appt = Appointment(
                patient_id=p_user.id,
                doctor_id=assigned_doc.id,
                hospital_id=hospital.id,
                status=random.choice(["pending", "scheduled", "completed"]),
                scheduled_at=datetime.now() + timedelta(days=random.randint(-5, 5)),
                reason=f"Follow up for {random.choice(conditions)}",
                type=random.choice(["online", "offline"])
            )
            db.add(appt)
            await db.flush()

            # Prescriptions (only for some)
            if random.random() > 0.3:
                rx = Prescription(
                    patient_id=p_user.id,
                    doctor_id=assigned_doc.id,
                    appointment_id=appt.id,
                    medicines=[
                        {"medicine": "Paracetamol", "power": "500mg", "amount": 10},
                        {"medicine": "Amoxicillin", "power": "250mg", "amount": 15}
                    ],
                    notes="Take after meals",
                    status="sent_to_pharmacy"
                )
                db.add(rx)
                await db.flush()

                # Pharmacy Order
                p_order = PharmacyOrder(
                    hospital_id=hospital.id,
                    patient_id=p_user.id,
                    prescription_id=rx.id,
                    medicines=rx.medicines,
                    total_amount=random.uniform(10.0, 50.0),
                    status=random.choice(["pending", "completed"])
                )
                db.add(p_order)

            # Lab Tests (only for some)
            if random.random() > 0.5:
                test = LabTest(
                    hospital_id=hospital.id,
                    patient_id=p_user.id,
                    doctor_id=assigned_doc.id,
                    test_name=random.choice(["Complete Blood Count", "Lipid Panel", "HbA1c", "X-Ray"]),
                    status=random.choice(["pending", "completed"]),
                    test_id=f"TEST-{p_user.id}-{random.randint(1000,9999)}",
                    cost=random.uniform(50.0, 200.0)
                )
                db.add(test)

            # Admissions (only for some)
            if random.random() > 0.8:
                admin = Admission(
                    patient_id=p_user.id,
                    doctor_id=assigned_doc.id,
                    hospital_id=hospital.id,
                    reason=f"Severe {random.choice(['chest pain', 'fever', 'fracture'])}",
                    room_number=f"Ward {random.randint(1, 5)} Bed {random.randint(1, 10)}",
                    status="admitted"
                )
                db.add(admin)

        # 7. Inventory
        items = [
            InventoryItem(hospital_id=hospital.id, name="Paracetamol", category="medicine", quantity=500, min_threshold=50, unit_price=2.5, expiry_date=datetime.now()+timedelta(days=730)),
            InventoryItem(hospital_id=hospital.id, name="Amoxicillin", category="medicine", quantity=100, min_threshold=20, unit_price=5.0, expiry_date=datetime.now()+timedelta(days=365)),
            InventoryItem(hospital_id=hospital.id, name="Surgical Masks", category="equipment", quantity=2000, min_threshold=100, unit_price=0.5, expiry_date=datetime.now()+timedelta(days=1000)),
            InventoryItem(hospital_id=hospital.id, name="Ibuprofen", category="medicine", quantity=300, min_threshold=50, unit_price=3.0, expiry_date=datetime.now()+timedelta(days=500)),
        ]
        db.add_all(items)

        await db.commit()
        
        print("Database initialized successfully with Shankar's Hospital dummy data.")
        print("Hospital Admin: shankar / 123123 (Node: SHNK)")
        for i in range(1, 7):
            print(f"Doctor {i}: DOC{i} / doc{i}123")
        for i in range(1, 6):
            print(f"Nurse {i}: NRS{i} / nurse{i}123")
        for i in range(1, 6):
            print(f"Lab Tech {i}: LAB{i} / lab{i}123")
        for i in range(1, 4):
            print(f"Patient {i}: PAT{i} / pat{i}123")

if __name__ == "__main__":
    asyncio.run(seed())
