import asyncio
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.db.session import AsyncSessionLocal as async_session
from app.models.models import Appointment

async def test_doctor_appointments():
    async with async_session() as db:
        try:
            # Check for doctor 1
            result = await db.execute(
                select(Appointment)
                .filter(Appointment.doctor_id == 1)
                .options(selectinload(Appointment.patient))
            )
            appts = result.scalars().all()
            print(f"Found {len(appts)} appointments for doctor 1")
            for a in appts:
                print(f"Appt ID: {a.id}, Patient: {a.patient.name}, Status: {a.status}")
        except Exception as e:
            print(f"Error: {str(e)}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_doctor_appointments())
