"""
Medical Records & Laboratory Repository Layer
Performs direct database reads, writes, and modifications on patient vitals, admissions, lab tests, prescriptions, and health documents.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload
from app.shared.database.models import User, PatientVitals, LabTest, Doctor, Admission, Prescription, PharmacyOrder, SystemAlert, Hospital, HealthRecord
from typing import List, Optional

class MedicalRecordsRepository:
    @staticmethod
    async def create_vitals(db: AsyncSession, vitals: PatientVitals) -> PatientVitals:
        """
        Saves a new PatientVitals database entry.
        
        :param db: Async database session
        :param vitals: PatientVitals model instance
        :return: Persisted PatientVitals object
        """
        db.add(vitals)
        await db.flush()
        return vitals

    @staticmethod
    async def get_patient_by_id(db: AsyncSession, patient_id: int) -> Optional[User]:
        """
        Retrieves a patient user record by ID.
        
        :param db: Async database session
        :param patient_id: Patient user ID
        :return: User profile or None
        """
        result = await db.execute(select(User).filter(User.id == patient_id).options(joinedload(User.assigned_nurse)))
        return result.scalars().first()

    @staticmethod
    async def get_user_by_id(db: AsyncSession, user_id: int) -> Optional[User]:
        """
        Retrieves a general user record by ID (e.g. nurse/staff lookup).
        
        :param db: Async database session
        :param user_id: User database ID
        :return: User profile or None
        """
        result = await db.execute(select(User).filter(User.id == user_id))
        return result.scalars().first()

    @staticmethod
    async def get_patient_by_username(db: AsyncSession, username: str) -> Optional[User]:
        """
        Retrieves user record by username.
        
        :param db: Async database session
        :param username: Alphanumeric username to search
        :return: User profile or None
        """
        result = await db.execute(select(User).filter(User.username == username))
        return result.scalars().first()

    @staticmethod
    async def create_alert(db: AsyncSession, alert: SystemAlert) -> None:
        """
        Creates a system alert notification.
        
        :param db: Async database session
        :param alert: SystemAlert model instance
        """
        db.add(alert)
        await db.flush()

    @staticmethod
    async def get_latest_vitals_by_patient_id(db: AsyncSession, patient_id: int) -> Optional[PatientVitals]:
        """
        Retrieves the most recent vital statistics record for a patient.
        
        :param db: Async database session
        :param patient_id: Patient ID
        :return: PatientVitals object or None
        """
        result = await db.execute(
            select(PatientVitals)
            .filter(PatientVitals.patient_id == patient_id)
            .order_by(PatientVitals.created_at.desc())
        )
        return result.scalars().first()

    @staticmethod
    async def get_pending_tests(db: AsyncSession) -> List[LabTest]:
        """
        Lists pending lab tests.
        
        :param db: Async database session
        :return: List of LabTest records
        """
        result = await db.execute(
            select(LabTest)
            .filter(LabTest.status == "pending")
            .options(joinedload(LabTest.patient), joinedload(LabTest.doctor).joinedload(Doctor.user))
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_test_by_test_id(db: AsyncSession, test_id: str) -> Optional[LabTest]:
        """
        Retrieves laboratory test details by custom test_id code.
        
        :param db: Async database session
        :param test_id: Lab Test ID (TEST-XXXX)
        :return: LabTest model object or None
        """
        result = await db.execute(select(LabTest).filter(LabTest.test_id == test_id))
        return result.scalars().first()

    @staticmethod
    async def create_test(db: AsyncSession, test: LabTest) -> LabTest:
        """
        Saves a LabTest request database record.
        
        :param db: Async database session
        :param test: LabTest model instance
        :return: Persisted LabTest record
        """
        db.add(test)
        await db.flush()
        return test

    @staticmethod
    async def create_prescription(db: AsyncSession, pres: Prescription) -> Prescription:
        """
        Saves a new Prescription record.
        
        :param db: Async database session
        :param pres: Prescription model instance
        :return: Persisted Prescription record
        """
        db.add(pres)
        await db.flush()
        return pres

    @staticmethod
    async def create_pharmacy_order(db: AsyncSession, order: PharmacyOrder) -> PharmacyOrder:
        """
        Saves a PharmacyOrder queue record.
        
        :param db: Async database session
        :param order: PharmacyOrder model instance
        :return: Persisted PharmacyOrder record
        """
        db.add(order)
        await db.flush()
        return order

    @staticmethod
    async def create_admission(db: AsyncSession, admission: Admission) -> Admission:
        """
        Saves a new Admission request record.
        
        :param db: Async database session
        :param admission: Admission model instance
        :return: Persisted Admission record
        """
        db.add(admission)
        await db.flush()
        return admission

    @staticmethod
    async def get_doctor_by_id(db: AsyncSession, doctor_id: int) -> Optional[Doctor]:
        """
        Retrieves doctor profile details by ID, preloading user details.
        
        :param db: Async database session
        :param doctor_id: Doctor ID
        :return: Doctor record or None
        """
        result = await db.execute(select(Doctor).filter(Doctor.id == doctor_id).options(joinedload(Doctor.user)))
        return result.scalars().first()

    @staticmethod
    async def get_hospital_by_id(db: AsyncSession, hospital_id: int) -> Optional[Hospital]:
        """
        Retrieves hospital details by ID.
        
        :param db: Async database session
        :param hospital_id: Hospital database ID
        :return: Hospital record or None
        """
        result = await db.execute(select(Hospital).filter(Hospital.id == hospital_id))
        return result.scalars().first()

    @staticmethod
    async def get_admissions(db: AsyncSession, hospital_id: Optional[int] = None) -> List[Admission]:
        """
        Lists admissions.
        
        :param db: Async database session
        :param hospital_id: Optional hospital ID filter
        :return: List of admissions
        """
        query = select(Admission).options(joinedload(Admission.patient), joinedload(Admission.doctor))
        if hospital_id:
            query = query.filter(Admission.hospital_id == hospital_id)
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_pending_admissions(db: AsyncSession, hospital_id: int) -> List[Admission]:
        """
        Lists pending admission requests for a hospital.
        
        :param db: Async database session
        :param hospital_id: Hospital database ID
        :return: List of pending admissions
        """
        result = await db.execute(
            select(Admission)
            .filter(Admission.hospital_id == hospital_id, Admission.status == "requested")
            .options(joinedload(Admission.patient), joinedload(Admission.doctor))
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_admission_by_id(db: AsyncSession, admission_id: int) -> Optional[Admission]:
        """
        Retrieves admission request details by ID.
        
        :param db: Async database session
        :param admission_id: Admission database ID
        :return: Admission record or None
        """
        result = await db.execute(select(Admission).filter(Admission.id == admission_id))
        return result.scalars().first()

    @staticmethod
    async def get_patient_tests(db: AsyncSession, patient_id: int) -> List[LabTest]:
        """
        Lists laboratory tests requested for a patient.
        
        :param db: Async database session
        :param patient_id: Patient ID
        :return: List of LabTest records
        """
        result = await db.execute(select(LabTest).filter(LabTest.patient_id == patient_id).options(joinedload(LabTest.doctor)))
        return list(result.scalars().all())

    @staticmethod
    async def get_patient_prescriptions(db: AsyncSession, patient_id: int) -> List[Prescription]:
        """
        Lists prescriptions written for a patient, preloading doctor user detail.
        
        :param db: Async database session
        :param patient_id: Patient ID
        :return: List of Prescription records sorted descending by created timestamp
        """
        result = await db.execute(
            select(Prescription)
            .filter(Prescription.patient_id == patient_id)
            .options(joinedload(Prescription.doctor).joinedload(Doctor.user))
            .order_by(Prescription.created_at.desc())
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_patient_admissions(db: AsyncSession, patient_id: int) -> List[Admission]:
        """
        Lists admissions records for a patient.
        
        :param db: Async database session
        :param patient_id: Patient ID
        :return: List of Admission records
        """
        result = await db.execute(
            select(Admission)
            .filter(Admission.patient_id == patient_id)
            .options(joinedload(Admission.doctor).joinedload(Doctor.user))
        )
        return list(result.scalars().all())

    @staticmethod
    async def create_health_record(db: AsyncSession, record: HealthRecord) -> HealthRecord:
        """
        Saves a new HealthRecord upload entry.
        
        :param db: Async database session
        :param record: HealthRecord model instance
        :return: Persisted HealthRecord record
        """
        db.add(record)
        await db.flush()
        return record

    @staticmethod
    async def commit(db: AsyncSession) -> None:
        """
        Commits active transaction session.
        
        :param db: Async database session
        """
        await db.commit()
