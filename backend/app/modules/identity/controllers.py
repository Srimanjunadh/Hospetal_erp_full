from fastapi import APIRouter, Depends, BackgroundTasks, Query, Request, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.db.session import get_db
from app.core.security import SECRET_KEY, ALGORITHM
from app.modules.identity.schemas import (
    Token, UserCreate, DoctorRegister, HospitalRegister, LoginRequest,
    TokenRefreshRequest, ForgotPasswordRequest, ResetPasswordRequest, VerifyEmailRequest,
    AuditLogResponse, SessionResponse
)
from app.modules.identity.services import IdentityService
from app.modules.identity.config import ROLE_PERMISSIONS
from app.schemas.schemas import User as UserSchema, UserUpdate
from typing import List, Optional

router = APIRouter()
security_scheme = HTTPBearer()

# --- AUTHORIZATION DEPENDENCIES ---
async def get_current_user_claims(credentials: HTTPAuthorizationCredentials = Depends(security_scheme)) -> dict:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired access token")

def require_permissions(required_permissions: List[str]):
    async def dependency(claims: dict = Depends(get_current_user_claims)):
        role = claims.get("role")
        permissions = ROLE_PERMISSIONS.get(role, [])
        if "*" in permissions:
            return claims
        for perm in required_permissions:
            if perm not in permissions:
                raise HTTPException(status_code=403, detail="Forbidden: Insufficient privilege permissions")
        return claims
    return dependency

# --- ENDPOINTS ---

@router.get("/admins")
async def list_admins(db: AsyncSession = Depends(get_db)):
    return await IdentityService.list_admins(db)

@router.post("/register/hospital", response_model=Token)
async def register_hospital(
    data: HospitalRegister, 
    background_tasks: BackgroundTasks, 
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    ip = request.client.host if request.client else None
    ua = request.headers.get("user-agent")
    return await IdentityService.register_hospital(data, background_tasks, db, ip, ua)

@router.post("/register", response_model=Token)
async def register(
    user_data: UserCreate, 
    background_tasks: BackgroundTasks, 
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    ip = request.client.host if request.client else None
    ua = request.headers.get("user-agent")
    return await IdentityService.register_user(user_data, background_tasks, db, ip, ua)

@router.post("/register/doctor", response_model=Token)
async def register_doctor(
    doctor_data: DoctorRegister, 
    background_tasks: BackgroundTasks, 
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    ip = request.client.host if request.client else None
    ua = request.headers.get("user-agent")
    return await IdentityService.register_doctor(doctor_data, background_tasks, db, ip, ua)

@router.post("/login", response_model=Token)
async def login(
    req: LoginRequest, 
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    ip = request.client.host if request.client else None
    ua = request.headers.get("user-agent")
    return await IdentityService.login(req, db, ip, ua)

@router.post("/refresh", response_model=Token)
async def refresh_token(
    req: TokenRefreshRequest, 
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    ip = request.client.host if request.client else None
    ua = request.headers.get("user-agent")
    return await IdentityService.refresh_token(db, req.refresh_token, ip, ua)

@router.post("/logout")
async def logout(
    req: TokenRefreshRequest, 
    request: Request,
    claims: dict = Depends(get_current_user_claims),
    db: AsyncSession = Depends(get_db)
):
    ip = request.client.host if request.client else None
    ua = request.headers.get("user-agent")
    user_id = claims.get("id") or 999  # Fallback for mock/master claims
    # Extract user id from db lookup if missing
    if user_id == 999:
        from sqlalchemy.future import select
        from app.shared.database.models import User
        user_obj = await db.execute(
            select(User).filter(User.username == claims.get("sub"))
        )
        found = user_obj.scalars().first()
        user_id = found.id if found else 999

        
    return await IdentityService.logout(db, req.refresh_token, user_id, ip, ua)

@router.get("/sessions", response_model=List[SessionResponse])
async def list_sessions(
    claims: dict = Depends(get_current_user_claims),
    db: AsyncSession = Depends(get_db)
):
    from sqlalchemy.future import select
    from app.shared.database.models import User
    res = await db.execute(select(User).filter(User.username == claims.get("sub")))
    user = res.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return await IdentityService.list_active_sessions(db, user.id)

@router.delete("/sessions/{session_id}")
async def revoke_session(
    session_id: int,
    request: Request,
    claims: dict = Depends(get_current_user_claims),
    db: AsyncSession = Depends(get_db)
):
    from sqlalchemy.future import select
    from app.shared.database.models import User
    res = await db.execute(select(User).filter(User.username == claims.get("sub")))
    user = res.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    ip = request.client.host if request.client else None
    ua = request.headers.get("user-agent")
    return await IdentityService.revoke_session(db, session_id, user.id, ip, ua)

@router.post("/forgot-password")
async def forgot_password(
    data: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    ip = request.client.host if request.client else None
    ua = request.headers.get("user-agent")
    return await IdentityService.forgot_password(db, data.email, background_tasks, ip, ua)

@router.post("/reset-password")
async def reset_password(
    data: ResetPasswordRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    ip = request.client.host if request.client else None
    ua = request.headers.get("user-agent")
    return await IdentityService.reset_password(db, data.token, data.new_password, ip, ua)

@router.post("/verify-email")
async def verify_email(
    data: VerifyEmailRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    ip = request.client.host if request.client else None
    ua = request.headers.get("user-agent")
    return await IdentityService.verify_email(db, data.token, ip, ua)

@router.post("/resend-verification")
async def resend_verification(
    request: Request,
    email: str = Query(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: AsyncSession = Depends(get_db)
):
    ip = request.client.host if request.client else None

    ua = request.headers.get("user-agent")
    return await IdentityService.resend_verification(db, email, background_tasks, ip, ua)

@router.get("/audit-logs", response_model=List[AuditLogResponse])
async def get_audit_logs(
    limit: int = Query(50),
    offset: int = Query(0),
    user_id: Optional[int] = Query(None),
    action: Optional[str] = Query(None),
    claims: dict = Depends(require_permissions(["*"])),
    db: AsyncSession = Depends(get_db)
):
    return await IdentityService.get_audit_logs(db, limit, offset, user_id, action)

# --- USER DIRECTORY FALLBACKS ---

@router.get("/users", response_model=List[UserSchema])
@router.get("", response_model=List[UserSchema])
@router.get("/", response_model=List[UserSchema])
async def list_users(
    role: Optional[str] = Query(None),
    hospital_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    return await IdentityService.list_users(db, role, hospital_id)

@router.get("/users/{user_id}", response_model=UserSchema)
@router.get("/{user_id}", response_model=UserSchema)
async def get_user(user_id: int, db: AsyncSession = Depends(get_db)):
    return await IdentityService.get_user(db, user_id)

@router.delete("/users/{user_id}")
@router.delete("/{user_id}")
async def delete_user(
    user_id: int, 
    claims: dict = Depends(require_permissions(["*"])),
    db: AsyncSession = Depends(get_db)
):
    return await IdentityService.delete_user(db, user_id)

@router.put("/users/{user_id}", response_model=UserSchema)
@router.put("/{user_id}", response_model=UserSchema)
async def update_user(user_id: int, user_data: UserUpdate, db: AsyncSession = Depends(get_db)):
    return await IdentityService.update_user(db, user_id, user_data)
