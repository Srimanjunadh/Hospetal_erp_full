from fastapi import FastAPI
from app.modules.patient.controllers import router as patient_router
from app.shared.database.sync import sync_router
from app.shared.database.session import engine, Base
import uvicorn
import os

app = FastAPI(title="Patient Service", version="1.0.0")

@app.on_event("startup")
async def on_startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    try:
        from app.modules.patient.services import PatientService
        from app.shared.events.event_bus import EventBus
        await EventBus.subscribe(
            queue_name="patient_registered_queue",
            routing_key="domain.patient.registered",
            handler=PatientService.handle_patient_registered
        )
    except Exception:
        pass

app.include_router(sync_router)
app.include_router(patient_router, prefix="/api/patients", tags=["Patients"])

@app.get("/health")
def health():
    return {"status": "healthy", "service": "patient"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8006"))
    uvicorn.run(app, host="0.0.0.0", port=port)
