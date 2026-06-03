from fastapi import APIRouter, Depends
from app.services.ai_service import ai_assistant
from pydantic import BaseModel
from typing import List

router = APIRouter()

class SymptomRequest(BaseModel):
    symptoms: List[str]

@router.post("/triage")
async def triage_symptoms(request: SymptomRequest):
    return await ai_assistant.triage_symptoms(request.symptoms)
