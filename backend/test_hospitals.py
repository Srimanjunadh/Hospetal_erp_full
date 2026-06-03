import asyncio
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload
from sqlalchemy import func
from app.db.session import AsyncSessionLocal as async_session
from app.models.models import Hospital, Doctor, User

async def test_hospitals():
    async with async_session() as db:
        try:
            result = await db.execute(select(Hospital).options(joinedload(Hospital.admin)))
            hospitals = result.unique().scalars().all()
            print(f"Found {len(hospitals)} hospitals")
            
            output = []
            for h in hospitals:
                print(f"Processing hospital: {h.name}")
                # Count Doctors
                doc_res = await db.execute(
                    select(func.count(User.id))
                    .filter(User.hospital_id == h.id, User.role == "doctor")
                )
                doctor_count = doc_res.scalar() or 0
                print(f"Doctor count: {doctor_count}")
                
                # Count Patients
                pat_res = await db.execute(
                    select(func.count(User.id))
                    .filter(User.hospital_id == h.id, User.role == "patient")
                )
                patient_count = pat_res.scalar() or 0
                print(f"Patient count: {patient_count}")

                h_dict = {
                    "id": h.id,
                    "name": h.name,
                    "admin": None,
                    "doctor_count": doctor_count,
                    "patient_count": patient_count
                }
                
                if h.admin:
                    print(f"Admin found: {h.admin.name}")
                    h_dict["admin"] = {
                        "id": h.admin.id,
                        "name": h.admin.name
                    }
                
                output.append(h_dict)
            print("Success!")
        except Exception as e:
            print(f"Error: {str(e)}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_hospitals())
