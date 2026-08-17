from fastapi import FastAPI
from app.modules.notification.controllers import router as notification_router
from app.shared.database.sync import sync_router
from app.shared.database.session import engine, Base
import uvicorn
import os

app = FastAPI(title="Notification Service", version="1.0.0")

@app.on_event("startup")
async def on_startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    try:
        from app.modules.notification.services import NotificationService
        from app.shared.events.event_bus import EventBus
        await EventBus.subscribe(
            queue_name="notification_patient_registered_queue",
            routing_key="domain.patient.registered",
            handler=NotificationService.handle_patient_registered
        )
        await EventBus.subscribe(
            queue_name="notification_employee_created_queue",
            routing_key="domain.employee.created",
            handler=NotificationService.handle_employee_created
        )
        await EventBus.subscribe(
            queue_name="notification_appointment_booked_queue",
            routing_key="domain.appointment.booked",
            handler=NotificationService.handle_appointment_booked
        )
        await EventBus.subscribe(
            queue_name="notification_inventory_updated_queue",
            routing_key="domain.inventory.updated",
            handler=NotificationService.handle_inventory_updated
        )
    except Exception:
        pass

app.include_router(sync_router)
app.include_router(notification_router, prefix="/api/notifications", tags=["Notifications"])

@app.get("/health")
def health():
    return {"status": "healthy", "service": "notification"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8012"))
    uvicorn.run(app, host="0.0.0.0", port=port)
