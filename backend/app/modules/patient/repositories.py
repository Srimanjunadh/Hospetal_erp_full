"""
Patient Module Repository Layer
Communicates directly with the database using SQLAlchemy async queries.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload
from app.shared.database.models import User, Doctor, Prescription, Appointment
from typing import List, Optional

class PatientRepository:
    @staticmethod
    async def list_patients(db: AsyncSession, hospital_id: Optional[int] = None) -> List[User]:
        """
        Queries the database for all users with a 'patient' role.
        
        :param db: Async database session
        :param hospital_id: Optional hospital ID filter
        :return: List of User model objects with patient role
        """
        query = select(User).filter(User.role == "patient")
        if hospital_id:
            query = query.filter(User.hospital_id == hospital_id)
        
        result = await db.execute(
            query.options(
                joinedload(User.assigned_doctor).joinedload(Doctor.user),
                joinedload(User.assigned_nurse)
            )
        )
        return list(result.unique().scalars().all())

    @staticmethod
    async def get_patient_by_id(db: AsyncSession, patient_id: int) -> Optional[User]:
        """
        Retrieves a single user with role 'patient' by ID.
        
        :param db: Async database session
        :param patient_id: Unique database ID of the user
        :return: User model object or None if not found
        """
        result = await db.execute(
            select(User)
            .filter(User.id == patient_id)
            .options(
                joinedload(User.assigned_doctor),
                joinedload(User.assigned_nurse)
            )
        )
        return result.unique().scalars().first()

    @staticmethod
    async def get_patient_by_username(db: AsyncSession, username: str) -> Optional[User]:
        """
        Retrieves a patient profile by username.
        
        :param db: Async database session
        :param username: Alphanumeric username to search
        :return: User model object or None
        """
        result = await db.execute(select(User).filter(User.username == username))
        return result.scalars().first()

    @staticmethod
    async def get_patient_prescriptions(db: AsyncSession, patient_id: int) -> List[Prescription]:
        """
        Queries all prescriptions associated with a patient ID by joining on appointments.
        
        :param db: Async database session
        :param patient_id: Database ID of the patient
        :return: List of Prescription model objects
        """
        result = await db.execute(
            select(Prescription)
            .join(Appointment)
            .filter(Appointment.patient_id == patient_id)
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_patient_appointments(db: AsyncSession, patient_id: int) -> List[Appointment]:
        """
        Queries all appointments booked for a patient ID.
        
        :param db: Async database session
        :param patient_id: Database ID of the patient
        :return: List of Appointment model objects
        """
        result = await db.execute(select(Appointment).filter(Appointment.patient_id == patient_id))
        return list(result.scalars().all())
