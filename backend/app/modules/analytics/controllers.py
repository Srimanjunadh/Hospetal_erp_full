from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db

from app.modules.analytics.schemas import (
    SymptomRequest, MedicalOCRRequest, MedicalOCRResponse,
    PrescriptionReadingRequest, PrescriptionReadingResponse,
    InventoryPredictionRequest, InventoryPredictionResponse,
    RevenueForecastRequest, RevenueForecastResponse,
    PatientRiskRequest, PatientRiskResponse,
    DashboardInsightsRequest, DashboardInsightsResponse
)
from app.modules.analytics.services import ai_service

router = APIRouter()

@router.post("/triage", tags=["Legacy Triage"])
async def triage_symptoms(request: SymptomRequest):
    return await ai_service.triage_symptoms(request.symptoms)

@router.get("/global/stats", tags=["Repository Metrics"])
async def get_global_stats(db: AsyncSession = Depends(get_db)):
    return await ai_service.get_global_stats(db)

# --- 1. Medical OCR Endpoint ---
@router.post("/ocr", response_model=MedicalOCRResponse, status_code=status.HTTP_200_OK, tags=["AI Core"])
async def medical_ocr(request: MedicalOCRRequest):
    """
    Ingests raw, unstructured medical reports and uses Gemini NLP to extract structured metadata.
    """
    return await ai_service.ocr_medical_report(request.raw_text)

# --- 2. Prescription Reader Endpoint ---
@router.post("/prescription", response_model=PrescriptionReadingResponse, status_code=status.HTTP_200_OK, tags=["AI Core"])
async def read_prescription(request: PrescriptionReadingRequest):
    """
    Parses hand-written or unstructured prescription instructions into structured dosage directives.
    """
    return await ai_service.read_prescription(request.prescription_text)

# --- 3. Inventory Stock Forecast Endpoint ---
@router.post("/predict/inventory", response_model=InventoryPredictionResponse, status_code=status.HTTP_200_OK, tags=["AI Predictions"])
async def predict_inventory(request: InventoryPredictionRequest):
    """
    Analyzes item depletion statistics to forecast depletion days and recommend a restocking date.
    """
    return await ai_service.predict_inventory(
        request.item_id,
        request.current_stock,
        request.daily_usage_history
    )

# --- 4. Revenue Monthly Forecast Endpoint ---
@router.post("/predict/revenue", response_model=RevenueForecastResponse, status_code=status.HTTP_200_OK, tags=["AI Predictions"])
async def predict_revenue(request: RevenueForecastRequest):
    """
    Performs trends extrapolation over historical billing logs to forecast revenue for the next 3 months.
    """
    return await ai_service.forecast_revenue(request.historical_monthly_revenue)

# --- 5. Clinical NEWS2 Risk Calculator Endpoint ---
@router.post("/predict/patient-risk", response_model=PatientRiskResponse, status_code=status.HTTP_200_OK, tags=["AI Predictions"])
async def predict_patient_risk(request: PatientRiskRequest):
    """
    Evaluates vital measurements using NEWS2 scoring logic to gauge patient risk indicators.
    """
    return await ai_service.predict_patient_risk(
        heart_rate=request.heart_rate,
        systolic_bp=request.systolic_bp,
        diastolic_bp=request.diastolic_bp,
        temperature_c=request.temperature_c,
        spo2=request.spo2,
        respiration_rate=request.respiration_rate
    )

# --- 6. Dashboard Insights Endpoint ---
@router.post("/insights", response_model=DashboardInsightsResponse, status_code=status.HTTP_200_OK, tags=["AI Core"])
async def get_dashboard_insights(request: DashboardInsightsRequest):
    """
    Generates high-level summaries and action items for hospital admins based on key performance metrics.
    """
    return await ai_service.get_dashboard_insights(
        active_cases=request.active_cases,
        occupancy=request.occupancy_rate,
        billing=request.monthly_billing,
        low_stock=request.low_stock_count
    )
