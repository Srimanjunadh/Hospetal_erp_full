import asyncio
from app.db.session import engine, Base
from app.models.models import User, Doctor, Appointment, Prescription, AmbulanceRequest, InventoryItem, PharmacyOrder, PatientVitals, MedicalReport, Hospital, DoctorSchedule, StaffSchedule, LabTest, Billing, Admission
from sqlalchemy import text

async def fix_schema():
    async with engine.begin() as conn:
        # Drop tables that need schema updates
        print("Dropping tables for update...")
        await conn.execute(text("DROP TABLE IF EXISTS prescriptions"))
        await conn.execute(text("DROP TABLE IF EXISTS pharmacy_orders"))
        await conn.execute(text("DROP TABLE IF EXISTS admissions"))
        
        # Recreate all tables (this will recreate the dropped ones with new schema)
        print("Recreating tables with new schema...")
        await conn.run_sync(Base.metadata.create_all)
    print("Schema update completed successfully")

if __name__ == "__main__":
    asyncio.run(fix_schema())
