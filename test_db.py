import asyncio
import os
from dotenv import load_dotenv
load_dotenv('backend/.env')
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

DATABASE_URL = os.getenv('DATABASE_URL')
print("Connecting to:", DATABASE_URL)

engine = create_async_engine(DATABASE_URL)

async def test():
    try:
        async with engine.begin() as conn:
            res = await conn.execute(text("SELECT id, name FROM hospitals LIMIT 5"))
            for row in res:
                print(row)
            print("SUCCESS")
    except Exception as e:
        print("ERROR:", e)

asyncio.run(test())
