import asyncio
import os
from dotenv import load_dotenv
load_dotenv('backend/.env')
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

DATABASE_URL = os.getenv('DATABASE_URL')
engine = create_async_engine(DATABASE_URL)

async def test():
    try:
        async with engine.begin() as conn:
            res = await conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'doctors'"))
            for row in res:
                print(row[0])
    except Exception as e:
        print("ERROR:", e)

asyncio.run(test())
