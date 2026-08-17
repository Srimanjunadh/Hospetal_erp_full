import os

ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

# Strict RBAC Permissions Map
ROLE_PERMISSIONS = {
    "super_admin": ["*"],
    "platform_admin": ["*"],
    "organization_admin": ["manage_hospitals", "manage_users", "view_reports", "view_analytics"],
    "hospital_admin": ["manage_doctors", "manage_staff", "manage_inventory", "view_hospital_billing", "view_hospital_reports"],
    "doctor": ["view_patients", "edit_medical_records", "write_prescriptions", "request_lab_tests", "view_appointments"],
    "nurse": ["view_patients", "log_vitals", "view_appointments", "request_medicines"],
    "receptionist": ["book_appointments", "register_patients", "view_appointments"],
    "hr": ["manage_staff_schedules", "view_staff"],
    "finance": ["manage_billing", "view_billing_reports"],
    "inventory": ["manage_inventory_stock", "reorder_stock"],
    "patient": ["view_my_medical_records", "book_my_appointment", "view_my_billing"]
}
