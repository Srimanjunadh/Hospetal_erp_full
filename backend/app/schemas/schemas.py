from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import List, Optional, Any

class UserBase(BaseModel):
    username: str
    email: Optional[str] = None
    name: str
    role: str
    phone: Optional[str] = None
    cleartext_password: Optional[str] = None
    assigned_doctor_id: Optional[int] = None
    assigned_nurse_id: Optional[int] = None
    age: Optional[int] = None
    location: Optional[str] = None
    weight: Optional[float] = None
    hospital_id: Optional[int] = None

class UserCreate(UserBase):
    password: str
    node_code: Optional[str] = None

class User(UserBase):
    id: int
    created_at: datetime
    assigned_doctor: Optional[Any] = None
    assigned_nurse: Optional[Any] = None

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True

class DoctorBase(BaseModel):
    specialization: str
    experience: int
    hospital_id: int
    room_number: Optional[str] = None
    status: str = "on-duty"

class DoctorCreate(DoctorBase):
    user_id: int

class Doctor(DoctorBase):
    id: int
    user: User

    class Config:
        from_attributes = True

class AppointmentBase(BaseModel):
    patient_id: int
    doctor_id: int
    hospital_id: int
    scheduled_at: Optional[datetime] = None
    preferred_time: Optional[str] = None
    reason: Optional[str] = None
    type: str

class AppointmentCreate(AppointmentBase):
    pass

class Appointment(AppointmentBase):
    id: int
    status: str

    class Config:
        from_attributes = True

class PrescriptionBase(BaseModel):
    patient_id: int
    doctor_id: int
    appointment_id: Optional[int] = None
    medicines: List[dict] # {name, dosage, duration}
    notes: Optional[str] = None
    status: str = "sent_to_pharmacy"

class Prescription(PrescriptionBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class HospitalBase(BaseModel):
    name: str
    location: str
    node_code: str # 4-digit unique
    subscription_status: str = "ACTIVE"
    subscription_expiry: datetime
    total_revenue: float = 0.0

class HospitalCreate(HospitalBase):
    admin_id: int

class Hospital(HospitalBase):
    id: int
    admin: User

    class Config:
        from_attributes = True

class InventoryItemBase(BaseModel):
    hospital_id: int
    name: str
    category: str
    quantity: int
    min_threshold: int
    unit_price: float
    expiry_date: Optional[datetime] = None

class InventoryItem(InventoryItemBase):
    id: int
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class PharmacyOrderBase(BaseModel):
    hospital_id: int
    patient_id: int
    prescription_id: Optional[int] = None
    medicines: List[dict]
    total_amount: float
    status: str = "pending"

class PharmacyOrder(PharmacyOrderBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class AdmissionBase(BaseModel):
    patient_id: int
    doctor_id: int
    hospital_id: int
    reason: str
    room_number: Optional[str] = None
    status: str = "requested"

class Admission(AdmissionBase):
    id: int
    admitted_at: datetime
    discharged_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class SystemAlertBase(BaseModel):
    hospital_id: int
    from_user_id: int
    to_user_id: Optional[int] = None
    to_role: Optional[str] = None
    message: str
    type: str # emergency, notification, task

class SystemAlert(SystemAlertBase):
    id: int
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class DoctorScheduleBase(BaseModel):
    doctor_id: int
    task_name: str
    start_time: datetime
    end_time: datetime
    status: str = "pending"
    notes: Optional[str] = None

class DoctorScheduleCreate(DoctorScheduleBase):
    pass

class DoctorSchedule(DoctorScheduleBase):
    id: int

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    name: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    assigned_nurse_id: Optional[int] = None
    age: Optional[int] = None
    location: Optional[str] = None
    weight: Optional[float] = None

class StaffScheduleBase(BaseModel):
    staff_id: int
    task_name: str
    start_time: datetime
    end_time: datetime
    status: str = "pending"
    notes: Optional[str] = None

class StaffScheduleCreate(StaffScheduleBase):
    pass

class StaffSchedule(StaffScheduleBase):
    id: int

    class Config:
        from_attributes = True

class AmbulanceCreate(BaseModel):
    hospital_id: int
    vehicle_number: str
    driver_name: str
    driver_phone: Optional[str] = None
    vehicle_size: Optional[str] = "MEDIUM"
    status: str = "READY"
    location: str = "BASE"

