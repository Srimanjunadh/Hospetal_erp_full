import pytest
from app.modules.analytics.services import ai_service
from app.modules.analytics.schemas import (
    MedicalOCRRequest, PrescriptionReadingRequest,
    InventoryPredictionRequest, RevenueForecastRequest,
    PatientRiskRequest, DashboardInsightsRequest
)

@pytest.mark.asyncio
async def test_analytics_triage_symptoms():
    result = await ai_service.triage_symptoms(["fever", "cough"])
    assert result["urgency"] == "low"
    assert "recommended_departments" in result
    assert len(result["recommended_departments"]) > 0

@pytest.mark.asyncio
async def test_medical_ocr_fallback():
    raw_report = "Patient: John Doe. Date: 2026-07-14. Observation: Mild body ache noted. Diagnosis: Influenza."
    res = await ai_service.ocr_medical_report(raw_report)
    assert res.patient_name == "John Doe"
    assert res.date == "2026-07-14"
    assert len(res.observations) > 0
    assert len(res.diagnoses) > 0

@pytest.mark.asyncio
async def test_prescription_reading_fallback():
    prescription_text = "Paracetamol 500mg twice daily for 5 days. Take after food."
    res = await ai_service.read_prescription(prescription_text)
    assert len(res.medicines) > 0
    assert res.notes is not None

@pytest.mark.asyncio
async def test_inventory_prediction():
    res = await ai_service.predict_inventory(
        item_id=1,
        current_stock=100,
        usage_history=[10, 10, 10, 10, 10]
    )
    assert res.predicted_depletion_days == 10.0
    assert res.status == "STABLE"

@pytest.mark.asyncio
async def test_inventory_prediction_critical():
    res = await ai_service.predict_inventory(
        item_id=2,
        current_stock=15,
        usage_history=[5, 5, 5]
    )
    assert res.predicted_depletion_days == 3.0
    assert res.status == "CRITICAL"

@pytest.mark.asyncio
async def test_revenue_forecast():
    res = await ai_service.forecast_revenue([1000.0, 1100.0, 1210.0])
    assert len(res.forecasted_revenue) == 3
    assert res.trend == "GROWING"
    assert res.forecasted_revenue[0] > 1210.0

@pytest.mark.asyncio
async def test_patient_risk_prediction_news2_low():
    res = await ai_service.predict_patient_risk(
        heart_rate=70,
        systolic_bp=120,
        diastolic_bp=80,
        temperature_c=36.7,
        spo2=98,
        respiration_rate=16
    )
    assert res.news2_score == 0
    assert res.risk_level == "LOW"

@pytest.mark.asyncio
async def test_patient_risk_prediction_news2_high():
    res = await ai_service.predict_patient_risk(
        heart_rate=140,      # Score 3
        systolic_bp=85,      # Score 3
        diastolic_bp=50,
        temperature_c=34.5,  # Score 3
        spo2=90,             # Score 3
        respiration_rate=28  # Score 3
    )
    assert res.news2_score == 15
    assert res.risk_level == "HIGH"

@pytest.mark.asyncio
async def test_dashboard_insights_fallback():
    res = await ai_service.get_dashboard_insights(
        active_cases=12,
        occupancy=75.5,
        billing=5000.0,
        low_stock=4
    )
    assert len(res.summary) > 0
    assert len(res.recommendations) > 0
