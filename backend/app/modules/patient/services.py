"""
Patient Module Service Layer
Contains business logic for patient listing, retrieving specific patient profiles, fetching prescriptions, and appointments.
"""
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
from app.modules.patient.repositories import PatientRepository
from typing import List, Optional, Dict, Any

logger = logging.getLogger(__name__)

class PatientService:
    @staticmethod
    async def list_patients(db: AsyncSession, hospital_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Retrieves a list of patients. Optionally filters by hospital_id.
        
        :param db: Async database session
        :param hospital_id: Optional hospital ID to filter patients
        :return: List of serializable patient dictionary objects
        :raises HTTPException: If a database error occurs during retrieval
        """
        try:
            logger.info(f"Listing patients filter: hospital_id={hospital_id}")
            users = await PatientRepository.list_patients(db, hospital_id)
            output = []
            for u in users:
                u_dict = {
                    "id": u.id,
                    "username": u.username,
                    "name": u.name,
                    "role": u.role,
                    "phone": u.phone,
                    "assigned_doctor": {
                        "id": u.assigned_doctor.id,
                        "user": {
                            "name": u.assigned_doctor.user.name if u.assigned_doctor.user else "Unknown"
                        } if u.assigned_doctor.user else None
                    } if u.assigned_doctor else None,
                    "assigned_nurse": {
                        "id": u.assigned_nurse.id,
                        "name": u.assigned_nurse.name
                    } if u.assigned_nurse else None,
                    "created_at": u.created_at.isoformat() if u.created_at else None
                }
                output.append(u_dict)
            return output
        except Exception as e:
            logger.error(f"Error listing patients: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Internal server error listing patients")

    @staticmethod
    async def get_patient(db: AsyncSession, patient_id: int) -> Dict[str, Any]:
        """
        Retrieves the profile of a patient by their unique database ID.
        
        :param db: Async database session
        :param patient_id: Database ID of the patient to find
        :return: Dictionary object representing patient details
        :raises HTTPException: If the patient is not found or a database error occurs
        """
        try:
            logger.info(f"Retrieving patient details for patient_id={patient_id}")
            u = await PatientRepository.get_patient_by_id(db, patient_id)
            if not u:
                logger.warning(f"Patient with ID {patient_id} not found")
                raise HTTPException(status_code=404, detail="Patient not found")
            return {
                "id": u.id,
                "username": u.username,
                "name": u.name,
                "role": u.role,
                "phone": u.phone,
                "email": u.email,
                "age": u.age,
                "location": u.location,
                "weight": u.weight,
                "hospital_id": u.hospital_id,
                "assigned_doctor_id": u.assigned_doctor_id,
                "assigned_nurse_id": u.assigned_nurse_id,
                "created_at": u.created_at.isoformat() if u.created_at else None
            }
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error fetching patient with ID {patient_id}: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Internal server error fetching patient profile")

    @staticmethod
    async def get_patient_prescriptions(db: AsyncSession, username: str) -> List[Dict[str, Any]]:
        """
        Retrieves all historical prescriptions for a patient identified by username.
        
        :param db: Async database session
        :param username: Username of the patient
        :return: List of prescriptions formatted as dictionary objects
        :raises HTTPException: If the patient is not found or a database error occurs
        """
        try:
            logger.info(f"Retrieving prescriptions for patient: username={username}")
            patient = await PatientRepository.get_patient_by_username(db, username)
            if not patient:
                logger.warning(f"Patient with username {username} not found")
                raise HTTPException(status_code=404, detail="Patient not found")
                
            prescriptions = await PatientRepository.get_patient_prescriptions(db, patient.id)
            return [
                {
                    "id": p.id,
                    "medicines": p.medicines,
                    "notes": p.notes,
                    "appointment_id": p.appointment_id
                } for p in prescriptions
            ]
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error fetching prescriptions for username {username}: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Internal server error fetching prescriptions")

    @staticmethod
    async def get_patient_appointments(db: AsyncSession, patient_id: int) -> List[Dict[str, Any]]:
        """
        Retrieves all appointments created for a patient.
        
        :param db: Async database session
        :param patient_id: Unique database ID of the patient
        :return: List of appointment dictionaries
        :raises HTTPException: If a database error occurs
        """
        try:
            logger.info(f"Retrieving appointments for patient_id={patient_id}")
            appointments = await PatientRepository.get_patient_appointments(db, patient_id)
            return [
                {
                    "id": a.id,
                    "patient_id": a.patient_id,
                    "doctor_id": a.doctor_id,
                    "hospital_id": a.hospital_id,
                    "status": a.status,
                    "preferred_time": a.preferred_time,
                    "reason": a.reason,
                    "type": a.type,
                    "scheduled_at": a.scheduled_at.isoformat() if a.scheduled_at else None
                } for a in appointments
            ]
        except Exception as e:
            logger.error(f"Error fetching appointments for patient_id {patient_id}: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Internal server error fetching patient appointments")

    @staticmethod
    async def handle_patient_registered(data: dict) -> None:
        """
        Subscribed event handler to provision User record inside patient.db database context.
        """
        from app.db.session import AsyncSessionLocal
        from app.shared.database.models import User
        from sqlalchemy.future import select
        
        user_id = data["patient_id"]
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(User).filter(User.id == user_id))
            user = result.scalars().first()
            if not user:
                user = User(
                    id=user_id,
                    username=data["email"] or f"patient_{user_id}",
                    email=data["email"],
                    name=data["name"],
                    phone=data["phone"],
                    role="patient",
                    hospital_id=1
                )
                db.add(user)
                await db.commit()
                logger.info(f"Asynchronously provisioned patient user in patient.db ID={user_id}")

