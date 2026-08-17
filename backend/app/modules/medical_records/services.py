"""
Medical Records & Laboratory Service Layer
Coordinates health records upload, vitals updates, test requests, pharmacy transmission, and admission finalizing.
"""
import logging
import os
import uuid
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, UploadFile
from app.shared.database.models import PatientVitals, LabTest, Prescription, PharmacyOrder, Admission, SystemAlert, HealthRecord
from app.modules.medical_records.repositories import MedicalRecordsRepository
from app.modules.medical_records.schemas import (
    VitalsUpdate, TestRequest, PrescribeRequest, AdmitRequest, AdmissionFinalizeRequest
)
from typing import List, Optional, Dict, Any

logger = logging.getLogger(__name__)

class MedicalRecordsService:
    @staticmethod
    async def update_patient_vitals(db: AsyncSession, data: VitalsUpdate) -> Dict[str, str]:
        """
        Validates referenced records, registers patient vitals, and alerts the assigned doctor.
        
        :param db: Async database session
        :param data: Typed patient vitals updates details
        :return: Status response confirmation
        :raises HTTPException: If the patient or nurse does not exist in the system database
        """
        try:
            logger.info(f"Updating vitals for patient_id={data.patient_id} by nurse_id={data.nurse_id}")
            
            # Verify patient existence
            patient = await MedicalRecordsRepository.get_patient_by_id(db, data.patient_id)
            if not patient:
                logger.warning(f"Failed to update vitals: Patient ID {data.patient_id} not found")
                raise HTTPException(status_code=404, detail="Patient record not found")
                
            # Verify nurse/staff existence (roles checked generally via user directory validation)
            nurse = await MedicalRecordsRepository.get_user_by_id(db, data.nurse_id)
            if not nurse:
                logger.warning(f"Failed to update vitals: Nurse ID {data.nurse_id} not found")
                raise HTTPException(status_code=404, detail="Nurse profile not found")

            vitals = PatientVitals(
                patient_id=data.patient_id,
                nurse_id=data.nurse_id,
                blood_pressure=data.blood_pressure,
                heart_rate=data.heart_rate,
                temperature=data.temperature,
                spo2=data.spo2,
                glucose=data.glucose,
                nursing_notes=data.nursing_notes
            )
            await MedicalRecordsRepository.create_vitals(db, vitals)
            
            if patient.assigned_doctor_id:
                alert = SystemAlert(
                    hospital_id=patient.hospital_id or 1,
                    from_user_id=data.nurse_id,
                    to_user_id=patient.assigned_doctor_id,
                    message=f"Vitals updated for patient {patient.name}",
                    type="notification"
                )
                await MedicalRecordsRepository.create_alert(db, alert)

            await MedicalRecordsRepository.commit(db)
            return {"status": "Vitals Updated & Doctor Notified"}
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error registering vitals: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Internal server error updating patient vitals")

    @staticmethod
    async def get_latest_vitals(db: AsyncSession, username: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves the most recent vital readings recorded for a username.
        
        :param db: Async database session
        :param username: Patient username
        :return: Vitals details dictionary or None
        :raises HTTPException: If patient does not exist
        """
        try:
            logger.info(f"Retrieving latest vitals for username={username}")
            patient = await MedicalRecordsRepository.get_patient_by_username(db, username)
            if not patient:
                raise HTTPException(status_code=404, detail="Patient not found")
            
            v = await MedicalRecordsRepository.get_latest_vitals_by_patient_id(db, patient.id)
            if not v:
                return None
            return {
                "id": v.id,
                "blood_pressure": v.blood_pressure,
                "heart_rate": v.heart_rate,
                "temperature": v.temperature,
                "spo2": v.spo2,
                "glucose": v.glucose,
                "nursing_notes": v.nursing_notes,
                "created_at": v.created_at.isoformat() if v.created_at else None
            }
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error retrieving vitals for {username}: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Error fetching vitals details")

    @staticmethod
    async def get_pending_tests(db: AsyncSession) -> List[LabTest]:
        """
        Lists pending laboratory tests requests.
        
        :param db: Async database session
        :return: List of LabTest database models in pending state
        """
        try:
            logger.info("Retrieving all pending laboratory tests")
            return await MedicalRecordsRepository.get_pending_tests(db)
        except Exception as e:
            logger.error(f"Error listing pending tests: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Error retrieving pending tests")

    @staticmethod
    async def upload_test_result(db: AsyncSession, test_id: str, file: UploadFile) -> Dict[str, str]:
        """
        Uploads lab test report file, updating test status to completed. Dispatches alerts.
        
        :param db: Async database session
        :param test_id: Unique Lab Test ID (TEST-XXXX)
        :param file: UploadFile object containing result attachment
        :return: Status response confirmation
        :raises HTTPException: If lab test request not found
        """
        try:
            logger.info(f"Uploading laboratory test report for test_id={test_id}")
            test = await MedicalRecordsRepository.get_test_by_test_id(db, test_id)
            if not test:
                logger.warning(f"Lab test request {test_id} not found")
                raise HTTPException(status_code=404, detail="Test not found")
            
            file_path = f"uploads/results/{test_id}_{file.filename}"
            os.makedirs("uploads/results", exist_ok=True)
            with open(file_path, "wb") as buffer:
                buffer.write(await file.read())
            
            test.status = "completed"
            test.file_path = file_path
            
            patient = await MedicalRecordsRepository.get_patient_by_id(db, test.patient_id)
            if patient:
                # Notify Doctor
                await MedicalRecordsRepository.create_alert(db, SystemAlert(hospital_id=test.hospital_id, from_user_id=test.patient_id, to_user_id=patient.assigned_doctor_id, message=f"Test results available for {patient.name}", type="notification"))
                # Notify Nurse
                await MedicalRecordsRepository.create_alert(db, SystemAlert(hospital_id=test.hospital_id, from_user_id=test.patient_id, to_user_id=patient.assigned_nurse_id, message=f"Test results available for {patient.name}", type="notification"))
                # Notify Patient
                await MedicalRecordsRepository.create_alert(db, SystemAlert(hospital_id=test.hospital_id, from_user_id=test.patient_id, to_user_id=patient.id, message=f"Your test results for {test.test_name} are ready", type="notification"))

            await MedicalRecordsRepository.commit(db)
            return {"status": "Result Uploaded & Parties Notified", "path": file_path}
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error uploading test results for {test_id}: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Error uploading test results")

    @staticmethod
    async def request_lab_test(db: AsyncSession, data: TestRequest) -> Dict[str, str]:
        """
        Creates a new laboratory test request.
        
        :param db: Async database session
        :param data: Typed TestRequest details
        :return: Confirmation of creation
        :raises HTTPException: If patient or doctor does not exist
        """
        try:
            logger.info(f"Requesting lab test '{data.test_name}' for patient_id={data.patient_id} by doctor_id={data.doctor_id}")
            patient = await MedicalRecordsRepository.get_patient_by_id(db, data.patient_id)
            if not patient:
                raise HTTPException(status_code=404, detail="Patient not found")
            doctor = await MedicalRecordsRepository.get_doctor_by_id(db, data.doctor_id)
            if not doctor:
                raise HTTPException(status_code=404, detail="Doctor not found")

            test = LabTest(
                hospital_id=data.hospital_id,
                patient_id=data.patient_id,
                doctor_id=data.doctor_id,
                test_name=data.test_name,
                status="pending",
                test_id=f"TEST-{uuid.uuid4().hex[:8].upper()}",
                cost=data.cost
            )
            await MedicalRecordsRepository.create_test(db, test)
            await MedicalRecordsRepository.commit(db)
            return {"status": "Test Requested", "test_id": test.test_id}
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error requesting lab test: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Error creating test request")

    @staticmethod
    async def prescribe_medication(db: AsyncSession, data: PrescribeRequest) -> Dict[str, Any]:
        """
        Issues patient prescription, dispatches pharmacy order queues.
        
        :param db: Async database session
        :param data: Typed PrescribeRequest details
        :return: Prescriptions details confirmation
        :raises HTTPException: If patient or doctor does not exist
        """
        try:
            logger.info(f"Creating prescription for patient_id={data.patient_id} by doctor_id={data.doctor_id}")
            patient = await MedicalRecordsRepository.get_patient_by_id(db, data.patient_id)
            if not patient:
                raise HTTPException(status_code=404, detail="Patient not found")
            doctor = await MedicalRecordsRepository.get_doctor_by_id(db, data.doctor_id)
            if not doctor:
                raise HTTPException(status_code=404, detail="Doctor not found")

            new_pres = Prescription(
                patient_id=data.patient_id,
                doctor_id=data.doctor_id,
                medicines=data.medicines,
                notes=data.notes,
                status="sent_to_pharmacy"
            )
            await MedicalRecordsRepository.create_prescription(db, new_pres)
            
            pharm_order = PharmacyOrder(
                hospital_id=data.hospital_id,
                patient_id=data.patient_id,
                prescription_id=new_pres.id,
                medicines=data.medicines,
                total_amount=0.0,
                status="pending"
            )
            await MedicalRecordsRepository.create_pharmacy_order(db, pharm_order)
            
            await MedicalRecordsRepository.commit(db)
            return {"status": "Prescription Transmitted to Pharmacy", "prescription_id": new_pres.id}
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error creating prescription: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Error creating prescription record")

    @staticmethod
    async def request_admission(db: AsyncSession, data: AdmitRequest) -> Dict[str, str]:
        """
        Recommends clinical admission, dispatches system task alert to admin.
        
        :param db: Async database session
        :param data: Typed AdmitRequest details
        :return: Status details response confirmation
        :raises HTTPException: If patient or doctor does not exist
        """
        try:
            logger.info(f"Requesting admission for patient_id={data.patient_id} recommended by doctor_id={data.doctor_id}")
            patient = await MedicalRecordsRepository.get_patient_by_id(db, data.patient_id)
            if not patient:
                raise HTTPException(status_code=404, detail="Patient not found")
            doctor_record = await MedicalRecordsRepository.get_doctor_by_id(db, data.doctor_id)
            if not doctor_record:
                raise HTTPException(status_code=404, detail="Doctor profile not found")

            admission = Admission(
                patient_id=data.patient_id,
                doctor_id=data.doctor_id,
                hospital_id=data.hospital_id,
                reason=data.reason,
                status="requested"
            )
            await MedicalRecordsRepository.create_admission(db, admission)
            
            nurse_name = patient.assigned_nurse.name if patient.assigned_nurse else "None"
            patient_name = patient.name
            doctor_name = doctor_record.user.name if doctor_record.user else f"ID {data.doctor_id}"
            from_user_id = doctor_record.user_id

            # Notify Admin
            hospital = await MedicalRecordsRepository.get_hospital_by_id(db, data.hospital_id)
            if hospital:
                alert = SystemAlert(
                    hospital_id=hospital.id,
                    from_user_id=from_user_id,
                    to_user_id=hospital.admin_id,
                    message=f"Admission request for {patient_name} (Assigned Nurse: {nurse_name}) recommended by Dr. {doctor_name}. Reason: {data.reason}",
                    type="task"
                )
                await MedicalRecordsRepository.create_alert(db, alert)
                
            await MedicalRecordsRepository.commit(db)
            return {"status": "Admission Requested. Waiting for Admin Room Assignment"}
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error recommending admission: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Error requesting admission")

    @staticmethod
    async def get_all_admissions(db: AsyncSession, hospital_id: Optional[int] = None) -> List[Admission]:
        """
        Lists all admissions in the system.
        
        :param db: Async database session
        :param hospital_id: Optional hospital ID
        :return: List of Admission records
        """
        try:
            return await MedicalRecordsRepository.get_admissions(db, hospital_id)
        except Exception as e:
            logger.error(f"Error listing admissions: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Error fetching admissions")

    @staticmethod
    async def get_pending_admissions(db: AsyncSession, hospital_id: int) -> List[Admission]:
        """
        Lists admission requests waiting for room assignment.
        
        :param db: Async database session
        :param hospital_id: Hospital database ID
        :return: List of Admission records in requested state
        """
        try:
            return await MedicalRecordsRepository.get_pending_admissions(db, hospital_id)
        except Exception as e:
            logger.error(f"Error listing pending admissions: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Error fetching pending admissions")

    @staticmethod
    async def finalize_admission(db: AsyncSession, data: AdmissionFinalizeRequest) -> Dict[str, str]:
        """
        Assigns room number and sets status of an admission recommendation to admitted. Alerts the nurse.
        
        :param db: Async database session
        :param data: Typed AdmissionFinalizeRequest detail
        :return: Status response confirmation details
        :raises HTTPException: If admission request does not exist
        """
        try:
            logger.info(f"Finalizing room assignment for admission_id={data.admission_id} to room={data.room_number}")
            admission = await MedicalRecordsRepository.get_admission_by_id(db, data.admission_id)
            if not admission:
                logger.warning(f"Admission ID {data.admission_id} not found for finalization")
                raise HTTPException(status_code=404, detail="Request not found")
            
            admission.room_number = data.room_number
            admission.status = "admitted"
            
            # Notify Nurse
            patient = await MedicalRecordsRepository.get_patient_by_id(db, admission.patient_id)
            if patient and patient.assigned_nurse_id:
                alert = SystemAlert(
                    hospital_id=admission.hospital_id,
                    from_user_id=admission.hospital_id,
                    to_user_id=patient.assigned_nurse_id,
                    message=f"New patient {patient.name} admitted to room {data.room_number}",
                    type="notification"
                )
                await MedicalRecordsRepository.create_alert(db, alert)
                
            await MedicalRecordsRepository.commit(db)
            return {"status": "Patient Admitted & Nurse Notified"}
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error finalising admission ID {data.admission_id}: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Error finalising admission room assignment")

    @staticmethod
    async def get_patient_tests(db: AsyncSession, patient_id: int) -> List[LabTest]:
        """
        Lists all lab test requests mapped to a patient ID.
        
        :param db: Async session
        :param patient_id: Patient ID
        :return: List of LabTest records
        """
        try:
            return await MedicalRecordsRepository.get_patient_tests(db, patient_id)
        except Exception as e:
            logger.error(f"Error fetching tests for patient {patient_id}: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Error listing patient laboratory tests")

    @staticmethod
    async def get_patient_prescriptions(db: AsyncSession, patient_id: int) -> List[Prescription]:
        """
        Lists all prescription records issued to a patient ID.
        
        :param db: Async session
        :param patient_id: Patient ID
        :return: List of Prescription records
        """
        try:
            return await MedicalRecordsRepository.get_patient_prescriptions(db, patient_id)
        except Exception as e:
            logger.error(f"Error fetching prescriptions for patient {patient_id}: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Error listing patient prescriptions")

    @staticmethod
    async def get_patient_history(db: AsyncSession, patient_id: int) -> List[Dict[str, Any]]:
        """
        Compiles prescriptions, lab tests, and hospital admission details into a single chronologically sorted timeline log.
        
        :param db: Async database session
        :param patient_id: Database ID of the patient
        :return: Combined timeline dict records list
        """
        try:
            logger.info(f"Compiling clinical timeline history for patient_id={patient_id}")
            records = []
            
            # 1. Prescriptions
            prescriptions = await MedicalRecordsRepository.get_patient_prescriptions(db, patient_id)
            for p in prescriptions:
                records.append({
                    "id": f"PR-{p.id:04d}",
                    "name": "PRESCRIPTION SUMMARY",
                    "type": "PRESCRIPTION",
                    "provider": f"Dr. {p.doctor.user.name}" if p.doctor and p.doctor.user else "Unknown",
                    "date": p.created_at.strftime("%Y-%m-%d"),
                    "size": "24 KB",
                    "status": "SECURE",
                    "metadata": p.medicines
                })

            # 2. Lab Tests
            tests = await MedicalRecordsRepository.get_patient_tests(db, patient_id)
            for t in tests:
                records.append({
                    "id": t.test_id,
                    "name": f"{t.test_name.upper()} RESULT",
                    "type": "LAB_RESULT",
                    "provider": f"Dr. {t.doctor.user.name}" if t.doctor and t.doctor.user else "Unknown",
                    "date": t.created_at.strftime("%Y-%m-%d"),
                    "size": "1.4 MB",
                    "status": "SECURE",
                    "metadata": {"status": t.status}
                })

            # 3. Admissions
            admissions = await MedicalRecordsRepository.get_patient_admissions(db, patient_id)
            for a in admissions:
                record_date = a.admitted_at or datetime.utcnow()
                records.append({
                    "id": f"ADM-{a.id:04d}",
                    "name": "HOSPITAL ADMISSION RECORD",
                    "type": "ADMISSION",
                    "provider": f"Dr. {a.doctor.user.name}" if a.doctor and a.doctor.user else "Unknown",
                    "date": record_date.strftime("%Y-%m-%d") if record_date else "N/A",
                    "size": "850 KB",
                    "status": "SECURE",
                    "metadata": {"reason": a.reason, "room": a.room_number}
                })

            records.sort(key=lambda x: x['date'], reverse=True)
            return records
        except Exception as e:
            logger.error(f"Error compiling medical history for patient {patient_id}: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Error compiling patient medical history timeline")

    @staticmethod
    async def upload_health_record(db: AsyncSession, patient_id: int, title: str, record_type: str, file: UploadFile) -> Dict[str, Any]:
        """
        Uploads and registers an external health document (PDF/Image) for a patient.
        
        :param db: Async database session
        :param patient_id: Patient database ID
        :param title: Custom document title
        :param record_type: Record type category (e.g. Allergy details, external report)
        :param file: UploadFile attachment payload
        :return: Created record verification
        """
        try:
            logger.info(f"Uploading external health record '{title}' for patient_id={patient_id}")
            file_path = f"uploads/records/{patient_id}_{uuid.uuid4().hex[:8]}_{file.filename}"
            os.makedirs("uploads/records", exist_ok=True)
            with open(file_path, "wb") as buffer:
                buffer.write(await file.read())
                
            new_record = HealthRecord(
                user_id=patient_id,
                title=title,
                record_type=record_type,
                attachments=[{"url": file_path, "fileName": file.filename}]
            )
            await MedicalRecordsRepository.create_health_record(db, new_record)
            await MedicalRecordsRepository.commit(db)
            return {"status": "Record Uploaded", "record_id": new_record.id}
        except Exception as e:
            logger.error(f"Error uploading health record for patient {patient_id}: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Error uploading health document record")
