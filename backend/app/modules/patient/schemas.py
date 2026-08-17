"""
Patient Module Validation Schemas
Defines request and response schemas for patient-related actions with strict validations.
"""
from pydantic import BaseModel, Field, EmailStr
from datetime import datetime
from typing import Optional, List, Dict, Any

class PatientInfo(BaseModel):
    """Schema representing complete patient details."""
    id: int = Field(..., description="Unique internal database ID of the user/patient")
    username: str = Field(..., description="Unique alphanumeric username")
    name: str = Field(..., description="Full name of the patient")
    role: str = Field("patient", description="System role identifier, always 'patient' for patients")
    phone: Optional[str] = Field(None, description="Contact phone number")
    email: Optional[EmailStr] = Field(None, description="Valid email address")
    age: Optional[int] = Field(None, ge=0, le=150, description="Age of the patient in years (must be between 0 and 150)")
    location: Optional[str] = Field(None, description="Residential location or address of the patient")
    weight: Optional[float] = Field(None, ge=0.0, le=500.0, description="Weight in kilograms (must be between 0.0 and 500.0)")
    hospital_id: Optional[int] = Field(None, description="Associated hospital ID")
    assigned_doctor_id: Optional[int] = Field(None, description="Primary doctor assigned to the patient")
    assigned_nurse_id: Optional[int] = Field(None, description="Nurse assigned to track patient vitals")
    created_at: Optional[datetime] = Field(None, description="Profile creation timestamp")

    class Config:
        from_attributes = True

class PatientUpdate(BaseModel):
    """Schema for updating patient profiles."""
    name: Optional[str] = Field(None, min_length=1, description="Full name of the patient")
    phone: Optional[str] = Field(None, description="Contact phone number")
    email: Optional[EmailStr] = Field(None, description="Valid email address")
    age: Optional[int] = Field(None, ge=0, le=150, description="Age of the patient in years")
    location: Optional[str] = Field(None, description="Residential location or address of the patient")
    weight: Optional[float] = Field(None, ge=0.0, le=500.0, description="Weight in kilograms")
    assigned_nurse_id: Optional[int] = Field(None, description="Assign a new nurse to the patient")

class PatientPrescriptionResponse(BaseModel):
    """Response schema for patient prescriptions."""
    id: int = Field(..., description="Unique prescription database ID")
    medicines: List[Dict[str, Any]] = Field(..., description="List of medicines containing dosage, frequency, etc.")
    notes: Optional[str] = Field(None, description="Additional prescription notes from the doctor")
    appointment_id: Optional[int] = Field(None, description="Associated appointment ID")

    class Config:
        from_attributes = True

class PatientAppointmentResponse(BaseModel):
    """Response schema for patient appointments."""
    id: int = Field(..., description="Unique appointment database ID")
    patient_id: int = Field(..., description="Database ID of the patient")
    doctor_id: int = Field(..., description="Database ID of the doctor")
    hospital_id: int = Field(..., description="Database ID of the hospital")
    status: str = Field(..., description="Status of the appointment (e.g., pending, scheduled, completed)")
    preferred_time: Optional[str] = Field(None, description="Preferred time slot of the appointment")
    reason: Optional[str] = Field(None, description="Reason or symptoms provided for booking")
    type: str = Field(..., description="Type of consultation (e.g. online, offline)")
    scheduled_at: Optional[datetime] = Field(None, description="ISO timestamp for the scheduled appointment")

    class Config:
        from_attributes = True
