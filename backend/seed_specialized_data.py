import asyncio
from app.db.session import engine, Base
from app.models.models import BloodBank, SurgicalSchedule, PatientRiskScore, Hospital, User, Doctor
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta

async def seed_specialized():
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        print("Seeding Specialized Data...")
        
        # Get a hospital
        result = await session.execute(select(Hospital))
        hospital = result.scalars().first()
        
        if not hospital:
            print("No hospital found. Run update_facility_schema.py first.")
            return

        # 1. Seed Blood Bank
        groups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
        for g in groups:
            # Check if exists
            res = await session.execute(select(BloodBank).filter(BloodBank.hospital_id == hospital.id, BloodBank.blood_group == g))
            if not res.scalars().first():
                units = 15.0 if g != "O-" else 2.0  # O- is rare for demo
                session.add(BloodBank(hospital_id=hospital.id, blood_group=g, units_available=units))
        
        # Get a patient (User with role patient) and doctor
        res_p = await session.execute(select(User).filter(User.role == "patient"))
        patient = res_p.scalars().first()
        res_d = await session.execute(select(Doctor))
        doctor = res_d.scalars().first()
        
        if patient and doctor:
            surgeries = [
                SurgicalSchedule(
                    hospital_id=hospital.id,
                    patient_id=patient.id,
                    doctor_id=doctor.id,
                    ot_room_number="OT-101",
                    procedure_name="APPENDICECTOMY",
                    scheduled_at=datetime.utcnow() + timedelta(hours=2),
                    status="SCHEDULED",
                    checklist_status={
                        "Patient Identity Confirmed": True,
                        "Site Marked": True,
                        "Anesthesia Safety Check": False,
                        "Pulse Oximeter On": False,
                        "Known Allergy Checked": True
                    }
                ),
                SurgicalSchedule(
                    hospital_id=hospital.id,
                    patient_id=patient.id,
                    doctor_id=doctor.id,
                    ot_room_number="OT-202",
                    procedure_name="CHOLECYSTECTOMY",
                    scheduled_at=datetime.utcnow() + timedelta(hours=5),
                    status="READY",
                    checklist_status={k: False for k in ["Patient Identity Confirmed", "Site Marked", "Anesthesia Safety Check", "Pulse Oximeter On", "Known Allergy Checked"]}
                )
            ]
            session.add_all(surgeries)
            
            # 3. Seed Risk Score
            risk = PatientRiskScore(
                patient_id=patient.id,
                score_value=7.8,
                risk_level="HIGH",
                indicators={"heart_rate": "elevated", "systolic_bp": 145}
            )
            session.add(risk)

        await session.commit()
        print("Specialized data seeded successfully.")

if __name__ == "__main__":
    asyncio.run(seed_specialized())
