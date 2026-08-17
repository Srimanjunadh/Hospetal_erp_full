"""
AI and Analytics Service Layer
Implements NLP parsing via Google Gemini API, deterministic forecasting,
and clinical risk assessment using National Early Warning Score 2 (NEWS2).
"""
import os
import json
import logging
import re
from datetime import datetime, timedelta, date
from typing import List, Dict, Optional, Any
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

# Try importing google-generativeai
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False

from app.modules.analytics.repositories import AnalyticsRepository
from app.modules.analytics.schemas import (
    MedicalOCRResponse, PrescriptionReadingResponse, MedicineInstruction,
    InventoryPredictionResponse, RevenueForecastResponse, PatientRiskResponse,
    DashboardInsightsResponse
)

logger = logging.getLogger("ai_service")

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY") or os.getenv("MISTRAL_API_KEY")
if GEMINI_AVAILABLE and api_key:
    try:
        genai.configure(api_key=api_key)
        logger.info("Gemini API client successfully configured")
    except Exception as e:
        logger.warning(f"Error configuring Gemini API client: {e}")
        GEMINI_AVAILABLE = False
else:
    GEMINI_AVAILABLE = False


class AIService:
    @staticmethod
    def _call_gemini_json(prompt: str, fallback_dict: Dict) -> Dict:
        """
        Executes a prompt requesting JSON output from Gemini. Falls back to default if API is unavailable.
        """
        if not GEMINI_AVAILABLE:
            logger.info("Gemini API not configured. Falling back to local NLP heuristics.")
            return fallback_dict
            
        try:
            model = genai.GenerativeModel('gemini-1.5-flash')
            response = model.generate_content(
                prompt + "\nReturn ONLY raw valid JSON matching this schema. Do not include markdown code block formatting or explanation."
            )
            text = response.text.strip()
            # Clean possible markdown wrapping
            if text.startswith("```json"):
                text = text.replace("```json", "", 1)
            if text.endswith("```"):
                text = text[:-3]
            text = text.strip()
            
            return json.loads(text)
        except Exception as e:
            logger.warning(f"Gemini API invocation failed: {e}. Falling back to default.")
            return fallback_dict

    async def ocr_medical_report(self, raw_text: str) -> MedicalOCRResponse:
        """
        Processes unstructured clinical reports to extract name, date, observations, and diagnoses.
        """
        # Heuristic default extractor
        name_match = re.search(r"(?:Patient|Name):\s*([A-Za-z\s]+)", raw_text, re.IGNORECASE)
        date_match = re.search(r"Date:\s*([\d\-\/]+)", raw_text, re.IGNORECASE)
        
        fallback = {
            "patient_name": name_match.group(1).strip() if name_match else "Unknown Patient",
            "date": date_match.group(1).strip() if date_match else datetime.utcnow().strftime("%Y-%m-%d"),
            "observations": [line.strip() for line in raw_text.split("\n") if "observe" in line.lower() or "noted" in line.lower()],
            "diagnoses": [line.strip() for line in raw_text.split("\n") if "diagnos" in line.lower() or "assess" in line.lower()]
        }

        prompt = f"""
        Extract entities from this medical text:
        "{raw_text}"
        
        JSON schema:
        {{
          "patient_name": "name",
          "date": "YYYY-MM-DD",
          "observations": ["observation 1", "observation 2"],
          "diagnoses": ["diagnosis 1", "diagnosis 2"]
        }}
        """
        
        res = self._call_gemini_json(prompt, fallback)
        return MedicalOCRResponse(
            patient_name=res.get("patient_name"),
            date=res.get("date"),
            observations=res.get("observations", []),
            diagnoses=res.get("diagnoses", [])
        )

    async def read_prescription(self, prescription_text: str) -> PrescriptionReadingResponse:
        """
        Extracts structured medicine directives (name, dosage, frequency, duration) from text prescriptions.
        """
        fallback = {
            "medicines": [
                {
                    "name": "Extract Failed",
                    "dosage": "N/A",
                    "frequency": "N/A",
                    "duration": "N/A"
                }
            ],
            "notes": "Please verify prescription instructions manually."
        }

        prompt = f"""
        Extract medicines from this prescription text:
        "{prescription_text}"
        
        JSON schema:
        {{
          "medicines": [
            {{
              "name": "Paracetamol",
              "dosage": "500mg",
              "frequency": "Three times daily",
              "duration": "5 days"
            }}
          ],
          "notes": "Take after meals"
        }}
        """
        
        res = self._call_gemini_json(prompt, fallback)
        medicines = []
        for m in res.get("medicines", []):
            medicines.append(MedicineInstruction(
                name=m.get("name", "Unknown"),
                dosage=m.get("dosage", "N/A"),
                frequency=m.get("frequency", "N/A"),
                duration=m.get("duration", "N/A")
            ))
            
        return PrescriptionReadingResponse(
            medicines=medicines,
            notes=res.get("notes")
        )

    async def predict_inventory(self, item_id: int, current_stock: int, usage_history: List[int]) -> InventoryPredictionResponse:
        """
        Calculates daily consumption rate to predict depletion days and recommended replenishment dates.
        """
        valid_usage = [u for u in usage_history if u >= 0]
        if not valid_usage:
            depletion_days = 999.0
        else:
            avg_daily = sum(valid_usage) / len(valid_usage)
            depletion_days = current_stock / avg_daily if avg_daily > 0 else 999.0

        recommended_date = date.today() + timedelta(days=max(0, int(depletion_days) - 3))
        status = "CRITICAL" if depletion_days <= 5 else "STABLE"

        return InventoryPredictionResponse(
            predicted_depletion_days=round(depletion_days, 1),
            recommended_restock_date=recommended_date.isoformat(),
            status=status
        )

    async def forecast_revenue(self, history: List[float]) -> RevenueForecastResponse:
        """
        Applies a basic growth projection to forecast revenue for the next 3 months.
        """
        if not history:
            history = [1000.0]
            
        # Compute average month-over-month growth rate
        if len(history) < 2:
            growth_rate = 0.02 # default 2%
        else:
            rates = []
            for i in range(1, len(history)):
                if history[i-1] > 0:
                    rates.append((history[i] - history[i-1]) / history[i-1])
            growth_rate = sum(rates) / len(rates) if rates else 0.02

        last_val = history[-1]
        forecasts = []
        lower = []
        upper = []
        
        for month in range(1, 4):
            val = last_val * ((1 + growth_rate) ** month)
            forecasts.append(round(val, 2))
            # Variance expands with time
            variance = 0.08 * month
            lower.append(round(val * (1 - variance), 2))
            upper.append(round(val * (1 + variance), 2))

        trend = "GROWING" if growth_rate > 0.01 else ("DECLINING" if growth_rate < -0.01 else "STABLE")

        return RevenueForecastResponse(
            forecasted_revenue=forecasts,
            confidence_lower=lower,
            confidence_upper=upper,
            trend=trend
        )

    async def predict_patient_risk(
        self, heart_rate: int, systolic_bp: int, diastolic_bp: int, temperature_c: float, spo2: int, respiration_rate: int
    ) -> PatientRiskResponse:
        """
        Calculates risk score matching National Early Warning Score 2 (NEWS2) physiological metrics.
        """
        score = 0
        
        # 1. Respiration Rate
        if respiration_rate <= 8:
            score += 3
        elif 9 <= respiration_rate <= 11:
            score += 1
        elif 12 <= respiration_rate <= 20:
            score += 0
        elif 21 <= respiration_rate <= 24:
            score += 2
        elif respiration_rate >= 25:
            score += 3
            
        # 2. SpO2 (Oxygen Saturation)
        if spo2 >= 96:
            score += 0
        elif 94 <= spo2 <= 95:
            score += 1
        elif 92 <= spo2 <= 93:
            score += 2
        elif spo2 <= 91:
            score += 3
            
        # 3. Temperature
        if temperature_c <= 35.0:
            score += 3
        elif 35.1 <= temperature_c <= 36.0:
            score += 1
        elif 36.1 <= temperature_c <= 38.0:
            score += 0
        elif 38.1 <= temperature_c <= 39.0:
            score += 1
        elif temperature_c >= 39.1:
            score += 3
            
        # 4. Systolic BP
        if systolic_bp <= 90:
            score += 3
        elif 91 <= systolic_bp <= 100:
            score += 2
        elif 101 <= systolic_bp <= 110:
            score += 1
        elif 111 <= systolic_bp <= 219:
            score += 0
        elif systolic_bp >= 220:
            score += 3
            
        # 5. Heart Rate
        if heart_rate <= 40:
            score += 3
        elif 41 <= heart_rate <= 50:
            score += 1
        elif 51 <= heart_rate <= 90:
            score += 0
        elif 91 <= heart_rate <= 110:
            score += 1
        elif 111 <= heart_rate <= 130:
            score += 2
        elif heart_rate >= 131:
            score += 3

        # Classify Risk Level
        if score <= 4:
            level = "LOW"
            action = "Routine ward-based clinical monitoring."
        elif 5 <= score <= 6:
            level = "MEDIUM"
            action = "Urgent medical clinician assessment requested."
        else:
            level = "HIGH"
            action = "EMERGENCY: Immediate critical care outreach team response."

        return PatientRiskResponse(
            news2_score=score,
            risk_level=level,
            recommended_action=action
        )

    async def get_dashboard_insights(self, active_cases: int, occupancy: float, billing: float, low_stock: int) -> DashboardInsightsResponse:
        """
        Uses Gemini to generate textual operational suggestions based on dashboard numbers.
        """
        fallback = {
            "summary": f"Hospital status is operational. Active cases stand at {active_cases} with {occupancy}% bed occupancy.",
            "recommendations": [
                "Review active stock levels immediately" if low_stock > 0 else "Verify inventory records",
                "Optimize clinician shift rosters to match bed occupancy load"
            ]
        }

        prompt = f"""
        Draft high-level operations review insights for a hospital management dashboard.
        Metrics:
        - Active Patient Cases: {active_cases}
        - Ward Bed Occupancy Rate: {occupancy}%
        - Monthly billing invoices totals: ${billing}
        - Low stock items alerts: {low_stock}
        
        JSON schema:
        {{
          "summary": "AI general summary",
          "recommendations": ["recommendation 1", "recommendation 2"]
        }}
        """
        
        res = self._call_gemini_json(prompt, fallback)
        return DashboardInsightsResponse(
            summary=res.get("summary", ""),
            recommendations=res.get("recommendations", [])
        )
        
    async def triage_symptoms(self, symptoms: List[str]) -> Dict:
        """Legacy symptom lookup routing support."""
        suggestions = []
        urgency = "low"
        knowledge_base = {
            "fever": ["Infection", "Flu"],
            "cough": ["Cold", "Bronchitis"],
            "chest_pain": ["Cardiology Emergency", "Muscle Strain"]
        }
        for symptom in symptoms:
            s_low = symptom.lower()
            if "chest" in s_low or "breath" in s_low:
                urgency = "critical"
                suggestions.append("Cardiology / Emergency")
            elif s_low in knowledge_base:
                suggestions.append(f"General Medicine ({knowledge_base[s_low][0]})")
        
        if not suggestions:
            suggestions.append("General Physician")
        return {
            "urgency": urgency,
            "recommended_departments": list(set(suggestions)),
            "next_steps": "Book slot" if urgency != "critical" else "EMERGENCY: Call 911"
        }

    async def get_global_stats(self, db: AsyncSession) -> Dict:
        return await AnalyticsRepository.get_global_stats(db)

ai_service = AIService()
