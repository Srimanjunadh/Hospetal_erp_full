from fastapi import FastAPI
from app.modules.appointment.controllers import router as appointment_router
from app.shared.database.sync import sync_router
from app.shared.database.session import engine, Base
import uvicorn
import os

app = FastAPI(title="Appointment Service", version="1.0.0")

@app.on_event("startup")
async def on_startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

app.include_router(sync_router)
app.include_router(appointment_router, prefix="/api/appointments", tags=["Appointments"])

@app.get("/health")
def health():
    return {"status": "healthy", "service": "appointment"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8007"))
    uvicorn.run(app, host="0.0.0.0", port=port)
