import asyncio
import sys
import os

# Add the current directory to sys.path to import app
sys.path.append(os.getcwd())

from app.db.session import engine, Base, AsyncSessionLocal
from app.models.models import User, Doctor, Hospital, Appointment
from sqlalchemy import select, inspect
from sqlalchemy.orm import joinedload

async def check_all():
    print("--- Database Check ---")
    try:
        async with engine.connect() as conn:
            tables = await conn.run_sync(lambda sync_conn: inspect(sync_conn).get_table_names())
            print(f"Tables found: {tables}")
            
        async with AsyncSessionLocal() as db:
            # Check users
            res = await db.execute(select(User))
            users = res.scalars().all()
            print(f"Users in DB: {len(users)}")
            for u in users:
                print(f"  - {u.username} ({u.role})")
                
            # Check hospital
            res = await db.execute(select(Hospital))
            hospitals = res.scalars().all()
            print(f"Hospitals in DB: {len(hospitals)}")
            
    except Exception as e:
        print(f"ERROR during DB check: {e}")

    print("\n--- Routes & Imports Check ---")
    try:
        from app.main import app
        print("FastAPI app imported successfully.")
        for route in app.routes:
            print(f"  - {route.path} {getattr(route, 'methods', '')}")
    except Exception as e:
        print(f"ERROR during App import: {e}")

if __name__ == "__main__":
    asyncio.run(check_all())
