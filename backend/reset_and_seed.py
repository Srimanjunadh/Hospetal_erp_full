import asyncio
from dotenv import load_dotenv
import os

# Explicitly load the backend .env
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from app.db.session import engine, Base, AsyncSessionLocal
from app.models.models import User, Doctor, Hospital, InventoryItem
from sqlalchemy import text, select
from app.core.security import get_password_hash

async def reset_system():
    # 1. Kill old DB
    from app.db.session import DATABASE_URL
    db_path = DATABASE_URL.replace("sqlite+aiosqlite:///", "").replace("./", "")
    # If the path is relative, we might need to be careful. 
    # But since we're running from the root, let's just find the file.
    
    if os.path.exists(db_path):
        try:
            os.remove(db_path)
            print(f"Deleted old database at {db_path} successfully.")
        except Exception as e:
            print(f"Could not delete DB file at {db_path}: {e}")
            print("Attempting to truncate tables instead...")
            async with engine.begin() as conn:
                await conn.execute(text("DROP TABLE IF EXISTS pharmacy_orders"))
                await conn.execute(text("DROP TABLE IF EXISTS prescriptions"))
                await conn.execute(text("DROP TABLE IF EXISTS admissions"))
                await conn.execute(text("DROP TABLE IF EXISTS inventory"))
                await conn.execute(text("DROP TABLE IF EXISTS users"))
                await conn.execute(text("DROP TABLE IF EXISTS doctors"))
                await conn.execute(text("DROP TABLE IF EXISTS hospitals"))
        
    # 2. Create New Tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Recreated system schema.")


    # 3. Seed Essential Data
    async with AsyncSessionLocal() as db:
        # Check if Hospital exists
        result = await db.execute(select(Hospital).filter(Hospital.name == "MEDCLUES GENERAL"))
        hosp = result.scalars().first()
        if not hosp:
            hosp = Hospital(name="MEDCLUES GENERAL", location="CENTRAL HUB", node_code="9001", subscription_status="active")
            db.add(hosp)
            await db.flush()

        # Check for Master Account
        result = await db.execute(select(User).filter(User.username == "Manju"))
        master = result.scalars().first()
        if not master:
            master = User(
                username="Manju",
                name="MANJU MASTER",
                role="super_admin",
                hashed_password=get_password_hash("1122"),
                hospital_id=hosp.id
            )
            db.add(master)

        # Check for Doctor GovardHAN
        result = await db.execute(select(User).filter(User.username == "GOVARDHAN"))
        doc_user = result.scalars().first()
        if not doc_user:
            doc_user = User(
                username="GOVARDHAN",
                name="DR. GOVARDHAN",
                role="doctor",
                hashed_password=get_password_hash("1122"),
                hospital_id=hosp.id
            )
            db.add(doc_user)
            await db.flush()
            
            doc_profile = Doctor(user_id=doc_user.id, specialization="CARDIOLOGY", experience=15, hospital_id=hosp.id)
            db.add(doc_profile)
        else:
            result = await db.execute(select(Doctor).filter(Doctor.user_id == doc_user.id))
            doc_profile = result.scalars().first()

        # Create Patient Manju (for testing)
        result = await db.execute(select(User).filter(User.username == "PAT-001"))
        patient = result.scalars().first()
        if not patient:
            patient = User(
                username="PAT-001",
                name="MANJU (PATIENT)",
                role="patient",
                hashed_password=get_password_hash("1122"),
                assigned_doctor_id=doc_profile.id,
                hospital_id=hosp.id
            )
            db.add(patient)

        # Seed Inventory (idempotent)
        for name, qty, price in [("PARACETAMOL", 500, 10), ("AMOXICILLIN", 0, 25), ("IBUPROFEN", 150, 15)]:
            result = await db.execute(select(InventoryItem).filter(InventoryItem.name == name))
            if not result.scalars().first():
                db.add(InventoryItem(name=name, quantity=qty, unit_price=price, category="medicine"))

        await db.commit()
    print("System Seeding Complete.")

if __name__ == "__main__":
    asyncio.run(reset_system())
