import asyncio
from app.db.session import engine, Base
from app.models.models import User, Hospital, WardBed, Ambulance
from sqlalchemy import text

async def update_schema():
    async with engine.begin() as conn:
        print("Dropping tables for facility update...")
        await conn.execute(text("DROP TABLE IF EXISTS ward_beds"))
        await conn.execute(text("DROP TABLE IF EXISTS ambulances"))
        
        print("Recreating tables...")
        await conn.run_sync(Base.metadata.create_all)
        
    # Seed some data using session
    from sqlalchemy.ext.asyncio import AsyncSession
    from sqlalchemy.orm import sessionmaker
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        print("Seeding facility data...")
        from sqlalchemy.future import select
        result = await session.execute(select(Hospital))
        hospitals = result.scalars().all()
        
        for hospital in hospitals:
            print(f"Seeding for {hospital.name} (ID: {hospital.id})...")
            # Seed Beds
            beds = [
                WardBed(hospital_id=hospital.id, floor="1", room_number="101", bed_number="A", dept="GENERAL", o2_lvl="98%", status="occupied"),
                WardBed(hospital_id=hospital.id, floor="1", room_number="101", bed_number="B", dept="GENERAL", o2_lvl="95%", status="available"),
                WardBed(hospital_id=hospital.id, floor="2", room_number="205", bed_number="1", dept="ICU", o2_lvl="92%", status="occupied"),
                WardBed(hospital_id=hospital.id, floor="3", room_number="310", bed_number="S", dept="VIP", o2_lvl="99%", status="available"),
                WardBed(hospital_id=hospital.id, floor="1", room_number="102", bed_number="A", dept="GENERAL", o2_lvl="97%", status="available"),
            ]
            session.add_all(beds)
            
            # Seed Ambulances
            ambulances = [
                Ambulance(hospital_id=hospital.id, vehicle_number=f"AMB-{hospital.id}-001", driver_name="John Doe", driver_phone="+91 98765 43210", vehicle_size="MEDIUM", status="READY", location="Hospital Base"),
                Ambulance(hospital_id=hospital.id, vehicle_number=f"AMB-{hospital.id}-002", driver_name="Jane Smith", driver_phone="+91 98765 43211", vehicle_size="LARGE", status="ENGAGED", location="Downtown"),
                Ambulance(hospital_id=hospital.id, vehicle_number=f"AMB-{hospital.id}-003", driver_name="Mike Ross", driver_phone="+91 98765 43212", vehicle_size="SMALL", status="READY", location="North Wing"),
            ]
            session.add_all(ambulances)
            
        await session.commit()
        print("Facility data seeded for all hospitals.")
            
    print("Facility schema and data updated successfully")

if __name__ == "__main__":
    asyncio.run(update_schema())
