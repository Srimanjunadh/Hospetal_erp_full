from fastapi import APIRouter
from app.modules.auth import router as auth_router
from app.modules.users import router as users_router
from app.modules.patients import router as patient_router
from app.modules.doctors import router as doctor_router
from app.modules.vitals import router as vitals_router
from app.modules.appointments import router as appointment_router
from app.api.ai import router as ai_router
from app.api.hospital import router as hospital_router
from app.api.ambulance import router as ambulance_router

from app.modules.hospitals import router as hospitals_router

from app.modules.inventory import router as inventory_router
from app.modules.clinical_nodes import router as clinical_router
from app.modules.specialized import router as specialized_router

router = APIRouter()

router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
router.include_router(hospitals_router, prefix="/hospitals", tags=["Global Hospitals"])
router.include_router(users_router, prefix="/users", tags=["Users"])
router.include_router(patient_router, prefix="/patients", tags=["Patients"])
router.include_router(doctor_router, prefix="/doctors", tags=["Doctors"])
router.include_router(vitals_router, prefix="/vitals", tags=["Clinical Monitoring"])
router.include_router(appointment_router, prefix="/appointments", tags=["Appointments"])
router.include_router(ai_router, prefix="/ai", tags=["AI Assistant"])
router.include_router(hospital_router, prefix="/hospital", tags=["Hospital Management"])
router.include_router(ambulance_router, prefix="/ambulance", tags=["Emergency & Ambulance"])
router.include_router(inventory_router, prefix="/inventory", tags=["Inventory & Pharmacy Stock"])
router.include_router(clinical_router, prefix="/clinical", tags=["Clinical Node Operations"])
router.include_router(specialized_router, prefix="/specialized", tags=["Specialized Clinical Units"])
