from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, JSON, Text, Float, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True) # Added for DOC ID / Patient ID login
    role = Column(String)  # patient, doctor, nurse, hospital_admin, super_admin, test_staff
    name = Column(String)
    email = Column(String, unique=True, index=True, nullable=True)
    phone = Column(String)
    hashed_password = Column(String)
    cleartext_password = Column(String, nullable=True) 
    
    # Patient specific fields
    age = Column(Integer, nullable=True)
    location = Column(String, nullable=True)
    weight = Column(Float, nullable=True)
    
    assigned_doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=True)
    assigned_nurse_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    assigned_doctor = relationship("Doctor", foreign_keys=[assigned_doctor_id], back_populates="assigned_patients")
    assigned_nurse = relationship("User", foreign_keys=[assigned_nurse_id], remote_side=[id])

class Doctor(Base):
    __tablename__ = "doctors"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    specialization = Column(String)
    experience = Column(Integer)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"))
    room_number = Column(String) 
    status = Column(String, default="on-duty") # on-duty / off-duty
    
    user = relationship("User", foreign_keys=[user_id])
    assigned_patients = relationship("User", foreign_keys="User.assigned_doctor_id", back_populates="assigned_doctor")

class Appointment(Base):
    __tablename__ = "appointments"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"))
    doctor_id = Column(Integer, ForeignKey("doctors.id"))
    hospital_id = Column(Integer, ForeignKey("hospitals.id"))
    status = Column(String, default="pending")  # pending, scheduled, completed, cancelled, in-queue, in-consult
    scheduled_at = Column(DateTime, nullable=True) 
    preferred_time = Column(String, nullable=True) 
    reason = Column(Text, nullable=True)
    type = Column(String)  # online, offline
    
    # PMS Queue Management Fields
    token_number = Column(Integer, default=0)
    queue_position = Column(Integer, default=0)
    estimated_wait_time = Column(Integer, default=0) # in minutes
    
    patient = relationship("User")
    doctor = relationship("Doctor")

class Prescription(Base):
    __tablename__ = "prescriptions"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"))
    doctor_id = Column(Integer, ForeignKey("doctors.id"))
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=True)
    medicines = Column(JSON) # List of {name, dosage, duration}
    notes = Column(Text)
    status = Column(String, default="sent_to_pharmacy")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    patient = relationship("User")
    doctor = relationship("Doctor")

class InventoryItem(Base):
    __tablename__ = "inventory"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"))
    name = Column(String, index=True)
    category = Column(String) # medicine, equipment
    quantity = Column(Integer)
    power = Column(String, nullable=True) # e.g. 500mg, 10ml
    min_threshold = Column(Integer)
    unit_price = Column(Float)
    expiry_date = Column(DateTime)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class PharmacyOrder(Base):
    __tablename__ = "pharmacy_orders"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"))
    patient_id = Column(Integer, ForeignKey("users.id"))
    prescription_id = Column(Integer, ForeignKey("prescriptions.id"), nullable=True)
    medicines = Column(JSON)
    total_amount = Column(Float)
    status = Column(String, default="pending") # pending, completed, cancelled
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    patient = relationship("User")

class PatientVitals(Base):
    __tablename__ = "patient_vitals"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"))
    nurse_id = Column(Integer, ForeignKey("users.id"))
    blood_pressure = Column(String)
    heart_rate = Column(Integer)
    temperature = Column(Float)
    spo2 = Column(Integer)
    glucose = Column(Float)
    nursing_notes = Column(Text)
    food_intake = Column(String, nullable=True)
    medication_status = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    patient = relationship("User", foreign_keys=[patient_id])
    nurse = relationship("User", foreign_keys=[nurse_id])

class Hospital(Base):
    __tablename__ = "hospitals"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    location = Column(String)
    node_code = Column(String, unique=True, index=True) # 4-digit Unique Facility ID
    specialization = Column(String, nullable=True)
    admin_id = Column(Integer, ForeignKey("users.id"))
    subscription_status = Column(String, default="ACTIVE")
    subscription_expiry = Column(DateTime)
    total_revenue = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    admin = relationship("User", foreign_keys=[admin_id])

class LabTest(Base):
    __tablename__ = "lab_tests"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"))
    patient_id = Column(Integer, ForeignKey("users.id"))
    doctor_id = Column(Integer, ForeignKey("doctors.id"))
    test_name = Column(String)
    status = Column(String, default="pending") # pending, completed
    file_path = Column(String, nullable=True) 
    test_id = Column(String, unique=True) # Unique Test Reference
    cost = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    patient = relationship("User")
    doctor = relationship("Doctor")

class Admission(Base):
    __tablename__ = "admissions"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"))
    doctor_id = Column(Integer, ForeignKey("doctors.id"))
    hospital_id = Column(Integer, ForeignKey("hospitals.id"))
    reason = Column(Text)
    room_number = Column(String, nullable=True) # Assigned by Admin
    status = Column(String, default="requested") # requested, admitted, discharged
    admitted_at = Column(DateTime(timezone=True), server_default=func.now())
    discharged_at = Column(DateTime, nullable=True)
    
    patient = relationship("User")
    doctor = relationship("Doctor")

