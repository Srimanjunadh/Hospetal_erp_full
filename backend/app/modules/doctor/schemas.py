"""
Doctor Module Validation Schemas
Defines schemas for Doctor profiles, scheduling, and appointment updates.
"""
from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional, List

class DoctorBase(BaseModel):
    specialization: str = Field(..., description="Specialization of the doctor (e.g. Cardiology, Pediatrics)")
    experience: int = Field(..., description="Years of professional experience")
    hospital_id: int = Field(..., description="Associated hospital ID")
    room_number: str = Field(..., description="Assigned consultation room number")
    status: str = Field("on-duty", description="Availability status, e.g. on-duty, off-duty")

    @field_validator("experience")
    @classmethod
    def validate_experience(cls, v: int) -> int:
        if v < 0:
            raise ValueError("Experience cannot be negative")
        return v

class DoctorCreate(DoctorBase):
    user_id: int = Field(..., description="User account ID associated with this doctor profile")

class DoctorScheduleBase(BaseModel):
    doctor_id: int = Field(..., description="ID of the doctor associated with this schedule")
    task_name: str = Field(..., description="Name of the task or appointment description")
    start_time: datetime = Field(..., description="Task start ISO timestamp")
    end_time: datetime = Field(..., description="Task end ISO timestamp")
    status: str = Field("scheduled", description="Status of the task")
    notes: Optional[str] = Field(None, description="Optional consultation/shift notes")

    @field_validator("end_time")
    @classmethod
    def validate_time_range(cls, v: datetime, info) -> datetime:
        if "start_time" in info.data and v < info.data["start_time"]:
            raise ValueError("end_time cannot be before start_time")
        return v

class DoctorScheduleCreate(DoctorScheduleBase):
    pass

class DoctorSchedule(DoctorScheduleBase):
    id: int = Field(..., description="Unique schedule database ID")

    class Config:
        from_attributes = True

class DoctorAppointmentUpdate(BaseModel):
    """Schema for a doctor updating an appointment's schedule or status."""
    status: Optional[str] = Field(None, description="Update status, e.g. scheduled, completed, cancelled")
    scheduled_at: Optional[str] = Field(None, description="ISO formatted string of scheduled time")

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            valid_statuses = {"pending", "scheduled", "completed", "cancelled", "admin_approved", "time_over"}
            if v not in valid_statuses:
                raise ValueError(f"Invalid status. Must be one of: {', '.join(valid_statuses)}")
        return v
