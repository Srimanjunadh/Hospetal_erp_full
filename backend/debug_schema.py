import asyncio
from sqlalchemy import text
from app.db.session import engine

async def check_schema():
    async with engine.connect() as conn:
        tables = ["ambulance_requests", "nurse_medicine_requests", "blood_bank", "blood_requests", "surgical_schedules", "patient_risk_scores"]
        for table in tables:
            print(f"\n--- {table} ---")
            try:
                res = await conn.execute(text(f"PRAGMA table_info({table})"))
                for col in res.fetchall():
                    print(col)
            except Exception as e:
                print(f"Error checking {table}: {e}")

if __name__ == "__main__":
    asyncio.run(check_schema())
