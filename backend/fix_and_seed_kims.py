import asyncio
from sqlalchemy import text
from app.db.session import engine, Base
from app.models.models import * # Import all models to register them with Base.metadata

async def fix_and_seed():
    async with engine.begin() as conn:
        print("Dropping outdated tables...")
        await conn.execute(text("DROP TABLE IF EXISTS ambulance_requests"))
        await conn.execute(text("DROP TABLE IF EXISTS ward_beds")) # Recreate for good measure
        
        print("Recreating tables...")
        await conn.run_sync(Base.metadata.create_all)
    
    print("Schema fixed. Now running seed_kims_full.py...")
    # Import and run the seed function
    from seed_kims_full import seed_full
    await seed_full()

if __name__ == "__main__":
    asyncio.run(fix_and_seed())
