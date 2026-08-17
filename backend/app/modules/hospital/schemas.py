from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any, List

class HospitalBase(BaseModel):
    name: str
    location: str
    node_code: str
    specialization: Optional[str] = "Multi-Specialty"

class HospitalRegister(HospitalBase):
    admin_id: int
    organization_id: Optional[int] = None

class HospitalConfigUpdate(BaseModel):
    config_settings: Dict[str, Any]

class BedCreate(BaseModel):
    hospital_id: int
    floor: str
    room_number: str
    bed_number: str
    dept: Optional[str] = "GENERAL"

class RoomCreate(BaseModel):
    hospital_id: int
    room_number: str
    room_type: str # ICU, GENERAL, SUITE, PRIVATE
    floor: str

class RoomResponse(BaseModel):
    id: int
    hospital_id: int
    room_number: str
    room_type: str
    floor: str
    status: str

    class Config:
        from_attributes = True

class OTCreate(BaseModel):
    hospital_id: int
    name: str

class OTResponse(BaseModel):
    id: int
    hospital_id: int
    name: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class FacilityCreate(BaseModel):
    hospital_id: int
    name: str
    category: str # DIAGNOSTIC, LIFE_SUPPORT, IMAGING

class FacilityResponse(BaseModel):
    id: int
    hospital_id: int
    name: str
    category: str
    status: str

    class Config:
        from_attributes = True
