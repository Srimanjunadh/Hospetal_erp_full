"""
MediClues+ API Gateway
Gateway layer handling versioned routing, JWT authentication decoding, rate limiting, logging, security headers, and Swagger documentation.
"""
from fastapi import FastAPI, Request, Response, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from jose import jwt, JWTError
from app.core.security import SECRET_KEY, ALGORITHM
from app.modules.pms.router import router as pms_router
from app.modules.clinical_nodes import router as clinical_router
from app.shared.database.sync import sync_router
import httpx
import os
import time
import logging
from collections import defaultdict
from typing import Optional, List, Dict, Any

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("gateway")

app = FastAPI(
    title="MediClues+ API Gateway",
    description="Primary entrypoint, routing versioned APIs, validating auth claims, enforcing security controls and rate limit rules.",
    version="1.0.0"
)

# Configure CORS
origins_env = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173,http://localhost:5174,http://localhost:5175")
allowed_origins = [origin.strip() for origin in origins_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if not allowed_origins else allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 1. Rate Limiting Middleware ---
class GatewayRateLimitMiddleware(BaseHTTPMiddleware):
    """
    Enforces IP-based rate limiting on all ingress gateway routes.
    Allows up to 100 requests per minute per IP address.
    """
    def __init__(self, app, limit: int = 100, window_secs: int = 60):
        super().__init__(app)
        self.limit = limit
        self.window = window_secs
        self.history = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        
        # Prune old timestamps
        self.history[client_ip] = [t for t in self.history[client_ip] if now - t < self.window]
        
        if len(self.history[client_ip]) >= self.limit:
            logger.warning(f"Rate limit exceeded for IP {client_ip}")
            response = JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={"detail": "Too many requests. Please slow down."}
            )
            return response
            
        self.history[client_ip].append(now)
        return await call_next(request)

app.add_middleware(GatewayRateLimitMiddleware, limit=100, window_secs=60)

# --- 2. Logging & Security Headers Middleware ---
class LoggingAndSecurityMiddleware(BaseHTTPMiddleware):
    """
    Applies security headers (CSP, HSTS, XSS) and logs request execution latency.
    """
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        response = await call_next(request)
        duration = (time.time() - start_time) * 1000.0
        
        # Log request summary
        logger.info(
            f"Client={request.client.host if request.client else 'unknown'} "
            f"Method={request.method} Path={request.url.path} "
            f"Status={response.status_code} Latency={duration:.2f}ms"
        )
        
        # Apply Security Headers
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "no-referrer-when-downgrade"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        return response

app.add_middleware(LoggingAndSecurityMiddleware)

# --- 3. Authentication & Routing Config ---
SERVICES_MAP = {
    "/api/auth": "http://identity-service:8001",
    "/api/users": "http://identity-service:8001",
    "/api/organization": "http://organization-service:8002",
    "/api/hospitals": "http://hospital-service:8003",
    "/api/hospital": "http://hospital-service:8003",
    "/api/hr": "http://hr-service:8004",
    "/api/doctors": "http://doctor-service:8005",
    "/api/patients": "http://patient-service:8006",
    "/api/appointments": "http://appointment-service:8007",
    "/api/clinical": "http://medical-record-service:8008",
    "/api/vitals": "http://medical-record-service:8008",
    "/api/inventory": "http://inventory-service:8011",
    "/api/notifications": "http://notification-service:8012",
    "/api/reports": "http://reporting-service:8013",
    "/api/ai": "http://analytics-service:8014",
}

PUBLIC_PATHS = [
    "/api/v1/auth/login",
    "/api/v1/auth/register",
    "/api/v1/users/login",
    "/api/v1/users/register",
    "/api/v1/hospital/register",
    "/api/v1/hospitals/register",
    "/api/auth/login",
    "/api/users/login",
    "/api/hospitals/register",
    "/health",
    "/docs",
    "/openapi.json"
]

RUNNING_IN_DOCKER = os.path.exists("/.dockerenv")

