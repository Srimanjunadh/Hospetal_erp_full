from fastapi import FastAPI
from app.modules.analytics.controllers import router as analytics_router
from app.shared.database.sync import sync_router
from app.shared.database.session import engine, Base
import uvicorn
import os

app = FastAPI(title="Analytics Service", version="1.0.0")

@app.on_event("startup")
async def on_startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

app.include_router(sync_router)
app.include_router(analytics_router, prefix="/api/ai", tags=["Analytics"])

@app.get("/health")
def health():
    return {"status": "healthy", "service": "analytics"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8014"))
    uvicorn.run(app, host="0.0.0.0", port=port)
