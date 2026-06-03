import asyncio
from app.db.session import engine, Base
from app.models.models import (
    User, Doctor, Appointment, Prescription, AmbulanceRequest, 
    InventoryItem, PharmacyOrder, PatientVitals, Hospital, 
    DoctorSchedule, StaffSchedule, LabTest, Admission, 
    SystemAlert, Billing, WardBed, Ambulance, 
    NurseMedicineRequest, BloodBank, BloodRequest, 
    SurgicalSchedule, PatientRiskScore
)

async def create_tables():
    async with engine.begin() as conn:
        # This will create all tables defined in Base.metadata that do not exist
        await conn.run_sync(Base.metadata.create_all)
    print("Tables created successfully")

if __name__ == "__main__":
    asyncio.run(create_tables())
