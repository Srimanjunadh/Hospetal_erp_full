from typing import List, Dict

class AIHealthAssistant:
    def __init__(self):
        # In a real app, this would integrate with an LLM or a medical knowledge graph
        self.knowledge_base = {
            "fever": ["Infection", "Flu", "Inflammation"],
            "cough": ["Cold", "Bronchitis", "Allergy"],
            "chest_pain": ["Cardiology Emergency", "Muscle Strain", "Acid Reflux"],
            "headache": ["Migraine", "Stress", "Dehydration"]
        }

    async def triage_symptoms(self, symptoms: List[str]) -> Dict:
        """
        Suggests potential departments and urgency based on symptoms.
        """
        suggestions = []
        urgency = "low"
        
        for symptom in symptoms:
            symptom_lower = symptom.lower()
            if "chest" in symptom_lower or "breath" in symptom_lower:
                urgency = "critical"
                suggestions.append("Cardiology / Emergency")
            elif symptom_lower in self.knowledge_base:
                suggestions.append(f"General Medicine ({self.knowledge_base[symptom_lower][0]})")
        
        if not suggestions:
            suggestions.append("General Physician")
            
        return {
            "urgency": urgency,
            "recommended_departments": list(set(suggestions)),
            "next_steps": "Please book an appointment with the suggested specialist." if urgency != "critical" else "EMERGENCY: Please call an ambulance immediately."
        }

ai_assistant = AIHealthAssistant()
