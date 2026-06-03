import asyncio
from app.db.session import engine
from sqlalchemy import text

async def verify():
    async with engine.connect() as conn:
        print("--- PRESCRIPTIONS ---")
        res = await conn.execute(text("PRAGMA table_info(prescriptions)"))
        for row in res: print(row)
        
        print("--- PHARMACY_ORDERS ---")
        res = await conn.execute(text("PRAGMA table_info(pharmacy_orders)"))
        for row in res: print(row)

if __name__ == "__main__":
    asyncio.run(verify())
