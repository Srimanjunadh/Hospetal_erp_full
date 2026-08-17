from fastapi import FastAPI
from app.modules.medical_records.controllers import router as medical_records_router
from app.shared.database.sync import sync_router
from app.shared.database.session import engine, Base
import uvicorn
import os

app = FastAPI(title="Medical Record Service", version="1.0.0")

@app.on_event("startup")
async def on_startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

app.include_router(sync_router)
app.include_router(medical_records_router, prefix="/api/clinical", tags=["Clinical"])
app.include_router(medical_records_router, prefix="/api/vitals", tags=["Vitals"])

@app.get("/health")
def health():
    return {"status": "healthy", "service": "medical_record"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8008"))
    uvicorn.run(app, host="0.0.0.0", port=port)
