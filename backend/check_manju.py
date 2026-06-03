import asyncio
from app.db.session import engine
from app.models.models import User, Prescription, LabTest, Admission
from sqlalchemy.future import select

async def check():
    async with engine.connect() as conn:
        res = await conn.execute(select(User).filter(User.name == 'Manju'))
        users = res.fetchall()
        for u in users:
            print(f"User: {u.username}, Name: {u.name}, ID: {u.id}")
            
            # Count records
            p = await conn.execute(select(Prescription).filter(Prescription.patient_id == u.id))
            t = await conn.execute(select(LabTest).filter(LabTest.patient_id == u.id))
            a = await conn.execute(select(Admission).filter(Admission.patient_id == u.id))
            
            print(f"  - Prescriptions: {len(p.fetchall())}")
            print(f"  - LabTests: {len(t.fetchall())}")
            print(f"  - Admissions: {len(a.fetchall())}")

if __name__ == "__main__":
    asyncio.run(check())