class SystemAlert(Base):
    __tablename__ = "system_alerts"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"))
    from_user_id = Column(Integer, ForeignKey("users.id"))
    to_user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Null for broadcast or specific roles
    to_role = Column(String, nullable=True) # e.g., 'doctor', 'hospital_admin'
    message = Column(Text)
    type = Column(String) # emergency, notification, task
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Billing(Base):
    __tablename__ = "billing"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"))
    hospital_id = Column(Integer, ForeignKey("hospitals.id"))
    amount = Column(Float)
    reason = Column(String)
    status = Column(String, default="unpaid")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    patient = relationship("User")
    hospital = relationship("Hospital")

class DoctorSchedule(Base):
    __tablename__ = "doctor_schedules"
    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id"))
    task_name = Column(String)
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    status = Column(String)
    notes = Column(Text, nullable=True)
    
    doctor = relationship("Doctor")

class StaffSchedule(Base):
    __tablename__ = "staff_schedules"
    id = Column(Integer, primary_key=True, index=True)
    staff_id = Column(Integer, ForeignKey("users.id"))
    task_name = Column(String)
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    status = Column(String)
    notes = Column(Text, nullable=True)
    
class AmbulanceRequest(Base):
    __tablename__ = "ambulance_requests"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"))
    patient_id = Column(Integer, ForeignKey("users.id"))
    nurse_id = Column(Integer, ForeignKey("users.id"))
    pickup_location = Column(String)
    status = Column(String, default="dispatched") # dispatched, arrived, completed
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    patient = relationship("User", foreign_keys=[patient_id])
    nurse = relationship("User", foreign_keys=[nurse_id])

class WardBed(Base):
    __tablename__ = "ward_beds"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"))
    floor = Column(String)
    room_number = Column(String)
    bed_number = Column(String)
    dept = Column(String, default="GENERAL")
    o2_lvl = Column(String, default="98%")
    status = Column(String, default="available")
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    hospital = relationship("Hospital")
    patient = relationship("User")

class Ambulance(Base):
    __tablename__ = "ambulances"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"))
    vehicle_number = Column(String, unique=True)
    driver_name = Column(String)
    driver_phone = Column(String, nullable=True)
    vehicle_size = Column(String, default="MEDIUM") # SMALL, MEDIUM, LARGE
    status = Column(String, default="READY") # READY, ENGAGED, MAINTENANCE
    location = Column(String, default="BASE")
    last_lat = Column(Float, nullable=True)
    last_lng = Column(Float, nullable=True)

    hospital = relationship("Hospital")

class NurseMedicineRequest(Base):
    __tablename__ = "nurse_medicine_requests"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"))
    patient_id = Column(Integer, ForeignKey("users.id"))
    nurse_id = Column(Integer, ForeignKey("users.id"))
    medicines = Column(JSON) # List of {name, quantity, source: 'doctor' | 'nurse'}
    status = Column(String, default="pending") # pending, packed, done
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    patient = relationship("User", foreign_keys=[patient_id])
    nurse = relationship("User", foreign_keys=[nurse_id])

class BloodBank(Base):
    __tablename__ = "blood_bank"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"))
    blood_group = Column(String) # A+, A-, B+, B-, AB+, AB-, O+, O-
    units_available = Column(Float, default=0.0)
    last_updated = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

class BloodRequest(Base):
    __tablename__ = "blood_requests"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"))
    patient_id = Column(Integer, ForeignKey("users.id"))
    doctor_id = Column(Integer, ForeignKey("doctors.id"))
    blood_group = Column(String)
    units_required = Column(Float)
    urgency = Column(String, default="NORMAL") # NORMAL, URGENT, CRITICAL
    status = Column(String, default="PENDING") # PENDING, APPROVED, DISPATCHED, COMPLETED
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    patient = relationship("User")
    doctor = relationship("Doctor")

class SurgicalSchedule(Base):
    __tablename__ = "surgical_schedules"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"))
    patient_id = Column(Integer, ForeignKey("users.id"))
    doctor_id = Column(Integer, ForeignKey("doctors.id"))
    ot_room_number = Column(String)
    procedure_name = Column(String)
    scheduled_at = Column(DateTime)
    status = Column(String, default="SCHEDULED") # SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
    checklist_status = Column(JSON, default={}) # WHO Surgical Safety Checklist items
    notes = Column(Text, nullable=True)

    patient = relationship("User")
    doctor = relationship("Doctor")

class PatientRiskScore(Base):
    __tablename__ = "patient_risk_scores"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"))
    score_value = Column(Float) # 0 to 10
    risk_level = Column(String) # LOW, MODERATE, HIGH, CRITICAL
    indicators = Column(JSON) # Contributing factors (vitals, age, etc.)
    calculated_at = Column(DateTime(timezone=True), server_default=func.now())

    patient = relationship("User")

class HealthRecord(Base):
    __tablename__ = "health_records"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=True)
    record_type = Column(String) # Prescription, Report, Scan, etc.
    title = Column(String)
    description = Column(Text, nullable=True)
    doctor_name = Column(String, nullable=True)
    attachments = Column(JSON) # List of {url, fileName, fileType, cloudinaryPublicId}
    tags = Column(JSON, default=[])
    is_important = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", foreign_keys=[user_id])
    doctor = relationship("Doctor", foreign_keys=[doctor_id])
