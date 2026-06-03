import asyncio
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.models import User

async def check():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(User).where(User.username == 'KIMS_LAB'))
        u = res.scalar_one_or_none()
        if u:
            print(f"Username: {u.username}")
            print(f"Role: {u.role}")
            print(f"Hospital ID: {u.hospital_id}")
        else:
            print("User KIMS_LAB not found")

if __name__ == "__main__":
    asyncio.run(check())
