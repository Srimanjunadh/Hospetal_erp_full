import asyncio
from app.db.session import engine
from sqlalchemy import text

async def update():
    async with engine.begin() as conn:
        print("Adding 'power' column to inventory table...")
        try:
            await conn.execute(text("ALTER TABLE inventory ADD COLUMN power TEXT"))
            print("Column added successfully.")
        except Exception as e:
            if "duplicate column name" in str(e).lower():
                print("Column already exists.")
            else:
                print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(update())
