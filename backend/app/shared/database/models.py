from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, JSON, Text, Float, Boolean, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.shared.database.session import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True) # Added for DOC ID / Patient ID login
    role = Column(String)  # patient, doctor, nurse, hospital_admin, super_admin, test_staff
    name = Column(String)
    email = Column(String, unique=True, index=True, nullable=True)
    phone = Column(String)
    hashed_password = Column(String)
    
    # Patient specific fields
    age = Column(Integer, nullable=True)
    location = Column(String, nullable=True)
    weight = Column(Float, nullable=True)
    image = Column(Text, nullable=True)
    gender = Column(String, nullable=True)
    dob = Column(String, nullable=True)
    blood_group = Column(String, nullable=True)
    
    assigned_doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=True)
    assigned_nurse_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=True)
    
    # Verification & Recovery fields
    is_verified = Column(Boolean, default=False)
    email_verification_token = Column(String, nullable=True)
    password_reset_token = Column(String, nullable=True)
    password_reset_expires_at = Column(DateTime, nullable=True)
    
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
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    warehouse = relationship("Warehouse")


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
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    config_settings = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    admin = relationship("User", foreign_keys=[admin_id])
    organization = relationship("Organization", back_populates="hospitals")



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

class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    token = Column(String, unique=True, index=True)
    expires_at = Column(DateTime)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    revoked_at = Column(DateTime, nullable=True)

    user = relationship("User")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    details = Column(JSON, nullable=True)

    user = relationship("User")

class Organization(Base):
    __tablename__ = "organizations"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    hospitals = relationship("Hospital", back_populates="organization")

class Branch(Base):
    __tablename__ = "branches"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"))
    name = Column(String)
    location = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    hospital = relationship("Hospital")

class Department(Base):
    __tablename__ = "departments"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"))
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=True)
    name = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    hospital = relationship("Hospital")
    branch = relationship("Branch")

class OrganizationSetting(Base):
    __tablename__ = "organization_settings"
    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"))
    theme_color = Column(String, default="#5f6fff")
    logo_url = Column(String, nullable=True)
    default_language = Column(String, default="en")
    settings_json = Column(JSON, nullable=True)

    organization = relationship("Organization")

class OrganizationPolicy(Base):
    __tablename__ = "organization_policies"
    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"))
    title = Column(String)
    content = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    organization = relationship("Organization")


class Room(Base):
    __tablename__ = "rooms"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"))
    room_number = Column(String)
    room_type = Column(String) # ICU, GENERAL, SUITE, PRIVATE
    floor = Column(String)
    status = Column(String, default="AVAILABLE")

    hospital = relationship("Hospital")

class OperationTheatre(Base):
    __tablename__ = "operation_theatres"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"))
    name = Column(String)
    status = Column(String, default="AVAILABLE") # AVAILABLE, OCCUPIED, MAINTENANCE
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    hospital = relationship("Hospital")

class Facility(Base):
    __tablename__ = "facilities"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"))
    name = Column(String)
    category = Column(String) # DIAGNOSTIC, LIFE_SUPPORT, IMAGING
    status = Column(String, default="OPERATIONAL") # OPERATIONAL, MAINTENANCE, BROKEN

    hospital = relationship("Hospital")

class EmployeeProfile(Base):
    __tablename__ = "employee_profiles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    designation = Column(String)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    date_of_joining = Column(DateTime, server_default=func.now())
    salary = Column(Float)
    status = Column(String, default="ACTIVE")

    user = relationship("User")
    department = relationship("Department")

class EmployeeAttendance(Base):
    __tablename__ = "employee_attendance"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    date = Column(Date)
    check_in = Column(DateTime, nullable=True)
    check_out = Column(DateTime, nullable=True)
    status = Column(String) # PRESENT, ABSENT, LEAVE

    user = relationship("User")

class LeaveRequest(Base):
    __tablename__ = "leave_requests"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    leave_type = Column(String) # SICK, CASUAL, ANNUAL
    start_date = Column(Date)
    end_date = Column(Date)
    status = Column(String, default="PENDING") # PENDING, APPROVED, REJECTED
    reason = Column(Text, nullable=True)

    user = relationship("User")

class Payroll(Base):
    __tablename__ = "payrolls"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    month = Column(String) # e.g. 2026-07
    basic_salary = Column(Float)
    allowances = Column(Float, default=0.0)
    deductions = Column(Float, default=0.0)
    net_salary = Column(Float)
    payment_status = Column(String, default="UNPAID") # UNPAID, PAID
    paid_at = Column(DateTime, nullable=True)

    user = relationship("User")

class EmployeeDocument(Base):
    __tablename__ = "employee_documents"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    document_name = Column(String)
    document_url = Column(String)
    uploaded_at = Column(DateTime, server_default=func.now())

    user = relationship("User")

class PerformanceReview(Base):
    __tablename__ = "performance_reviews"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    reviewer_id = Column(Integer, ForeignKey("users.id"))
    rating = Column(Integer) # 1 to 5
    comments = Column(Text)
    review_date = Column(DateTime, server_default=func.now())

    user = relationship("User", foreign_keys=[user_id])
    reviewer = relationship("User", foreign_keys=[reviewer_id])

