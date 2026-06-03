import asyncio
from app.db.session import AsyncSessionLocal
from app.models.models import User
from app.core.security import get_password_hash

async def seed_nurses():
    db = AsyncSessionLocal()
    nurses = [
        {"username": "NUR-2026-01", "name": "ALICE JOHNSON", "password": "nurse_alice_77"},
        {"username": "NUR-2026-02", "name": "BOB WILSON", "password": "bob_care_99"},
        {"username": "NUR-2026-03", "name": "CHARLIE BROWN", "password": "charlie_med_01"},
        {"username": "NUR-2026-04", "name": "DAISY MILLER", "password": "daisy_flwr_22"},
        {"username": "NUR-2026-05", "name": "ETHAN HUNT", "password": "mission_nurse"},
        {"username": "NUR-2026-06", "name": "FIONA GALLAGHER", "password": "fiona_southside"},
        {"username": "NUR-2026-07", "name": "GEORGE CONSTANZA", "password": "vandelay_med"},
        {"username": "NUR-2026-08", "name": "HANNAH MONTANA", "password": "best_of_both"},
        {"username": "NUR-2026-09", "name": "IAN MCKELLEN", "password": "gandalf_nurse"},
        {"username": "NUR-2026-10", "name": "JENNA ORTEGA", "password": "wednesday_med"},
    ]
    
    for n in nurses:
        # Check if exists
        from sqlalchemy import select
        result = await db.execute(select(User).filter(User.username == n["username"]))
        if result.scalars().first():
            continue
            
        user = User(
            username=n["username"],
            name=n["name"],
            role="nurse",
            hashed_password=get_password_hash(n["password"]),
            cleartext_password=n["password"]
        )
        db.add(user)
    
    await db.commit()
    print("10 Nurses seeded successfully.")

if __name__ == "__main__":
    asyncio.run(seed_nurses())
