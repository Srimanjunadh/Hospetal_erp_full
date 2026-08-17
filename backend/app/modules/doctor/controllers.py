"""
Doctor Module Controllers
Exposes endpoints for listing doctors, schedules, and managing doctor appointments.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.modules.doctor.schemas import (
    DoctorCreate, DoctorSchedule, DoctorScheduleCreate, DoctorAppointmentUpdate
)
from app.modules.doctor.services import DoctorService
from typing import List, Optional

router = APIRouter()

@router.get("/{doctor_id}/patients", summary="List assigned patients", description="Retrieves a list of all patients assigned to a specific doctor ID.")
async def list_assigned_patients(doctor_id: int, db: AsyncSession = Depends(get_db)):
    """
    Retrieve patients assigned to the doctor.
    
    :param doctor_id: Doctor ID
    :param db: Database session
    :return: List of patients
    """
    return await DoctorService.list_assigned_patients(db, doctor_id)

@router.get("/", summary="List all doctors", description="Retrieves list of registered doctors, optionally filtering by hospital ID.")
async def list_doctors(hospital_id: Optional[int] = None, db: AsyncSession = Depends(get_db)):
    """
    List all doctors.
    
    :param hospital_id: Optional hospital filter
    :param db: Database session
    :return: List of doctors
    """
    return await DoctorService.list_doctors(db, hospital_id)

@router.get("/{doctor_id}/schedule", response_model=List[DoctorSchedule], summary="Get doctor schedule", description="Retrieves the shift or appointment tasks schedule of a doctor.")
async def get_doctor_schedule(doctor_id: int, db: AsyncSession = Depends(get_db)):
    """
    Retrieve doctor schedules.
    
    :param doctor_id: Doctor ID
    :param db: Database session
    :return: List of doctor schedules
    """
    return await DoctorService.get_doctor_schedule(db, doctor_id)

@router.post("/schedule", response_model=DoctorSchedule, summary="Create a schedule task", description="Registers a new task or shifts block for a doctor.")
async def create_schedule(schedule_data: DoctorScheduleCreate, db: AsyncSession = Depends(get_db)):
    """
    Create a new task schedule for a doctor.
    
    :param schedule_data: Schedule creation details
    :param db: Database session
    :return: Created DoctorSchedule object
    """
    return await DoctorService.create_schedule(db, schedule_data)

@router.get("/{doctor_id}", summary="Get doctor details", description="Retrieves a doctor's full profile details including credentials.")
async def get_doctor(doctor_id: int, db: AsyncSession = Depends(get_db)):
    """
    Get a single doctor's details by ID.
    
    :param doctor_id: Doctor ID
    :param db: Database session
    :return: Doctor details dictionary
    """
    return await DoctorService.get_doctor(db, doctor_id)

@router.post("/", summary="Register a doctor profile", description="Creates a new doctor profile tied to an existing user registration ID.")
async def create_doctor(doctor_data: DoctorCreate, db: AsyncSession = Depends(get_db)):
    """
    Create a new doctor profile.
    
    :param doctor_data: Doctor details
    :param db: Database session
    :return: Created Doctor DB object
    """
    return await DoctorService.create_doctor(db, doctor_data)

@router.get("/{doctor_id}/appointments", summary="Get doctor appointments", description="Retrieves a list of appointments booked with a doctor.")
async def get_doctor_appointments(doctor_id: int, db: AsyncSession = Depends(get_db)):
    """
    List appointments assigned to a doctor.
    
    :param doctor_id: Doctor ID
    :param db: Database session
    :return: List of appointments
    """
    return await DoctorService.get_doctor_appointments(db, doctor_id)

@router.patch("/appointments/{appointment_id}", summary="Update doctor appointment", description="Updates the status and/or scheduled time of an appointment.")
async def update_appointment(
    appointment_id: int, 
    data: DoctorAppointmentUpdate, 
    db: AsyncSession = Depends(get_db)
):
    """
    Update appointment details/status by doctor.
    
    :param appointment_id: Appointment ID
    :param data: Status and time updates
    :param db: Database session
    :return: Updated status confirmation dictionary
    """
    return await DoctorService.update_appointment(db, appointment_id, data)
