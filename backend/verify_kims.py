import asyncio
from app.db.session import AsyncSessionLocal
from app.models.models import Hospital, User
from sqlalchemy import select

async def verify():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Hospital))
        hospitals = result.scalars().all()
        
        print(f"{'ID':<5} | {'Name':<30} | {'Node':<10} | {'Admin User':<15}")
        print("-" * 65)
        for h in hospitals:
            admin_username = "N/A"
            if h.admin_id:
                admin_res = await db.execute(select(User).where(User.id == h.admin_id))
                admin = admin_res.scalar_one_or_none()
                if admin:
                    admin_username = admin.username
            print(f"{h.id:<5} | {h.name:<30} | {h.node_code:<10} | {admin_username:<15}")

if __name__ == "__main__":
    asyncio.run(verify())
