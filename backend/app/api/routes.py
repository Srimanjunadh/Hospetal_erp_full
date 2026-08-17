from fastapi import APIRouter
# Import new domain module controllers
from app.modules.identity.controllers import router as identity_router
from app.modules.hospital.controllers import router as hospital_router
from app.modules.hr.controllers import router as hr_router
from app.modules.doctor.controllers import router as doctor_router
from app.modules.patient.controllers import router as patient_router
from app.modules.appointment.controllers import router as appointment_router
from app.modules.medical_records.controllers import router as medical_records_router
from app.modules.finance.controllers import router as finance_router
from app.modules.inventory.controllers import router as inventory_router
from app.modules.notification.controllers import router as notification_router
from app.modules.analytics.controllers import router as analytics_router
from app.modules.reporting.controllers import router as reporting_router

# Import legacy routers for remaining features (Ambulance, Specialized Units)
from app.api.ambulance import router as ambulance_router
from app.modules.specialized import router as specialized_router

router = APIRouter()

# Register new domain modules
router.include_router(identity_router, prefix="/auth", tags=["Identity & Auth"])
router.include_router(identity_router, prefix="/users", tags=["Identity - Users Directory"])
router.include_router(hospital_router, prefix="/hospitals", tags=["Organization & Hospitals"])
router.include_router(hospital_router, prefix="/hospital", tags=["Hospital Operations"])
router.include_router(hr_router, prefix="/hr", tags=["HR & Staffing"])
router.include_router(doctor_router, prefix="/doctors", tags=["Doctors Directory"])
router.include_router(patient_router, prefix="/patients", tags=["Patients Directory"])
router.include_router(appointment_router, prefix="/appointments", tags=["Appointment Booking"])
router.include_router(medical_records_router, prefix="/clinical", tags=["Clinical Node Operations"])
router.include_router(medical_records_router, prefix="/vitals", tags=["Clinical Node Vitals"])
router.include_router(finance_router, prefix="/billing", tags=["Finance & Billing"])
router.include_router(inventory_router, prefix="/inventory", tags=["Inventory & Pharmacy Management"])
router.include_router(notification_router, prefix="/notifications", tags=["Notification Service"])
router.include_router(analytics_router, prefix="/ai", tags=["AI & Analytics"])
router.include_router(reporting_router, prefix="/reports", tags=["Reporting & Summaries"])

# Register remaining legacy routers
router.include_router(ambulance_router, prefix="/ambulance", tags=["Emergency & Ambulance"])
router.include_router(specialized_router, prefix="/specialized", tags=["Specialized Clinical Units"])

# Register Organization Management router
from app.modules.organization.controllers import router as organization_router
router.include_router(organization_router, prefix="/organization", tags=["Organization Management"])

# Register Procurement router
from app.modules.procurement.controllers import router as procurement_router
router.include_router(procurement_router, prefix="/procurement", tags=["Procurement Management"])

# Register Asset router
from app.modules.asset.controllers import router as asset_router
router.include_router(asset_router, prefix="/assets", tags=["Asset Management"])



