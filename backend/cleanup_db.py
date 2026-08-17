import asyncio
import os
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from app.models.models import Hospital, Doctor

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def cleanup_data():
    async with AsyncSessionLocal() as session:
        # Get first 2 hospitals
        result = await session.execute(text("SELECT id FROM hospitals ORDER BY id LIMIT 2"))
        hospitals_to_keep = [row[0] for row in result.fetchall()]
        
        # Get first 6 doctors
        result = await session.execute(text("SELECT id FROM doctors ORDER BY id LIMIT 6"))
        doctors_to_keep = [row[0] for row in result.fetchall()]
        
        if len(hospitals_to_keep) < 2 or len(doctors_to_keep) < 6:
            print("Not enough hospitals or doctors to keep. Exiting.")
            return

        h1, h2 = hospitals_to_keep[0], hospitals_to_keep[1]
        doc1_3 = doctors_to_keep[0:3]
        doc4_6 = doctors_to_keep[3:6]
        
        print(f"Keeping Hospitals: {h1}, {h2}")
        print(f"Keeping Doctors: {doctors_to_keep}")

        try:
            # 1. Clear out transactional tables that might have foreign keys preventing deletion
            tables_to_clear = [
                "appointments", "prescriptions", "patient_vitals", "inventory", 
                "pharmacy_orders", "ward_beds", "ambulances", "nurse_medicine_requests",
                "blood_bank", "blood_requests", "surgical_schedules", "patient_risk_scores",
                "health_records", "system_alerts", "billing"
            ]
            for table in tables_to_clear:
                await session.execute(text(f"DELETE FROM {table}"))
                
            # 2. Update the 6 doctors to belong to the 2 hospitals
            # Doctors 1-3 to Hospital 1
            await session.execute(text(f"UPDATE doctors SET hospital_id = {h1} WHERE id IN ({','.join(map(str, doc1_3))})"))
            # Doctors 4-6 to Hospital 2
            await session.execute(text(f"UPDATE doctors SET hospital_id = {h2} WHERE id IN ({','.join(map(str, doc4_6))})"))
            
            # 3. Clear assigned_doctor_id and assigned_nurse_id from users to avoid FK conflicts
            await session.execute(text("UPDATE users SET assigned_doctor_id = NULL, assigned_nurse_id = NULL"))
            
            # 4. Delete all other doctors
            await session.execute(text(f"DELETE FROM doctors WHERE id NOT IN ({','.join(map(str, doctors_to_keep))})"))
            
            # 5. Delete users (admins/nurses) assigned to other hospitals
            await session.execute(text(f"DELETE FROM users WHERE hospital_id IS NOT NULL AND hospital_id NOT IN ({h1}, {h2})"))
            
            # 6. Nullify admin_id in hospitals temporarily to avoid cyclic FK if we are deleting users
            # Wait, the hospitals to delete might have admin_id pointing to users we just deleted. 
            # Actually, let's just delete the hospitals not in our list
            await session.execute(text(f"UPDATE hospitals SET admin_id = NULL WHERE id NOT IN ({h1}, {h2})"))
            
            # 7. Delete all other hospitals
            await session.execute(text(f"DELETE FROM hospitals WHERE id NOT IN ({h1}, {h2})"))
            
            await session.commit()
            print("Successfully cleaned up database! Only 2 hospitals and 6 doctors remain.")
        except Exception as e:
            await session.rollback()
            print(f"Error during cleanup: {e}")

if __name__ == "__main__":
    asyncio.run(cleanup_data())
