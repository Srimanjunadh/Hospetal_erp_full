"""
Medical Records & Laboratory Controllers
Exposes HTTP endpoints for recording patient vitals, requesting lab tests, completing lab reports, prescribing, and scheduling admissions.
"""
from fastapi import APIRouter, Depends, UploadFile, File, Body
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.modules.medical_records.schemas import (
    VitalsUpdate, TestRequest, PrescribeRequest, AdmitRequest, AdmissionFinalizeRequest
)
from app.modules.medical_records.services import MedicalRecordsService
from typing import Optional, List

router = APIRouter()

@router.post("/nurse/vitals", summary="Update patient vitals", description="Records patient vitals (BP, heart rate, spo2, glucose, temperature) and dispatches notifications.")
async def update_patient_vitals(data: VitalsUpdate, db: AsyncSession = Depends(get_db)):
    """
    Update patient vitals recorded by a nurse.
    
    :param data: Typed vital statistics
    :param db: Database session
    :return: Status response dictionary
    """
    return await MedicalRecordsService.update_patient_vitals(db, data)

@router.get("/vitals/{username}", summary="Get latest vitals", description="Retrieves the most recently recorded vitals matching the patient's username.")
async def get_latest_vitals_by_username(username: str, db: AsyncSession = Depends(get_db)):
    """
    Retrieve latest recorded vitals for a patient.
    
    :param username: Patient username
    :param db: Database session
    :return: Patient vitals record details
    """
    return await MedicalRecordsService.get_latest_vitals(db, username)

@router.get("/lab/pending", summary="List pending lab tests", description="Retrieves list of all laboratory tests in 'pending' state.")
async def get_pending_tests(db: AsyncSession = Depends(get_db)):
    """
    List pending lab test requests.
    
    :param db: Database session
    :return: List of pending lab test requests
    """
    return await MedicalRecordsService.get_pending_tests(db)

@router.post("/lab/upload/{test_id}", summary="Upload lab test result file", description="Uploads a PDF/image test report file for a lab request and marks it as completed.")
async def upload_test_result(test_id: str, file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    """
    Upload result report for a lab request.
    
    :param test_id: Lab Test ID (TEST-XXXX)
    :param file: Uploaded lab result file
    :param db: Database session
    :return: Status response details
    """
    return await MedicalRecordsService.upload_test_result(db, test_id, file)

@router.post("/doctor/test-request", summary="Request a lab test", description="Dispatches a request for a new lab test for a patient.")
async def request_lab_test(data: TestRequest, db: AsyncSession = Depends(get_db)):
    """
    Request a new lab test.
    
    :param data: Lab test request details
    :param db: Database session
    :return: Status response including test ID
    """
    return await MedicalRecordsService.request_lab_test(db, data)

@router.post("/doctor/prescribe", summary="Create prescription", description="Issues a new prescription and transmits it to the pharmacy order database queue.")
async def prescribe_medication(data: PrescribeRequest, db: AsyncSession = Depends(get_db)):
    """
    Create a patient prescription.
    
    :param data: Prescription medicines details
    :param db: Database session
    :return: Status response confirmation
    """
    return await MedicalRecordsService.prescribe_medication(db, data)

@router.post("/doctor/admit-request", summary="Request patient admission", description="Initiates a hospital admission request recommendation.")
async def request_admission(data: AdmitRequest, db: AsyncSession = Depends(get_db)):
    """
    Recommend a hospital admission.
    
    :param data: Admission details
    :param db: Database session
    :return: Status details response
    """
    return await MedicalRecordsService.request_admission(db, data)

@router.get("/admissions", summary="List admissions", description="Retrieves list of all admissions, optionally filtered by hospital.")
async def get_all_admissions(hospital_id: Optional[int] = None, db: AsyncSession = Depends(get_db)):
    """
    List hospital admissions.
    
    :param hospital_id: Optional hospital ID
    :param db: Database session
    :return: List of admissions
    """
    return await MedicalRecordsService.get_all_admissions(db, hospital_id)

@router.get("/admissions/pending", summary="List pending admissions", description="Retrieves list of admission requests awaiting room assignment.")
async def get_pending_admissions(hospital_id: int, db: AsyncSession = Depends(get_db)):
    """
    List pending admissions.
    
    :param hospital_id: Hospital ID
    :param db: Database session
    :return: List of pending admissions
    """
    return await MedicalRecordsService.get_pending_admissions(db, hospital_id)

@router.post("/admissions/finalize", summary="Finalize patient admission", description="Assigns a ward/room number to a recommended admission and sets status to admitted.")
async def finalize_admission(data: AdmissionFinalizeRequest, db: AsyncSession = Depends(get_db)):
    """
    Finalize patient admission by assigning a room.
    
    :param data: Finalize admission details
    :param db: Database session
    :return: Status response confirmation
    """
    return await MedicalRecordsService.finalize_admission(db, data)

@router.get("/patient/{patient_id}/tests", summary="Get patient lab tests", description="Retrieves all lab tests booked for a specific patient.")
async def get_patient_tests(patient_id: int, db: AsyncSession = Depends(get_db)):
    """
    Get lab tests for a specific patient.
    
    :param patient_id: Patient ID
    :param db: Database session
    :return: List of lab tests
    """
    return await MedicalRecordsService.get_patient_tests(db, patient_id)

@router.get("/patient/{patient_id}/history", summary="Get patient medical history", description="Retrieves an aggregate chronological medical history file log for the patient.")
async def get_patient_history(patient_id: int, db: AsyncSession = Depends(get_db)):
    """
    Get aggregated patient clinical history (prescriptions, lab tests, admissions).
    
    :param patient_id: Patient ID
    :param db: Database session
    :return: List of historic clinical records
    """
    return await MedicalRecordsService.get_patient_history(db, patient_id)

@router.get("/doctor/prescriptions/{patient_id}", summary="Get patient prescriptions", description="Retrieves all prescriptions written for a patient ID.")
async def get_patient_prescriptions(patient_id: int, db: AsyncSession = Depends(get_db)):
    """
    Get prescriptions list for a patient.
    
    :param patient_id: Patient ID
    :param db: Database session
    :return: List of prescriptions
    """
    return await MedicalRecordsService.get_patient_prescriptions(db, patient_id)

@router.post("/patient/{patient_id}/health-records", summary="Upload health document record", description="Uploads external health reports or documents for a patient's record profile.")
async def upload_health_record(
    patient_id: int, 
    title: str = Body(...),
    record_type: str = Body(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload personal health record document.
    
    :param patient_id: Patient ID
    :param title: Record file title
    :param record_type: Record category
    :param file: Document file
    :param db: Database session
    :return: Status response confirmation
    """
    return await MedicalRecordsService.upload_health_record(db, patient_id, title, record_type, file)
