"""
Appointment Module Repository Layer
Executes DB updates, reads, and queries for Appointments, Doctors, and SystemAlert notifications.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload
from app.shared.database.models import Appointment, Doctor, SystemAlert
from typing import List, Optional

class AppointmentRepository:
    @staticmethod
    async def create_appointment(db: AsyncSession, appt: Appointment) -> Appointment:
        """
        Saves a new Appointment model record to the database.
        
        :param db: Async database session
        :param appt: Appointment model object
        :return: Persisted Appointment object
        """
        db.add(appt)
        await db.commit()
        await db.refresh(appt)
        return appt

    @staticmethod
    async def get_patient_appointments(db: AsyncSession, patient_id: int) -> List[Appointment]:
        """
        Retrieves all appointments mapped to a patient ID.
        
        :param db: Async database session
        :param patient_id: Patient database ID
        :return: List of Appointment objects
        """
        result = await db.execute(select(Appointment).filter(Appointment.patient_id == patient_id))
        return list(result.scalars().all())

    @staticmethod
    async def get_doctor_appointments(db: AsyncSession, doctor_id: int) -> List[Appointment]:
        """
        Retrieves all appointments booked for a doctor ID.
        
        :param db: Async database session
        :param doctor_id: Doctor database ID
        :return: List of Appointment objects
        """
        result = await db.execute(select(Appointment).filter(Appointment.doctor_id == doctor_id))
        return list(result.scalars().all())

    @staticmethod
    async def get_appointment_by_id(db: AsyncSession, appointment_id: int) -> Optional[Appointment]:
        """
        Retrieves a single appointment by ID.
        
        :param db: Async database session
        :param appointment_id: Appointment database ID
        :return: Appointment model object or None
        """
        result = await db.execute(select(Appointment).filter(Appointment.id == appointment_id))
        return result.scalars().first()

    @staticmethod
    async def get_hospital_appointments(db: AsyncSession, hospital_id: int) -> List[Appointment]:
        """
        Retrieves hospital appointments including eager loading of patient and doctor profiles.
        
        :param db: Async database session
        :param hospital_id: Hospital database ID
        :return: List of Appointment objects
        """
        result = await db.execute(
            select(Appointment)
            .options(
                joinedload(Appointment.patient), 
                joinedload(Appointment.doctor).joinedload(Doctor.user)
            )
            .filter(Appointment.hospital_id == hospital_id)
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_doctor_by_id(db: AsyncSession, doctor_id: int) -> Optional[Doctor]:
        """
        Retrieves doctor profile details by doctor ID.
        
        :param db: Async database session
        :param doctor_id: Doctor ID
        :return: Doctor model object or None
        """
        result = await db.execute(select(Doctor).filter(Doctor.id == doctor_id))
        return result.scalars().first()

    @staticmethod
    async def create_alert(db: AsyncSession, alert: SystemAlert) -> None:
        """
        Adds a system alert record.
        
        :param db: Async database session
        :param alert: SystemAlert model instance
        """
        db.add(alert)
        await db.flush()

    @staticmethod
    async def commit(db: AsyncSession) -> None:
        """
        Commits active transaction session.
        
        :param db: Async database session
        """
        await db.commit()
