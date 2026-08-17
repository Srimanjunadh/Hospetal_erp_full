"""
Patient Module API Controllers
Exposes REST endpoints for querying patient details, prescriptions, appointments, and profile retrieval.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.schemas import User as UserSchema
from app.modules.patient.schemas import PatientPrescriptionResponse, PatientAppointmentResponse
from app.modules.patient.services import PatientService
from app.modules.identity.controllers import get_current_user_claims
from typing import List, Optional

router = APIRouter()

@router.get("/", response_model=List[UserSchema], summary="List patients", description="Retrieves a list of patients, optionally filtered by hospital ID.")
async def list_patients(hospital_id: Optional[int] = None, db: AsyncSession = Depends(get_db)):
    """
    List all patients.
    
    :param hospital_id: Optional filter for a specific hospital
    :param db: Async database session
    :return: List of patients matching criteria
    """
    return await PatientService.list_patients(db, hospital_id)

@router.get("/me", response_model=UserSchema, summary="Get current patient profile", description="Retrieves the profile of the currently logged-in patient using JWT claims.")
async def get_patient_me(claims: dict = Depends(get_current_user_claims), db: AsyncSession = Depends(get_db)):
    """
    Get profile of the currently authenticated user.
    
    :param claims: Extracted JWT authentication claims
    :param db: Async database session
    :return: Full User object for the authenticated profile
    """
    from sqlalchemy.future import select
    from app.shared.database.models import User
    
    username_or_email = claims.get("sub")
    result = await db.execute(
        select(User).filter(User.username == username_or_email)
    )
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="Authenticated patient profile not found")
    if user.role != "patient":
        # Keep compatibility but note role check if needed; for now just return the user profile
        pass
    return user

@router.get("/{patient_id}", response_model=UserSchema, summary="Get patient by ID", description="Retrieves details of a specific patient by their unique database ID.")
async def get_patient(patient_id: int, db: AsyncSession = Depends(get_db)):
    """
    Get a single patient profile by ID.
    
    :param patient_id: Patient ID
    :param db: Async database session
    :return: Patient details
    """
    return await PatientService.get_patient(db, patient_id)

@router.get("/{username}/prescriptions", response_model=List[PatientPrescriptionResponse], summary="Get patient prescriptions", description="Retrieves historical prescriptions issued for the patient identified by username.")
async def get_patient_prescriptions(username: str, db: AsyncSession = Depends(get_db)):
    """
    Get patient prescriptions by username.
    
    :param username: Patient username
    :param db: Async database session
    :return: List of patient prescriptions
    """
    return await PatientService.get_patient_prescriptions(db, username)

@router.get("/appointments", response_model=List[PatientAppointmentResponse], summary="Get patient appointments", description="Retrieves list of appointments booked by/for a specific patient ID.")
async def get_my_appointments(patient_id: int, db: AsyncSession = Depends(get_db)):
    """
    Get all appointments for a patient.
    
    :param patient_id: Patient ID
    :param db: Async database session
    :return: List of appointments
    """
    return await PatientService.get_patient_appointments(db, patient_id)
