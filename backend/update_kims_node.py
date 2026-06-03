import asyncio
from sqlalchemy import select, update
from app.db.session import AsyncSessionLocal
from app.models.models import Hospital

async def update_kims_node():
    async with AsyncSessionLocal() as session:
        # Find KIMS hospital
        result = await session.execute(select(Hospital).where(Hospital.name == "KIMS Hospital"))
        hospital = result.scalar_one_or_none()
        
        if hospital:
            print(f"Current Node Code for KIMS: {hospital.node_code}")
            # Update to a 4-digit number
            new_code = "5500"
            hospital.node_code = new_code
            await session.commit()
            print(f"Successfully updated KIMS Node ID to: {new_code}")
        else:
            print("KIMS Hospital not found.")

if __name__ == "__main__":
    asyncio.run(update_kims_node())
