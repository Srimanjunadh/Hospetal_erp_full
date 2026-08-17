from fastapi import FastAPI
from app.modules.finance.controllers import router as finance_router
from app.shared.database.sync import sync_router
from app.shared.database.session import engine, Base
import uvicorn
import os

app = FastAPI(title="Finance Service", version="1.0.0")

@app.on_event("startup")
async def on_startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    try:
        from app.modules.finance.services import FinanceService
        from app.shared.events.event_bus import EventBus
        await EventBus.subscribe(
            queue_name="finance_invoice_generated_queue",
            routing_key="domain.invoice.generated",
            handler=FinanceService.handle_invoice_generated
        )
        await EventBus.subscribe(
            queue_name="finance_purchase_approved_queue",
            routing_key="domain.purchase.approved",
            handler=FinanceService.handle_purchase_approved
        )
    except Exception:
        pass

app.include_router(sync_router)
# Include finance_router under /api/billing as it matches path mappings
app.include_router(finance_router, prefix="/api/billing", tags=["Finance"])

@app.get("/health")
def health():
    return {"status": "healthy", "service": "finance"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8010"))
    uvicorn.run(app, host="0.0.0.0", port=port)
