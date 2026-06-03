import asyncio
from app.db.session import engine, AsyncSessionLocal
from app.models.models import InventoryItem, Hospital
from sqlalchemy.future import select

async def seed():
    async with AsyncSessionLocal() as session:
        # Get all hospitals
        res = await session.execute(select(Hospital))
        hospitals = res.scalars().all()
        
        for h in hospitals:
            print(f"Seeding inventory for {h.name}...")
            items = [
                InventoryItem(hospital_id=h.id, name="PARACETAMOL", category="medicine", quantity=500, min_threshold=50, unit_price=2.5, power="500MG"),
                InventoryItem(hospital_id=h.id, name="AMOXICILLIN", category="medicine", quantity=120, min_threshold=20, unit_price=12.0, power="250MG"),
                InventoryItem(hospital_id=h.id, name="IBUPROFEN", category="medicine", quantity=200, min_threshold=30, unit_price=8.5, power="400MG"),
                InventoryItem(hospital_id=h.id, name="METFORMIN", category="medicine", quantity=300, min_threshold=50, unit_price=15.0, power="500MG"),
                InventoryItem(hospital_id=h.id, name="LIPITOR", category="medicine", quantity=80, min_threshold=10, unit_price=45.0, power="10MG"),
            ]
            session.add_all(items)
        
        await session.commit()
        print("Inventory seeded.")

if __name__ == "__main__":
    asyncio.run(seed())
