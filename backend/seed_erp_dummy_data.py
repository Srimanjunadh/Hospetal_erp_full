import asyncio
import os
import random
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, update, text
from app.models.models import Hospital, User
from app.core.security import get_password_hash

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

LOCATIONS = ["Hyderabad", "Mumbai", "Delhi", "Bangalore", "Chennai"]
SPECIALIZATIONS = ["Cardiology", "Neurology", "Orthopedics", "Pediatrics", "General", "Oncology"]

async def seed_data():
    async with AsyncSessionLocal() as session:
        # Get all hospitals
        result = await session.execute(select(Hospital))
        hospitals = result.scalars().all()
        
        print(f"Found {len(hospitals)} hospitals to update.")
        
        for idx, h in enumerate(hospitals):
            # Update Hospital ERP fields
            h.location = random.choice(LOCATIONS)
            h.node_code = f"ND{1000 + h.id}"
            h.specialization = random.choice(SPECIALIZATIONS)
            h.subscription_status = "ACTIVE"
            h.total_revenue = round(random.uniform(10000.0, 500000.0), 2)
            
            # Check if admin exists
            if not h.admin_id:
                # Create a dummy admin user
                admin_username = f"admin_h{h.id}"
                admin_user = User(
                    username=admin_username,
                    role="hospital_admin",
                    name=f"Admin {h.name}",
                    email=f"admin@{h.name.lower().replace(' ', '')}.com",
                    phone="9999999999",
                    hashed_password=get_password_hash("password123"),
                    hospital_id=h.id
                )
                session.add(admin_user)
                await session.flush() # To get the admin_user.id
                
                h.admin_id = admin_user.id
                print(f"Created admin '{admin_username}' for '{h.name}'")

        await session.commit()
        print("Successfully populated dummy ERP data for hospitals!")

if __name__ == "__main__":
    asyncio.run(seed_data())
