"""
Medical Records & Laboratory Validation Schemas
Defines request and response schemas for updating vitals, lab test requests, prescriptions, and admissions.
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any

class VitalsUpdate(BaseModel):
    """Schema representing updated patient vitals recorded by a nurse."""
    patient_id: int = Field(..., description="Unique database ID of the patient")
    nurse_id: int = Field(..., description="Unique database ID of the recording nurse")
    blood_pressure: str = Field(..., description="Blood pressure reading (e.g., '120/80')")
    heart_rate: int = Field(..., ge=0, le=300, description="Heart rate in beats per minute (must be between 0 and 300)")
    temperature: float = Field(..., ge=30.0, le=45.0, description="Body temperature in Celsius (must be between 30.0 and 45.0)")
    spo2: int = Field(..., ge=0, le=100, description="SPO2 oxygen percentage (must be between 0 and 100)")
    glucose: float = Field(..., ge=0.0, description="Blood glucose reading (must be positive)")
    nursing_notes: Optional[str] = Field("", description="Optional custom notes/observations from the nurse")

    @field_validator("blood_pressure")
    @classmethod
    def validate_bp(cls, v: str) -> str:
        import re
        if not re.match(r"^\d{2,3}/\d{2,3}$", v.strip()):
            raise ValueError("Blood pressure must match format 'systolic/diastolic' (e.g. '120/80')")
        return v

class TestRequest(BaseModel):
    """Schema for a doctor requesting a laboratory test."""
    hospital_id: int = Field(..., description="Hospital database ID")
    patient_id: int = Field(..., description="Patient database ID")
    doctor_id: int = Field(..., description="Doctor database ID")
    test_name: str = Field(..., description="Name of the laboratory test (e.g. Complete Blood Count)")
    cost: Optional[float] = Field(500.0, ge=0.0, description="Associated cost of the test")

class PrescribeRequest(BaseModel):
    """Schema for a doctor prescribing medications."""
    hospital_id: int = Field(..., description="Hospital database ID")
    patient_id: int = Field(..., description="Patient database ID")
    doctor_id: int = Field(..., description="Doctor database ID")
    medicines: List[Dict[str, Any]] = Field(..., description="List of medicines with dosage, frequency, and duration")
    notes: Optional[str] = Field("", description="Optional comments/guidelines for the prescription")

class AdmitRequest(BaseModel):
    """Schema for requesting a patient hospital admission."""
    hospital_id: int = Field(..., description="Hospital database ID")
    patient_id: int = Field(..., description="Patient database ID")
    doctor_id: int = Field(..., description="Doctor database ID")
    reason: Optional[str] = Field("Clinical Observation Required", description="Diagnosis or reason for admission request")

class AdmissionFinalizeRequest(BaseModel):
    """Schema for administrative staff assigning rooms and finalising admissions."""
    admission_id: int = Field(..., description="Associated database admission request ID")
    room_number: str = Field(..., description="Assigned room/ward number")
