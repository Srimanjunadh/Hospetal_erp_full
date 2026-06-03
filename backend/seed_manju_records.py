import asyncio
from app.db.session import engine, Base
from app.models.models import User, Prescription, LabTest, Admission, Doctor, Hospital
from sqlalchemy.future import select
from datetime import datetime, timedelta

async def seed():
    async with engine.begin() as conn:
        # Get Manju
        res = await conn.execute(select(User).filter(User.username == 'OP-2026-001'))
        manju = res.fetchone()
        
        if not manju:
            print("Manju not found")
            return

        # Get a doctor
        res = await conn.execute(select(Doctor).limit(1))
        doctor = res.fetchone()
        
        if not doctor:
            print("Doctor not found")
            return

        # Seed Prescription
        from sqlalchemy.ext.asyncio import AsyncSession
        from sqlalchemy.orm import sessionmaker
        async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        
        async with async_session() as session:
            # 1. Prescription
            p = Prescription(
                patient_id=manju.id,
                doctor_id=doctor.id,
                medicines=[
                    {"medicine": "Paracetamol", "dosage": "500mg", "timing": "1-0-1"},
                    {"medicine": "Amoxicillin", "dosage": "250mg", "timing": "1-1-1"}
                ],
                notes="Take after meals. Complete the course.",
                status="completed"
            )
            session.add(p)
            
            # 2. Lab Test
            t = LabTest(
                hospital_id=manju.hospital_id,
                patient_id=manju.id,
                doctor_id=doctor.id,
                test_name="Full Blood Count",
                status="completed",
                test_id="TEST-FBC-9921",
                cost=450.0,
                file_path="uploads/results/TEST-FBC-9921_report.pdf"
            )
            session.add(t)
            
            # 3. Admission
            a = Admission(
                patient_id=manju.id,
                doctor_id=doctor.id,
                hospital_id=manju.hospital_id,
                reason="Severe Dehydration & Viral Fever",
                status="discharged",
                room_number="ICU-402"
            )
            session.add(a)
            
            await session.commit()
            print("Records seeded for Manju")

if __name__ == "__main__":
    asyncio.run(seed())
