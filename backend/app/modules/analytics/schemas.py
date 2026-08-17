from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any

class SymptomRequest(BaseModel):
    symptoms: List[str]

# --- Medical OCR ---
class MedicalOCRRequest(BaseModel):
    raw_text: str = Field(..., description="Unstructured medical report text")

class MedicalOCRResponse(BaseModel):
    patient_name: Optional[str] = Field(None, description="Extracted patient name")
    date: Optional[str] = Field(None, description="Report date")
    observations: List[str] = Field(default_factory=list, description="Clinical observations")
    diagnoses: List[str] = Field(default_factory=list, description="Clinical diagnoses")

# --- Prescription Reading ---
class PrescriptionReadingRequest(BaseModel):
    prescription_text: str = Field(..., description="Unstructured doctor prescription instructions")

class MedicineInstruction(BaseModel):
    name: str = Field(..., description="Medicine brand or generic name")
    dosage: str = Field(..., description="Dose description (e.g. 500mg, 1 tablet)")
    frequency: str = Field(..., description="Timing frequency (e.g. twice daily, morning)")
    duration: str = Field(..., description="Duration treatment time (e.g. 7 days, 1 month)")

class PrescriptionReadingResponse(BaseModel):
    medicines: List[MedicineInstruction] = Field(default_factory=list, description="Structured list of medicines")
    notes: Optional[str] = Field(None, description="Doctor special remarks or precautions")

# --- Inventory Prediction ---
class InventoryPredictionRequest(BaseModel):
    item_id: int = Field(..., description="Item ID")
    current_stock: int = Field(..., description="Current stock level")
    daily_usage_history: List[int] = Field(..., description="Daily consumption log history")

class InventoryPredictionResponse(BaseModel):
    predicted_depletion_days: float = Field(..., description="Remaining days until stock falls to zero")
    recommended_restock_date: str = Field(..., description="ISO recommended reorder date")
    status: str = Field(..., description="Restocking priority status (CRITICAL, STABLE)")

# --- Revenue Forecast ---
class RevenueForecastRequest(BaseModel):
    historical_monthly_revenue: List[float] = Field(..., description="Historical monthly invoices totals")

class RevenueForecastResponse(BaseModel):
    forecasted_revenue: List[float] = Field(..., description="Forecasted revenue for next 3 months")
    confidence_lower: List[float] = Field(..., description="Lower boundary of interval")
    confidence_upper: List[float] = Field(..., description="Upper boundary of interval")
    trend: str = Field(..., description="Revenue growth trend trajectory (GROWING, DECLINING, STABLE)")

# --- Patient Risk Prediction (NEWS2) ---
class PatientRiskRequest(BaseModel):
    heart_rate: int = Field(..., description="Beats per minute")
    systolic_bp: int = Field(..., description="Systolic blood pressure (mmHg)")
    diastolic_bp: int = Field(..., description="Diastolic blood pressure (mmHg)")
    temperature_c: float = Field(..., description="Body temperature in Celsius")
    spo2: int = Field(..., description="Oxygen saturation level (%)")
    respiration_rate: int = Field(..., description="Breaths per minute")

class PatientRiskResponse(BaseModel):
    news2_score: int = Field(..., description="Calculated National Early Warning Score 2 score")
    risk_level: str = Field(..., description="Risk category (LOW, MEDIUM, HIGH)")
    recommended_action: str = Field(..., description="Action instructions based on clinical guidelines")

# --- Dashboard Insights ---
class DashboardInsightsRequest(BaseModel):
    active_cases: int = Field(..., description="Count of currently active patient cases")
    occupancy_rate: float = Field(..., description="Bed occupancy rate percentage")
    monthly_billing: float = Field(..., description="Invoice total billing for the month")
    low_stock_count: int = Field(..., description="Count of items below safety stock limit")

class DashboardInsightsResponse(BaseModel):
    summary: str = Field(..., description="AI generated summary statement of hospital metrics")
    recommendations: List[str] = Field(default_factory=list, description="Actionable recommendation lists")
