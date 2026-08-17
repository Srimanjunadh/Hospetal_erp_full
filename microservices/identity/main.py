from fastapi import FastAPI
from app.modules.identity.controllers import router as identity_router
from app.shared.database.sync import sync_router
from app.shared.database.session import engine, Base
import uvicorn
import os

app = FastAPI(title="Identity Service", version="1.0.0")

# Database initialization on startup
@app.on_event("startup")
async def on_startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    try:
        from app.modules.identity.services import IdentityService
        from app.shared.events.event_bus import EventBus
        await EventBus.subscribe(
            queue_name="identity_employee_created_queue",
            routing_key="domain.employee.created",
            handler=IdentityService.handle_employee_created
        )
    except Exception:
        pass

app.include_router(sync_router)
app.include_router(identity_router, prefix="/api/auth", tags=["Auth"])
app.include_router(identity_router, prefix="/api/users", tags=["Users"])

@app.get("/health")
def health():
    return {"status": "healthy", "service": "identity"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8001"))
    uvicorn.run(app, host="0.0.0.0", port=port)
