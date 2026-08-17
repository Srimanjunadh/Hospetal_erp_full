import asyncio
from app.db.session import AsyncSessionLocal, engine, Base
from app.models.models import User, Hospital, Doctor, InventoryItem
from app.core.security import get_password_hash
from datetime import datetime, timedelta

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
            role="super_admin"
        )
        db.add(manju_user)
        await db.flush()

        # 2. Sample Hospital
        hospital = Hospital(
            name="City General Hospital",
            location="Downtown",
            node_code="1001",
            subscription_status="ACTIVE",
            subscription_expiry=datetime.now() + timedelta(days=365)
        )
        db.add(hospital)
        await db.flush()

        # 3. Hospital Admin
        h_admin = User(
            name="Alice Admin",
            username="ADM1001",
            hashed_password=get_password_hash("admin123"),
            role="hospital_admin",
            hospital_id=hospital.id
        )
        db.add(h_admin)
        await db.flush()
        hospital.admin_id = h_admin.id

        # 4. Doctor
        doc_user = User(
            name="Dr. Smith",
            username="DOC1001",
            hashed_password=get_password_hash("doc123"),
            role="doctor",
            hospital_id=hospital.id
        )
        db.add(doc_user)
        await db.flush()

        doctor = Doctor(
            user_id=doc_user.id,
            specialization="Cardiology",
            experience=10,
            hospital_id=hospital.id,
            room_number="Room 301",
            status="on-duty"
        )
        db.add(doctor)

        # 5. Nurse
        nurse_user = User(
            name="Nurse Joy",
            username="NRS1001",
            hashed_password=get_password_hash("nurse123"),
            role="nurse",
            hospital_id=hospital.id
        )
        db.add(nurse_user)

        # 6. Test Staff
        test_user = User(
            name="Lab Technician",
            username="LAB1001",
            hashed_password=get_password_hash("lab123"),
            role="lab",
            hospital_id=hospital.id
        )
        db.add(test_user)

        # 7. Inventory
        items = [
            InventoryItem(hospital_id=hospital.id, name="Paracetamol", category="medicine", quantity=500, min_threshold=50, unit_price=2.5, expiry_date=datetime.now()+timedelta(days=730)),
            InventoryItem(hospital_id=hospital.id, name="Surgical Masks", category="equipment", quantity=2000, min_threshold=100, unit_price=0.5, expiry_date=datetime.now()+timedelta(days=1000)),
        ]
        db.add_all(items)

        await db.commit()
        
        print("Database initialized successfully.")
        print("Super Admin: Manju / 1122")
        print("Hospital Admin: ADM1001 / admin123 (Node: 1001)")
        print("Doctor: DOC1001 / doc123 (Node: 1001)")
        print("Nurse: NRS1001 / nurse123 (Node: 1001)")
        print("Lab: LAB1001 / lab123 (Node: 1001)")

if __name__ == "__main__":
    asyncio.run(seed())
