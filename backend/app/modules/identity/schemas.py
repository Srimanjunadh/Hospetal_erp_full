from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

class Token(BaseModel):
    access_token: str
    token_type: str
    refresh_token: str
    user: dict

class UserCreate(BaseModel):
    username: Optional[str] = None
    password: str
    name: str
    role: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    assigned_doctor_id: Optional[int] = None
    assigned_nurse_id: Optional[int] = None
    node_code: Optional[str] = None
    location: Optional[str] = None
    age: Optional[int] = None
    weight: Optional[float] = None
    hospital_id: Optional[int] = None

class DoctorRegister(BaseModel):
    username: str
    password: str
    name: str
    specialization: str
    phone: str
    room_number: str
    node_code: str

class HospitalRegister(BaseModel):
    name: str
    location: str
    node_code: str
    admin_name: str
    admin_username: str
    admin_password: str
    specialization: Optional[str] = "Multi-Specialty"

class LoginRequest(BaseModel):
    username: str
    password: str
    role: Optional[str] = None
    node_code: Optional[str] = None
    nurse_id: Optional[str] = None

# Identity Platform Schemas
class TokenRefreshRequest(BaseModel):
    refresh_token: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class VerifyEmailRequest(BaseModel):
    token: str

class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int]
    action: str
    ip_address: Optional[str]
    user_agent: Optional[str]
    timestamp: datetime
    details: Optional[Dict[str, Any]]

    class Config:
        from_attributes = True

class SessionResponse(BaseModel):
    id: int
    created_at: datetime
    expires_at: datetime
    is_active: bool
