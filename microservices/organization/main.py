from fastapi import FastAPI
from app.modules.organization.controllers import router as organization_router
from app.shared.database.sync import sync_router
from app.shared.database.session import engine, Base
import uvicorn
import os

app = FastAPI(title="Organization Service", version="1.0.0")

@app.on_event("startup")
async def on_startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

app.include_router(sync_router)
app.include_router(organization_router, prefix="/api/organization", tags=["Organization"])

@app.get("/health")
def health():
    return {"status": "healthy", "service": "organization"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8002"))
    uvicorn.run(app, host="0.0.0.0", port=port)
