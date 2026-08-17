"""
Appointment Module Validation Schemas
Defines request schemas for booking, updating, and syncing appointments.
"""
from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional
import re

class AppointmentBase(BaseModel):
    patient_id: int = Field(..., description="Unique database ID of the patient")
    doctor_id: int = Field(..., description="Unique database ID of the doctor")
    hospital_id: int = Field(..., description="Unique database ID of the hospital")
    scheduled_at: Optional[datetime] = Field(None, description="ISO timestamp of scheduled consultation time")
    preferred_time: Optional[str] = Field(None, description="Preferred time slot description (e.g. 10:00 AM)")
    reason: Optional[str] = Field(None, description="Consultation symptoms or reason")
    type: str = Field("offline", description="Consultation type, either online or offline")

    @field_validator("preferred_time")
    @classmethod
    def validate_time_format(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v != "":
            # Basic validation check for common patterns: "10:00 AM", "14:30", "9:00 PM"
            pattern = r"^\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?$"
            if not re.match(pattern, v.strip()):
                raise ValueError("preferred_time must match format 'HH:MM' or 'HH:MM AM/PM'")
        return v

class AppointmentCreate(AppointmentBase):
    pass

class AppointmentUpdateDetails(BaseModel):
    doctor_id: Optional[int] = Field(None, description="Assign to a different doctor")
    scheduled_at: Optional[str] = Field(None, description="ISO formatted string of scheduled time")
    preferred_time: Optional[str] = Field(None, description="Preferred slot timing")
    status: Optional[str] = Field(None, description="Updated status string (e.g. pending, scheduled, completed, cancelled)")

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            valid_statuses = {"pending", "scheduled", "completed", "cancelled", "admin_approved", "time_over"}
            if v not in valid_statuses:
                raise ValueError(f"Invalid status. Must be one of: {', '.join(valid_statuses)}")
        return v

class AppointmentSyncPMS(BaseModel):
    hospital_id: int = Field(..., description="ERP Hospital ID mapping")
    preferred_time: Optional[str] = Field(None, description="Slot preferred time")
    reason: Optional[str] = Field(None, description="Symptoms/reason for appointment")
    doctor_name: Optional[str] = Field(None, description="Name of the PMS doctor")
    patient_name: Optional[str] = Field(None, description="Name of the PMS patient")
    pms_hospital_id: Optional[int] = Field(None, description="Legacy PMS Hospital ID mapping")
    patient_id: Optional[int] = Field(1, description="ERP Patient ID mapping")
    doctor_id: Optional[int] = Field(1, description="ERP Doctor ID mapping")
    status: Optional[str] = Field("scheduled", description="Default initial synced status")
    type: Optional[str] = Field("offline", description="Online/offline mode")
    token_number: Optional[int] = Field(0, description="Scheduled token queue number")
    queue_position: Optional[int] = Field(0, description="Current queue offset number")
    scheduled_at: Optional[str] = Field(None, description="ISO formatted date or YYYY-MM-DD")
