"""
Appointment Module Controllers
Exposes HTTP endpoints for booking, listing, updating, approving, and syncing appointments.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.schemas import Appointment as AppointmentSchema
from app.modules.appointment.schemas import (
    AppointmentCreate, AppointmentUpdateDetails, AppointmentSyncPMS
)
from app.modules.appointment.services import AppointmentService
from typing import List

router = APIRouter()

@router.post("/", response_model=AppointmentSchema, summary="Book an appointment", description="Creates a new pending appointment record.")
async def book_appointment(data: AppointmentCreate, db: AsyncSession = Depends(get_db)):
    """
    Book a new patient appointment.
    
    :param data: Appointment details
    :param db: Database session
    :return: Created Appointment object
    """
    return await AppointmentService.book_appointment(db, data)

@router.get("/patient/{patient_id}", response_model=List[AppointmentSchema], summary="List patient appointments", description="Retrieves all appointment records mapped to a patient ID.")
async def get_patient_appointments(patient_id: int, db: AsyncSession = Depends(get_db)):
    """
    Get all appointments for a patient.
    
    :param patient_id: Patient ID
    :param db: Database session
    :return: List of appointments
    """
    return await AppointmentService.get_patient_appointments(db, patient_id)

@router.get("/doctor/{doctor_id}", response_model=List[AppointmentSchema], summary="List doctor appointments", description="Retrieves all appointment records booked with a doctor ID.")
async def get_doctor_appointments(doctor_id: int, db: AsyncSession = Depends(get_db)):
    """
    Get all appointments booked with a doctor.
    
    :param doctor_id: Doctor ID
    :param db: Database session
    :return: List of appointments
    """
    return await AppointmentService.get_doctor_appointments(db, doctor_id)

@router.patch("/{appointment_id}/status", summary="Update status", description="Directly updates the status of an appointment.")
async def update_appointment_status(appointment_id: int, status: str, db: AsyncSession = Depends(get_db)):
    """
    Update appointment status.
    
    :param appointment_id: Appointment ID
    :param status: New status string
    :param db: Database session
    :return: Success details confirmation
    """
    return await AppointmentService.update_appointment_status(db, appointment_id, status)

@router.patch("/{appointment_id}", summary="Update appointment details", description="Updates various details of an appointment including doctor assignment, slot time, and status.")
async def update_appointment_details(
    appointment_id: int, 
    data: AppointmentUpdateDetails, 
    db: AsyncSession = Depends(get_db)
):
    """
    Update detailed properties of an appointment.
    
    :param appointment_id: Appointment ID
    :param data: Typed fields to update
    :param db: Database session
    :return: Success details confirmation
    """
    return await AppointmentService.update_appointment_details(db, appointment_id, data)

@router.get("/hospital/{hospital_id}", summary="List hospital appointments", description="Retrieves list of appointments for a hospital including patient/doctor lookup details.")
async def get_hospital_appointments(hospital_id: int, db: AsyncSession = Depends(get_db)):
    """
    Get hospital appointments list.
    
    :param hospital_id: Hospital ID
    :param db: Database session
    :return: List of hospital appointments details
    """
    return await AppointmentService.get_hospital_appointments(db, hospital_id)

@router.post("/{appointment_id}/approve", summary="Approve appointment", description="Approves an appointment from the admin panel and dispatches a notification alert to the assigned doctor.")
async def approve_appointment(appointment_id: int, db: AsyncSession = Depends(get_db)):
    """
    Approve an appointment.
    
    :param appointment_id: Appointment ID
    :param db: Database session
    :return: Status response dict
    """
    return await AppointmentService.approve_appointment(db, appointment_id)

@router.post("/internal/sync", summary="Sync PMS appointment", description="Endpoint for synchronizing external PMS bookings into ERP appointments schema safely.")
async def sync_pms_appointment(data: AppointmentSyncPMS, db: AsyncSession = Depends(get_db)):
    """
    Synchronizes legacy/external PMS appointments into ERP database.
    
    :param data: PMS Sync data payload
    :param db: Database session
    :return: Sync confirmation dict
    """
    return await AppointmentService.sync_pms_appointment(db, data)
