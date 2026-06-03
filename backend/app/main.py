from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware # Trigger Reload
from app.api.routes import router
from app.modules import clinical_nodes

app = FastAPI(
    title="MediClues+ ERP",
    description="Comprehensive Healthcare ERP System",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    import traceback
    print(f"GLOBAL ERROR: {str(exc)}")
    traceback.print_exc()
    response = JSONResponse(
        status_code=500,
        content={"detail": str(exc), "status": "error"}
    )
    # Explicitly add CORS headers for safety in exception handler
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response

@app.get("/")
async def root():
    return {"message": "Welcome to MediClues+ ERP API", "status": "running"}

from app.modules.pms.router import router as pms_router

app.include_router(clinical_nodes.router, prefix="/api/clinical", tags=["clinical"])
app.include_router(pms_router, prefix="/api", tags=["PMS Compatibility"])
app.include_router(router, prefix="/api")
