import asyncio
import os
from dotenv import load_dotenv

load_dotenv('backend/.env')

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

DATABASE_URL = os.getenv('DATABASE_URL')
engine = create_async_engine(DATABASE_URL)

async def check_doctors():
    try:
        async with engine.begin() as conn:
            # Check if doctor 2 exists
            res = await conn.execute(text("SELECT d.id, u.name FROM doctors d JOIN users u ON d.user_id = u.id"))
            docs = res.fetchall()
            print("Doctors in DB:")
            for d in docs:
                print(d)
    except Exception as e:
        print("ERROR:", e)

asyncio.run(check_doctors())
