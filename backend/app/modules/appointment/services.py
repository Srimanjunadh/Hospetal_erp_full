"""
Appointment Module Service Layer
Contains business logic for booking appointments, status updates, detail edits, approvals, and PMS sync.
"""
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
from app.shared.database.models import Appointment, SystemAlert
from app.modules.appointment.repositories import AppointmentRepository
from app.modules.appointment.schemas import (
    AppointmentCreate, AppointmentUpdateDetails, AppointmentSyncPMS
)
from datetime import datetime
from typing import List, Optional, Dict, Any

logger = logging.getLogger(__name__)

class AppointmentService:
    @staticmethod
    async def book_appointment(db: AsyncSession, data: AppointmentCreate) -> Appointment:
        """
        Registers a new pending appointment.
        
        :param db: Async database session
        :param data: Typed AppointmentCreate payload
        :return: Persisted Appointment model object
        :raises HTTPException: If booking fails
        """
        try:
            logger.info(f"Booking appointment for patient_id={data.patient_id} doctor_id={data.doctor_id}")
            new_appointment = Appointment(
                patient_id=data.patient_id,
                doctor_id=data.doctor_id,
                hospital_id=data.hospital_id,
                scheduled_at=data.scheduled_at,
                preferred_time=data.preferred_time,
                reason=data.reason,
                type=data.type,
                status="pending"
            )
            appt = await AppointmentRepository.create_appointment(db, new_appointment)
            
            # Publish AppointmentBooked event
            try:
                from app.shared.events.event_bus import EventBus
                from app.shared.events.schemas import AppointmentBookedEvent
                event_data = AppointmentBookedEvent(
                    appointment_id=appt.id,
                    patient_id=appt.patient_id,
                    doctor_id=appt.doctor_id,
                    hospital_id=appt.hospital_id or 1,
                    scheduled_at=appt.scheduled_at.isoformat() if appt.scheduled_at else datetime.utcnow().isoformat(),
                    token_number=appt.token_number or 0
                )
                import asyncio
                asyncio.create_task(EventBus.publish("domain.appointment.booked", event_data))
            except Exception as e:
                pass
                
            return appt
        except Exception as e:
            logger.error(f"Error booking appointment: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Internal server error booking appointment")

    @staticmethod
    async def get_patient_appointments(db: AsyncSession, patient_id: int) -> List[Appointment]:
        """
        Lists all appointments for a patient.
        
        :param db: Async database session
        :param patient_id: Patient ID
        :return: List of Appointment model objects
        """
        try:
            logger.info(f"Listing appointments for patient_id={patient_id}")
            return await AppointmentRepository.get_patient_appointments(db, patient_id)
        except Exception as e:
            logger.error(f"Error fetching appointments for patient_id {patient_id}: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Error fetching patient appointments")

    @staticmethod
    async def get_doctor_appointments(db: AsyncSession, doctor_id: int) -> List[Appointment]:
        """
        Lists all appointments for a doctor.
        
        :param db: Async database session
        :param doctor_id: Doctor ID
        :return: List of Appointment model objects
        """
        try:
            logger.info(f"Listing appointments for doctor_id={doctor_id}")
            return await AppointmentRepository.get_doctor_appointments(db, doctor_id)
        except Exception as e:
            logger.error(f"Error fetching appointments for doctor_id {doctor_id}: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Error fetching doctor appointments")

    @staticmethod
    async def update_appointment_status(db: AsyncSession, appointment_id: int, status: str) -> Dict[str, str]:
        """
        Directly updates status code for an appointment.
        
        :param db: Async database session
        :param appointment_id: Appointment database ID
        :param status: New status text (e.g. pending, completed, cancelled)
        :return: Success details confirmation
        :raises HTTPException: If appointment not found
        """
        try:
            logger.info(f"Updating status for appointment_id={appointment_id} to status={status}")
            appointment = await AppointmentRepository.get_appointment_by_id(db, appointment_id)
            if not appointment:
                logger.warning(f"Appointment ID {appointment_id} not found for status update")
                raise HTTPException(status_code=404, detail="Appointment not found")
            appointment.status = status
            await AppointmentRepository.commit(db)
            return {"message": "Status updated successfully"}
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error updating appointment status for ID {appointment_id}: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Error updating status")

    @staticmethod
    async def update_appointment_details(
        db: AsyncSession, 
        appointment_id: int, 
        data: AppointmentUpdateDetails
    ) -> Dict[str, str]:
        """
        Updates detailed properties of an appointment (doctor_id, scheduled_at, preferred_time, status).
        
        :param db: Async database session
        :param appointment_id: Appointment database ID
        :param data: Typed updates payload
        :return: Success details confirmation
        :raises HTTPException: If appointment not found
        """
        try:
            logger.info(f"Updating details for appointment_id={appointment_id}")
            appointment = await AppointmentRepository.get_appointment_by_id(db, appointment_id)
            if not appointment:
                logger.warning(f"Appointment ID {appointment_id} not found for detail updates")
                raise HTTPException(status_code=404, detail="Appointment not found")
            
            if data.doctor_id is not None:
                appointment.doctor_id = data.doctor_id
            if data.scheduled_at is not None:
                try:
                    sched_str = data.scheduled_at
                    if sched_str:
                        # Normalize ISO datetime string
                        clean_str = sched_str.replace("Z", "+00:00").split(".")[0]
                        if 'T' in clean_str:
                            appointment.scheduled_at = datetime.fromisoformat(clean_str)
                        else:
                            appointment.scheduled_at = datetime.strptime(clean_str, "%Y-%m-%d %H:%M:%S")
                except Exception as parse_err:
                    logger.warning(f"Failed to parse datetime from {data.scheduled_at}: {parse_err}")
                    raise HTTPException(status_code=400, detail="Invalid scheduled_at format. Use ISO-8601 format.")
            if data.preferred_time is not None:
                appointment.preferred_time = data.preferred_time
            if data.status is not None:
                appointment.status = data.status
                
            await AppointmentRepository.commit(db)
            return {"message": "Appointment updated successfully"}
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error updating appointment details for ID {appointment_id}: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Error updating appointment details")

    @staticmethod
    async def get_hospital_appointments(db: AsyncSession, hospital_id: int) -> List[Dict[str, Any]]:
        """
        Retrieves serializable list of appointments scheduled for a hospital.
        
        :param db: Async database session
        :param hospital_id: Hospital database ID
        :return: List of appointment dictionaries with patient and doctor names
        """
        try:
            logger.info(f"Retrieving appointments for hospital_id={hospital_id}")
            appointments = await AppointmentRepository.get_hospital_appointments(db, hospital_id)
            return [
                {
                    "id": a.id,
                    "patient_name": a.patient.name if a.patient else "Unknown",
                    "doctor_name": a.doctor.user.name if a.doctor and a.doctor.user else "Unknown",
                    "doctor_id": a.doctor_id,
                    "scheduled_at": a.scheduled_at.isoformat() if a.scheduled_at else None,
                    "preferred_time": a.preferred_time,
                    "reason": a.reason,
                    "status": a.status,
                    "type": a.type
                } for a in appointments
            ]
        except Exception as e:
            logger.error(f"Error listing hospital appointments: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Error fetching hospital appointments")

    @staticmethod
    async def approve_appointment(db: AsyncSession, appointment_id: int) -> Dict[str, str]:
        """
        Approves appointment, sends alert notification to assigned doctor.
        
        :param db: Async database session
        :param appointment_id: Appointment database ID
        :return: Status response dictionary
        :raises HTTPException: If appointment not found
        """
        try:
            logger.info(f"Approving appointment_id={appointment_id}")
            appointment = await AppointmentRepository.get_appointment_by_id(db, appointment_id)
            if not appointment:
                logger.warning(f"Appointment ID {appointment_id} not found for approval")
                raise HTTPException(status_code=404, detail="Appointment not found")
            
            appointment.status = "admin_approved"
            
            # Create alert for Doctor
            doctor = await AppointmentRepository.get_doctor_by_id(db, appointment.doctor_id)
            if doctor:
                alert = SystemAlert(
                    hospital_id=appointment.hospital_id,
                    from_user_id=1, # Admin
                    to_user_id=doctor.user_id,
                    to_role="doctor",
                    message=f"New Appointment Request from Patient #{appointment.patient_id} at {appointment.preferred_time}. Please review.",
                    type="notification"
                )
                await AppointmentRepository.create_alert(db, alert)
            
            await AppointmentRepository.commit(db)
            return {"status": "Appointment Approved by Admin and Sent to Doctor"}
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error approving appointment {appointment_id}: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Error approving appointment")

    @staticmethod
    async def sync_pms_appointment(db: AsyncSession, data: AppointmentSyncPMS) -> Dict[str, Any]:
        """
        Synchronizes external/legacy PMS appointment scheduling records safely.
        
        :param db: Async database session
        :param data: Typed AppointmentSyncPMS sync payload
        :return: Synced details confirmation dictionary
        """
        try:
            logger.info(f"Syncing appointment for external hospital_id={data.pms_hospital_id} to internal hospital_id={data.hospital_id}")
            erp_hospital_id = data.hospital_id
            preferred_time = data.preferred_time or ''
            raw_reason = data.reason or ''
            doctor_name = data.doctor_name or ''
            patient_name = data.patient_name or ''
            pms_hospital_id = data.pms_hospital_id
            
            reason_parts = []
            if raw_reason:
                reason_parts.append(raw_reason)
            if doctor_name:
                reason_parts.append(f"[Dr: {doctor_name}]")
            if patient_name:
                reason_parts.append(f"[Patient: {patient_name}]")
            if pms_hospital_id:
                reason_parts.append(f"[PMS Hospital #{pms_hospital_id}]")
            
            full_reason = " | ".join(reason_parts) or "PMS Appointment"
            
            new_appointment = Appointment(
                patient_id=data.patient_id or 1,
                doctor_id=data.doctor_id or 1,
                hospital_id=erp_hospital_id,
                status=data.status or 'scheduled',
                reason=full_reason,
                preferred_time=preferred_time,
                type=data.type or 'offline',
                token_number=data.token_number or 0,
                queue_position=data.queue_position or 0
            )
            
            if data.scheduled_at:
                sched_str = str(data.scheduled_at).strip()
                # Clean subsecond/zone indicators if simple strptime matches
                clean_str = sched_str.replace("Z", "+00:00").split(".")[0]
                for fmt in ['%Y-%m-%dT%H:%M:%S', '%Y-%m-%d %H:%M:%S', '%Y-%m-%d %H:%M', '%Y_%m_%d', '%Y-%m-%d']:
                    try:
                        new_appointment.scheduled_at = datetime.strptime(clean_str, fmt)
                        break
                    except ValueError:
                        continue
            
            await AppointmentRepository.create_appointment(db, new_appointment)
            return {
                "success": True, 
                "message": f"Synced to ERP Hospital #{erp_hospital_id}",
                "appointment_id": new_appointment.id,
                "erp_hospital_id": erp_hospital_id
            }
        except Exception as e:
            logger.error(f"Error syncing PMS appointment: {e}", exc_info=True)
            return {"success": False, "message": str(e)}
