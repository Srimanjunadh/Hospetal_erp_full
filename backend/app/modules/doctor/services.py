"""
Doctor Module Service Layer
Contains business logic for doctor listing, patient assignments, schedules, and appointments updates.
"""
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
from app.shared.database.models import Doctor, DoctorSchedule
from app.modules.doctor.repositories import DoctorRepository
from app.modules.doctor.schemas import DoctorCreate, DoctorScheduleCreate, DoctorAppointmentUpdate
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any

logger = logging.getLogger(__name__)

class DoctorService:
    @staticmethod
    async def list_assigned_patients(db: AsyncSession, doctor_id: int) -> List[Dict[str, Any]]:
        """
        Retrieves all patients assigned to a specific doctor.
        
        :param db: Async database session
        :param doctor_id: Database ID of the doctor
        :return: List of patient details dictionaries
        :raises HTTPException: If retrieval fails
        """
        try:
            logger.info(f"Listing assigned patients for doctor_id={doctor_id}")
            users = await DoctorRepository.get_assigned_patients(db, doctor_id)
            output = []
            for u in users:
                output.append({
                    "id": u.id,
                    "username": u.username,
                    "name": u.name,
                    "role": u.role,
                    "email": u.email,
                    "phone": u.phone,
                    "assigned_doctor_id": u.assigned_doctor_id,
                    "assigned_nurse_id": u.assigned_nurse_id,
                    "created_at": u.created_at.isoformat() if u.created_at else None
                })
            return output
        except Exception as e:
            logger.error(f"Error fetching assigned patients for doctor {doctor_id}: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Internal server error listing assigned patients")

    @staticmethod
    async def list_doctors(db: AsyncSession, hospital_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Retrieves list of all registered doctors, optionally filtering by hospital.
        
        :param db: Async database session
        :param hospital_id: Optional hospital ID to filter by
        :return: List of doctors dictionaries including their user accounts details
        :raises HTTPException: If retrieval fails
        """
        try:
            logger.info(f"Listing doctors: hospital_id={hospital_id}")
            doctors = await DoctorRepository.list_doctors(db, hospital_id)
            output = []
            for d in doctors:
                if not d.user:
                    continue
                output.append({
                    "id": d.id,
                    "specialization": d.specialization,
                    "experience": d.experience,
                    "hospital_id": d.hospital_id,
                    "room_number": d.room_number,
                    "user": {
                        "id": d.user.id,
                        "username": d.user.username,
                        "name": d.user.name,
                        "role": d.user.role,
                        "email": d.user.email,
                        "phone": d.user.phone,
                        "created_at": d.user.created_at.isoformat() if d.user.created_at else None
                    }
                })
            return output
        except Exception as e:
            logger.error(f"Error listing doctors: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Internal server error listing doctors")

    @staticmethod
    async def get_doctor_schedule(db: AsyncSession, doctor_id: int) -> List[DoctorSchedule]:
        """
        Gets list of schedule records for a doctor.
        
        :param db: Async database session
        :param doctor_id: Doctor ID
        :return: List of DoctorSchedule model objects
        """
        try:
            logger.info(f"Retrieving schedule for doctor_id={doctor_id}")
            return await DoctorRepository.get_doctor_schedule(db, doctor_id)
        except Exception as e:
            logger.error(f"Error fetching doctor schedule for doctor {doctor_id}: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Error fetching schedule records")

    @staticmethod
    async def create_schedule(db: AsyncSession, data: DoctorScheduleCreate) -> DoctorSchedule:
        """
        Registers a new schedule record for a doctor.
        
        :param db: Async database session
        :param data: Doctor schedule registration details
        :return: Created DoctorSchedule model object
        """
        try:
            logger.info(f"Creating schedule task for doctor_id={data.doctor_id}: {data.task_name}")
            new_schedule = DoctorSchedule(
                doctor_id=data.doctor_id,
                task_name=data.task_name,
                start_time=data.start_time,
                end_time=data.end_time,
                status=data.status,
                notes=data.notes
            )
            return await DoctorRepository.create_schedule(db, new_schedule)
        except Exception as e:
            logger.error(f"Error creating doctor schedule: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Internal server error creating doctor schedule")

    @staticmethod
    async def get_doctor(db: AsyncSession, doctor_id: int) -> Dict[str, Any]:
        """
        Retrieves details of a doctor by database ID.
        
        :param db: Async database session
        :param doctor_id: Doctor ID
        :return: Doctor details dictionary
        :raises HTTPException: If doctor not found or profile is missing user info
        """
        try:
            logger.info(f"Retrieving doctor profile doctor_id={doctor_id}")
            d = await DoctorRepository.get_doctor_by_id(db, doctor_id)
            if not d:
                logger.warning(f"Doctor with ID {doctor_id} not found")
                raise HTTPException(status_code=404, detail="Doctor not found")
            if not d.user:
                logger.error(f"Doctor ID {doctor_id} exists but is missing associated user record")
                raise HTTPException(status_code=500, detail="Doctor user profile missing")
            return {
                "id": d.id,
                "specialization": d.specialization,
                "experience": d.experience,
                "hospital_id": d.hospital_id,
                "room_number": d.room_number,
                "user": {
                    "id": d.user.id,
                    "username": d.user.username,
                    "name": d.user.name,
                    "role": d.user.role,
                    "email": d.user.email,
                    "phone": d.user.phone,
                    "created_at": d.user.created_at.isoformat() if d.user.created_at else None
                }
            }
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error retrieving doctor {doctor_id}: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Internal server error retrieving doctor details")

    @staticmethod
    async def create_doctor(db: AsyncSession, data: DoctorCreate) -> Doctor:
        """
        Creates a new Doctor profile.
        
        :param db: Async database session
        :param data: Doctor creation details
        :return: Created Doctor model object
        """
        try:
            logger.info(f"Creating doctor profile for user_id={data.user_id}")
            new_doctor = Doctor(
                user_id=data.user_id,
                specialization=data.specialization,
                experience=data.experience,
                hospital_id=data.hospital_id,
                room_number=data.room_number,
                status=data.status
            )
            return await DoctorRepository.create_doctor(db, new_doctor)
        except Exception as e:
            logger.error(f"Error creating doctor profile: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Internal server error creating doctor profile")

    @staticmethod
    async def get_doctor_appointments(db: AsyncSession, doctor_id: int) -> List[Dict[str, Any]]:
        """
        Lists all appointments booked with a doctor.
        
        :param db: Async database session
        :param doctor_id: Doctor ID
        :return: List of appointment details
        """
        try:
            logger.info(f"Retrieving appointments list for doctor_id={doctor_id}")
            appointments = await DoctorRepository.get_doctor_appointments(db, doctor_id)
            return [
                {
                    "id": a.id,
                    "patient": {
                        "id": a.patient.id,
                        "name": a.patient.name,
                        "username": a.patient.username
                    } if a.patient else None,
                    "status": a.status,
                    "preferred_time": a.preferred_time,
                    "reason": a.reason,
                    "type": a.type,
                    "scheduled_at": a.scheduled_at.isoformat() if a.scheduled_at else None
                } for a in appointments
            ]
        except Exception as e:
            logger.error(f"Error fetching doctor appointments: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Error fetching appointments")

    @staticmethod
    async def update_appointment(db: AsyncSession, appointment_id: int, data: DoctorAppointmentUpdate) -> Dict[str, str]:
        """
        Updates an appointment status or schedule slot. If status is updated to 'scheduled',
        automatically spawns a DoctorSchedule consultation slot.
        
        :param db: Async database session
        :param appointment_id: Unique database ID of the appointment
        :param data: Typed update payload matching DoctorAppointmentUpdate schema
        :return: Success status dictionary
        :raises HTTPException: If the appointment does not exist
        """
        try:
            logger.info(f"Updating appointment_id={appointment_id}")
            appt = await DoctorRepository.get_appointment_by_id(db, appointment_id)
            if not appt:
                logger.warning(f"Appointment ID {appointment_id} not found")
                raise HTTPException(status_code=404, detail="Appointment not found")
            
            if data.scheduled_at is not None:
                try:
                    appt.scheduled_at = datetime.fromisoformat(data.scheduled_at.replace('Z', '+00:00'))
                except Exception as parse_err:
                    logger.warning(f"Error parsing date string {data.scheduled_at}: {parse_err}")
                    raise HTTPException(status_code=400, detail="Invalid datetime ISO format")

            if data.status is not None:
                appt.status = data.status
                if data.status == "scheduled":
                    start = appt.scheduled_at or datetime.now()
                    new_schedule = DoctorSchedule(
                        doctor_id=appt.doctor_id,
                        task_name=f"Consultation: {appt.patient.name if appt.patient else 'Patient'} ({appt.preferred_time or 'TBD'})",
                        start_time=start,
                        end_time=start + timedelta(minutes=30),
                        status="scheduled"
                    )
                    db.add(new_schedule)
            
            await DoctorRepository.commit(db)
            return {"status": "updated"}
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error updating appointment {appointment_id}: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Internal server error updating appointment")
