"""
Doctor Module Repository Layer
Implements DB operations for Doctors, DoctorSchedules, and Appointments using SQLAlchemy async model queries.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload, selectinload
from app.shared.database.models import User, Doctor, DoctorSchedule, Appointment
from typing import List, Optional

class DoctorRepository:
    @staticmethod
    async def get_assigned_patients(db: AsyncSession, doctor_id: int) -> List[User]:
        """
        Retrieves users assigned to a doctor (where assigned_doctor_id == doctor_id).
        
        :param db: Async database session
        :param doctor_id: Doctor ID
        :return: List of User model objects
        """
        result = await db.execute(
            select(User)
            .filter(User.assigned_doctor_id == doctor_id)
            .options(
                joinedload(User.assigned_doctor),
                joinedload(User.assigned_nurse)
            )
        )
        return list(result.unique().scalars().all())

    @staticmethod
    async def list_doctors(db: AsyncSession, hospital_id: Optional[int] = None) -> List[Doctor]:
        """
        Retrieves all doctor records, optionally filtering by hospital.
        
        :param db: Async database session
        :param hospital_id: Optional hospital ID filter
        :return: List of Doctor model objects
        """
        query = select(Doctor).options(joinedload(Doctor.user))
        if hospital_id:
            query = query.filter(Doctor.hospital_id == hospital_id)
        result = await db.execute(query)
        return list(result.unique().scalars().all())

    @staticmethod
    async def get_doctor_schedule(db: AsyncSession, doctor_id: int) -> List[DoctorSchedule]:
        """
        Retrieves all schedule tasks for a doctor.
        
        :param db: Async database session
        :param doctor_id: Doctor ID
        :return: List of DoctorSchedule records
        """
        result = await db.execute(select(DoctorSchedule).filter(DoctorSchedule.doctor_id == doctor_id))
        return list(result.scalars().all())

    @staticmethod
    async def create_schedule(db: AsyncSession, schedule: DoctorSchedule) -> DoctorSchedule:
        """
        Saves a DoctorSchedule object into the database.
        
        :param db: Async database session
        :param schedule: DoctorSchedule model instance
        :return: Persisted DoctorSchedule object
        """
        db.add(schedule)
        await db.commit()
        await db.refresh(schedule)
        return schedule

    @staticmethod
    async def get_doctor_by_id(db: AsyncSession, doctor_id: int) -> Optional[Doctor]:
        """
        Retrieves a single Doctor profile by ID, preloading their User profile.
        
        :param db: Async database session
        :param doctor_id: Doctor ID
        :return: Doctor model object or None
        """
        result = await db.execute(
            select(Doctor)
            .filter(Doctor.id == doctor_id)
            .options(joinedload(Doctor.user))
        )
        return result.scalars().first()

    @staticmethod
    async def create_doctor(db: AsyncSession, doctor: Doctor) -> Doctor:
        """
        Saves a Doctor model record into the database.
        
        :param db: Async database session
        :param doctor: Doctor model instance
        :return: Persisted Doctor object
        """
        db.add(doctor)
        await db.commit()
        await db.refresh(doctor)
        return doctor

    @staticmethod
    async def get_doctor_appointments(db: AsyncSession, doctor_id: int) -> List[Appointment]:
        """
        Retrieves all appointments mapped to a doctor ID.
        
        :param db: Async database session
        :param doctor_id: Doctor ID
        :return: List of Appointment model objects
        """
        result = await db.execute(
            select(Appointment)
            .filter(Appointment.doctor_id == doctor_id)
            .options(selectinload(Appointment.patient))
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_appointment_by_id(db: AsyncSession, appointment_id: int) -> Optional[Appointment]:
        """
        Retrieves a single appointment by ID.
        
        :param db: Async database session
        :param appointment_id: Appointment ID
        :return: Appointment model object or None
        """
        result = await db.execute(
            select(Appointment)
            .filter(Appointment.id == appointment_id)
            .options(selectinload(Appointment.patient))
        )
        return result.scalars().first()

    @staticmethod
    async def commit(db: AsyncSession) -> None:
        """
        Utility method to commit current transactions.
        
        :param db: Async database session
        """
        await db.commit()
