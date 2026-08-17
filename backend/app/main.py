from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware # Trigger Reload
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import time
import os
from collections import defaultdict
from app.api.routes import router
from app.modules import clinical_nodes

app = FastAPI(
    title="MediClues+ ERP",
    description="Comprehensive Healthcare ERP System",
    version="1.0.0"
)

# Create static directory for file uploads
os.makedirs("app/static/uploads", exist_ok=True)

from fastapi.staticfiles import StaticFiles
app.mount("/uploads", StaticFiles(directory="app/static/uploads"), name="uploads")

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, limit: int = 10, window: int = 60):
        super().__init__(app)
        self.limit = limit
        self.window = window
        self.requests = defaultdict(list)
        
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        if any(p in path for p in ["/auth/login", "/user/login", "/user/forgot-password", "/user/register", "/register/hospital"]):
            client_ip = request.client.host if request.client else "unknown"
            current_time = time.time()
            
            # Clean up old requests
            self.requests[client_ip] = [t for t in self.requests[client_ip] if current_time - t < self.window]
            
            if len(self.requests[client_ip]) >= self.limit:
                response = JSONResponse(
                    status_code=429,
                    content={"detail": "Too many requests. Please try again later."}
                )
                response.headers["Access-Control-Allow-Origin"] = request.headers.get("Origin", "*")
                response.headers["Access-Control-Allow-Credentials"] = "true"
                return response
                
            self.requests[client_ip].append(current_time)
            
        return await call_next(request)

app.add_middleware(RateLimitMiddleware, limit=int(os.getenv("RATE_LIMIT_MAX", "10")), window=int(os.getenv("RATE_LIMIT_WINDOW", "60")))

# Configure CORS
origins_env = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173,http://localhost:5174,http://localhost:5175")
allowed_origins = [origin.strip() for origin in origins_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    import traceback
    print(f"GLOBAL ERROR: {str(exc)}", flush=True)
    traceback.print_exc()
    import os
    response = JSONResponse(
        status_code=500,
        content={"detail": str(exc), "status": "error", "db_url": os.getenv("DATABASE_URL")}
    )
    # Explicitly add CORS headers for safety in exception handler
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response

@app.get("/")
async def root():
    return {"message": "Welcome to MediClues+ ERP API", "status": "running"}

@app.get("/test_doctors")
async def test_doctors():
    import psycopg2
    import os
    db_url = os.getenv("DATABASE_URL")
    if db_url.startswith("postgresql+asyncpg://"):
        db_url = db_url.replace("postgresql+asyncpg://", "postgresql://")
    conn = psycopg2.connect(db_url)
    cursor = conn.cursor()
    cursor.execute("SELECT count(*) FROM doctors")
    c = cursor.fetchone()
    conn.close()
    return {"count": c}

from app.modules.pms.router import router as pms_router

app.include_router(clinical_nodes.router, prefix="/api/clinical", tags=["clinical"])
app.include_router(pms_router, prefix="/api", tags=["PMS Compatibility"])
app.include_router(router, prefix="/api")
