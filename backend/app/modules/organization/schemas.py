from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class OrganizationBase(BaseModel):
    name: str

class OrganizationCreate(OrganizationBase):
    pass

class OrganizationResponse(OrganizationBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class BranchCreate(BaseModel):
    hospital_id: int
    name: str
    location: str

class BranchResponse(BaseModel):
    id: int
    hospital_id: int
    name: str
    location: str
    created_at: datetime

    class Config:
        from_attributes = True

class DepartmentCreate(BaseModel):
    hospital_id: int
    branch_id: Optional[int] = None
    name: str

class DepartmentResponse(BaseModel):
    id: int
    hospital_id: int
    branch_id: Optional[int]
    name: str
    created_at: datetime

    class Config:
        from_attributes = True

class SettingsUpdate(BaseModel):
    theme_color: Optional[str] = None
    logo_url: Optional[str] = None
    default_language: Optional[str] = None

class SettingsResponse(BaseModel):
    id: int
    organization_id: int
    theme_color: str
    logo_url: Optional[str]
    default_language: str

    class Config:
        from_attributes = True

class PolicyCreate(BaseModel):
    title: str
    content: str

class PolicyResponse(BaseModel):
    id: int
    organization_id: int
    title: str
    content: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