class Invoice(Base):
    __tablename__ = "invoices"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"))
    patient_id = Column(Integer, ForeignKey("users.id"))
    billing_id = Column(Integer, ForeignKey("billing.id"), nullable=True)
    invoice_number = Column(String, unique=True, index=True)
    amount = Column(Float)
    status = Column(String, default="DRAFT") # DRAFT, SENT, PAID, CANCELLED
    due_date = Column(Date)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    hospital = relationship("Hospital")
    patient = relationship("User")

class GeneralLedger(Base):
    __tablename__ = "general_ledger"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"))
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=True)
    type = Column(String) # DEBIT, CREDIT
    amount = Column(Float)
    account_code = Column(String) # REVENUE, OPERATIONAL_EXPENSE, SALARY, REFUND
    description = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    hospital = relationship("Hospital")

class Payment(Base):
    __tablename__ = "payments"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"))
    billing_id = Column(Integer, ForeignKey("billing.id"), nullable=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=True)
    amount = Column(Float)
    payment_method = Column(String) # CASH, CARD, UPI, INSURANCE
    transaction_reference = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    hospital = relationship("Hospital")

class Refund(Base):
    __tablename__ = "refunds"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"))
    payment_id = Column(Integer, ForeignKey("payments.id"))
    amount = Column(Float)
    reason = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    hospital = relationship("Hospital")

class Warehouse(Base):
    __tablename__ = "warehouses"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"))
    name = Column(String, unique=True, index=True)
    location = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    hospital = relationship("Hospital")

class StockMovement(Base):
    __tablename__ = "stock_movements"
    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("inventory.id"))
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=True)
    movement_type = Column(String) # STOCK_IN, STOCK_OUT, TRANSFER, WASTE
    quantity = Column(Integer)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    item = relationship("InventoryItem")
    warehouse = relationship("Warehouse")

class InventoryTransfer(Base):
    __tablename__ = "inventory_transfers"
    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("inventory.id"))
    from_warehouse_id = Column(Integer, ForeignKey("warehouses.id"))
    to_warehouse_id = Column(Integer, ForeignKey("warehouses.id"))
    quantity = Column(Integer)
    status = Column(String, default="PENDING") # PENDING, COMPLETED
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    item = relationship("InventoryItem")
    from_warehouse = relationship("Warehouse", foreign_keys=[from_warehouse_id])
    to_warehouse = relationship("Warehouse", foreign_keys=[to_warehouse_id])

class Vendor(Base):
    __tablename__ = "vendors"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    contact_email = Column(String)
    phone = Column(String)
    address = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class PurchaseRequest(Base):
    __tablename__ = "purchase_requests"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"))
    requester_id = Column(Integer, ForeignKey("users.id"))
    item_name = Column(String)
    category = Column(String) # MEDICINE, EQUIPMENT, CONSUMABLE
    quantity = Column(Integer)
    estimated_cost = Column(Float)
    status = Column(String, default="PENDING") # PENDING, APPROVED, REJECTED
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    hospital = relationship("Hospital")
    requester = relationship("User")

class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"
    id = Column(Integer, primary_key=True, index=True)
    purchase_request_id = Column(Integer, ForeignKey("purchase_requests.id"), nullable=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"))
    hospital_id = Column(Integer, ForeignKey("hospitals.id"))
    po_number = Column(String, unique=True, index=True)
    total_amount = Column(Float)
    status = Column(String, default="DRAFT") # DRAFT, ISSUED, DELIVERED, CANCELLED
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    purchase_request = relationship("PurchaseRequest")
    vendor = relationship("Vendor")
    hospital = relationship("Hospital")

class SupplierInvoice(Base):
    __tablename__ = "supplier_invoices"
    id = Column(Integer, primary_key=True, index=True)
    purchase_order_id = Column(Integer, ForeignKey("purchase_orders.id"))
    invoice_number = Column(String, unique=True, index=True)
    amount = Column(Float)
    status = Column(String, default="UNPAID") # UNPAID, PAID
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    purchase_order = relationship("PurchaseOrder")

class Asset(Base):
    __tablename__ = "assets"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"))
    name = Column(String, index=True)
    category = Column(String) # MEDICAL_EQUIPMENT, COMPUTERS, BEDS, FURNITURE, VEHICLES
    serial_number = Column(String, unique=True, index=True)
    status = Column(String, default="ACTIVE") # ACTIVE, IN_REPAIR, DECOMMISSIONED
    purchase_date = Column(Date)
    purchase_cost = Column(Float)
    warranty_expiry = Column(Date, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    hospital = relationship("Hospital")

class AssetMaintenance(Base):
    __tablename__ = "asset_maintenance"
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"))
    maintenance_type = Column(String) # ROUTINE_SERVICE, EMERGENCY_REPAIR, CALIBRATION
    scheduled_date = Column(Date)
    completed_date = Column(Date, nullable=True)
    cost = Column(Float, default=0.0)
    description = Column(String)
    status = Column(String, default="PENDING") # PENDING, COMPLETED
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    asset = relationship("Asset")








