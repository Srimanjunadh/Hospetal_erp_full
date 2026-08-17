from fastapi import FastAPI
from app.modules.inventory.controllers import router as inventory_router
from app.shared.database.sync import sync_router
from app.shared.database.session import engine, Base
import uvicorn
import os

app = FastAPI(title="Inventory Service", version="1.0.0")

@app.on_event("startup")
async def on_startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    try:
        from app.modules.inventory.services import InventoryService
        from app.shared.events.event_bus import EventBus
        await EventBus.subscribe(
            queue_name="inventory_purchase_approved_queue",
            routing_key="domain.purchase.approved",
            handler=InventoryService.handle_purchase_approved
        )
    except Exception:
        pass

app.include_router(sync_router)
app.include_router(inventory_router, prefix="/api/inventory", tags=["Inventory"])

@app.get("/health")
def health():
    return {"status": "healthy", "service": "inventory"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8011"))
    uvicorn.run(app, host="0.0.0.0", port=port)
