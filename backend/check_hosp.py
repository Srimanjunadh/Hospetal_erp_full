import asyncio
from app.db.session import engine
from app.models.models import User
from sqlalchemy.future import select

async def check():
    async with engine.connect() as conn:
        res = await conn.execute(select(User).filter(User.role == 'patient'))
        users = res.fetchall()
        for u in users:
            print(f"User: {u.username}, Name: {u.name}, ID: {u.id}")

if __name__ == "__main__":
    asyncio.run(check())