def get_target_url(path: str) -> Optional[str]:
    """
    Strips api version prefixes and maps request paths to microservice base URLs.
    Supports both /api/v1/path and /api/path formats.
    """
    # Clean version prefix for routing lookup
    routing_path = path
    if path.startswith("/api/v1"):
        routing_path = path.replace("/api/v1", "/api", 1)

    if routing_path.startswith("/api/billing/ledger") or routing_path.startswith("/api/billing/reports"):
        url = "http://finance-service:8010"
    elif routing_path.startswith("/api/billing"):
        url = "http://billing-service:8009"
    else:
        url = None
        for prefix, target in SERVICES_MAP.items():
            if routing_path.startswith(prefix):
                url = target
                break

    if url and not RUNNING_IN_DOCKER:
        url = url.replace("-service", "") \
                 .replace("http://identity", "http://127.0.0.1") \
                 .replace("http://organization", "http://127.0.0.1") \
                 .replace("http://hospital", "http://127.0.0.1") \
                 .replace("http://hr", "http://127.0.0.1") \
                 .replace("http://doctor", "http://127.0.0.1") \
                 .replace("http://patient", "http://127.0.0.1") \
                 .replace("http://appointment", "http://127.0.0.1") \
                 .replace("http://medical-record", "http://127.0.0.1") \
                 .replace("http://billing", "http://127.0.0.1") \
                 .replace("http://finance", "http://127.0.0.1") \
                 .replace("http://inventory", "http://127.0.0.1") \
                 .replace("http://notification", "http://127.0.0.1") \
                 .replace("http://reporting", "http://127.0.0.1") \
                 .replace("http://analytics", "http://127.0.0.1")
    return url

# Register sync and direct compatibility paths
app.include_router(sync_router)
app.include_router(clinical_router, prefix="/api/clinical", tags=["clinical"])
app.include_router(pms_router, prefix="/api", tags=["PMS Compatibility"])

# Register remaining legacy routers directly on Gateway for full compatibility
from app.api.ambulance import router as ambulance_router
from app.modules.specialized import router as specialized_router
from app.modules.procurement.controllers import router as procurement_router
from app.modules.asset.controllers import router as asset_router

app.include_router(ambulance_router, prefix="/api/ambulance", tags=["Legacy - Ambulance"])
app.include_router(specialized_router, prefix="/api/specialized", tags=["Legacy - Specialized Clinical Units"])
app.include_router(procurement_router, prefix="/api/procurement", tags=["Legacy - Procurement"])
app.include_router(asset_router, prefix="/api/assets", tags=["Legacy - Assets"])

client = httpx.AsyncClient()

@app.get("/health", tags=["Gateway Operations"])
async def health():
    """Returns Gateway operational status."""
    return {"status": "healthy", "service": "gateway"}

@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"], tags=["Microservices Proxy"])
async def gateway_ingress(request: Request, path: str):
    """
    Main proxy routing pipeline.
    Validates auth headers on protected endpoints, decodes user claims,
    and forwards request details downstream to target microservice.
    """
    full_path = request.url.path
    
    # 1. Check Rate Limit and Path Mapping
    target_host = get_target_url(full_path)
    if not target_host:
        return JSONResponse(status_code=404, content={"detail": f"Path '{full_path}' not mapped on Gateway"})
        
    # 2. Gateway Authentication Checks
    user_headers = {}
    is_public = any(p in full_path for p in PUBLIC_PATHS) or "forgot-password" in full_path or "reset-password" in full_path
    
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            # Inject identity claims to backend services headers
            user_headers = {
                "X-User-Id": str(payload.get("id", "")),
                "X-User-Role": str(payload.get("role", "")),
                "X-User-Username": str(payload.get("sub", "")),
                "X-User-Email": str(payload.get("email", ""))
            }
        except JWTError:
            if not is_public:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid or expired access token"
                )
    elif not is_public:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header token missing"
        )

    # 3. Strip version prefix if /api/v1 was requested
    downstream_path = full_path
    if full_path.startswith("/api/v1"):
        downstream_path = full_path.replace("/api/v1", "/api", 1)
        
    url = f"{target_host}{downstream_path}"
    if request.url.query:
        url = f"{url}?{request.url.query}"
        
    # Build proxy request headers
    req_headers = dict(request.headers)
    req_headers.pop("host", None)
    req_headers.update(user_headers)
    
    body = await request.body()
    
    try:
        response = await client.request(
            method=request.method,
            url=url,
            headers=req_headers,
            content=body,
            timeout=10.0
        )
        return Response(
            content=response.content,
            status_code=response.status_code,
            headers=dict(response.headers)
        )
    except Exception as e:
        logger.error(f"Gateway failed proxy forward to {url}: {e}")
        return JSONResponse(status_code=502, content={"detail": "Bad Gateway downstream proxy request failure"})
