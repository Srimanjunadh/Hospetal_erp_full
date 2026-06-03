import httpx
import logging
import json
import os

logger = logging.getLogger(__name__)

PMS_BASE_URL = "http://localhost:8000"
ERP_BASE_URL = "http://localhost:8000"

# Load PMS → ERP hospital mapping
_MAPPING_FILE = os.path.join(os.path.dirname(__file__), "..", "..", "pms_erp_hospital_mapping.json")
_PMS_TO_ERP_MAPPING: dict = {}

def _save_mapping():
    global _PMS_TO_ERP_MAPPING
    try:
        mapping_path = os.path.normpath(_MAPPING_FILE)
        with open(mapping_path, 'w') as f:
            json.dump(_PMS_TO_ERP_MAPPING, f, indent=2)
        logger.info(f"✅ Saved updated hospital mapping to: {mapping_path}")
    except Exception as e:
        logger.error(f"❌ Failed to save hospital mapping: {e}")

def _load_mapping():
    global _PMS_TO_ERP_MAPPING
    try:
        mapping_path = os.path.normpath(_MAPPING_FILE)
        if os.path.exists(mapping_path):
            with open(mapping_path, 'r') as f:
                _PMS_TO_ERP_MAPPING = json.load(f)
            logger.info(f"[OK] Loaded PMS->ERP mapping: {len(_PMS_TO_ERP_MAPPING)} hospitals")
        else:
            logger.warning(f"[WARN] Mapping file not found at: {mapping_path}")
    except Exception as e:
        logger.error(f"[ERROR] Failed to load hospital mapping: {e}")

# Load on import
_load_mapping()

def get_erp_hospital_id(pms_hospital_id) -> int | None:
    """Convert a PMS hospital_tieup ID to an ERP hospital ID."""
    entry = _PMS_TO_ERP_MAPPING.get(str(pms_hospital_id))
    if entry:
        return entry.get('erp_id')
    return None

def get_all_erp_hospitals() -> dict:
    """Return the full PMS → ERP mapping dict."""
    return _PMS_TO_ERP_MAPPING

async def sync_hospital_to_pms(hospital_data: dict):
    """Sync a new hospital created in ERP to the PMS portal."""
    try:
        # 1. Generate Admin JWT for PMS
        from jose import jwt
        import datetime
        
        # We need the secret from PMS .env, but for now we'll use the one we know
        PMS_JWT_SECRET = "greatstack" 
        ADMIN_EMAIL = "medclues123@gmail.com"
        
        token = jwt.encode({
            "email": ADMIN_EMAIL,
            "exp": datetime.datetime.utcnow() + datetime.timedelta(days=1)
        }, PMS_JWT_SECRET, algorithm="HS256")
        
        async with httpx.AsyncClient() as client:
            pms_payload = {
                "name": hospital_data.get("name"),
                "address": hospital_data.get("location") or "City Center",
                "contact": hospital_data.get("phone", "Not available"),
                "specialization": hospital_data.get("specialization") or "Multi-Specialty",
                "type": "General",
                "showOnHome": True
            }
            
            headers = {"Authorization": f"Bearer {token}"}
            response = await client.post(f"{PMS_BASE_URL}/api/hospital-tieup/add", json=pms_payload, headers=headers)
            
            if response.status_code == 200:
                result = response.json()
                if result.get("success"):
                    # PMS returns "Hospital Tie-up Added" but doesn't return the ID in the message?
                    # Let's check hospital_controller.py add_hospital_tieup again.
                    # async def add_hospital_tieup(data: dict): ... await hospital_model.create_hospital_tieup(data) ... return {"success": True, "message": "Hospital Tie-up Added"}
                    # It DOES NOT return the ID. This is a problem.
                    
                    # Workaround: Fetch all hospitals from PMS and find the one we just added
                    list_res = await client.get(f"{PMS_BASE_URL}/api/hospital-tieup/public")
                    if list_res.status_code == 200:
                        hospitals = list_res.json().get("hospitals", [])
                        # Find by name
                        new_hosp = next((h for h in hospitals if h['name'] == hospital_data.get("name")), None)
                        if new_hosp:
                            pms_id = str(new_hosp['id'])
                            # Update mapping
                            _PMS_TO_ERP_MAPPING[pms_id] = {
                                "erp_id": hospital_data.get("id"),
                                "name": hospital_data.get("name"),
                                "node_code": hospital_data.get("node_code"),
                                "admin_username": hospital_data.get("admin_username"),
                                "admin_password": hospital_data.get("admin_password")
                            }
                            _save_mapping()
                            logger.info(f"[OK] Successfully synced and mapped hospital {hospital_data.get('name')} (PMS ID: {pms_id})")
                            return True
                else:
                    logger.warning(f"[WARN] PMS Hospital Sync failed: {result.get('message')}")
            else:
                logger.warning(f"[WARN] PMS Hospital Sync failed with status {response.status_code}: {response.text}")
    except Exception as e:
        logger.error(f"[ERROR] Error syncing hospital to PMS: {str(e)}")
    return False

async def sync_user_to_pms(user_data: dict):
    """Sync a user created in ERP to the PMS portal."""
    try:
        async with httpx.AsyncClient() as client:
            # Map ERP user data to PMS format
            pms_data = {
                "name": user_data.get("name"),
                "email": user_data.get("email") or f"{user_data.get('username')}@medclues.local",
                "password": user_data.get("password"),
                "phone": user_data.get("phone", "0000000000"),
                "role": user_data.get("role"),
                "age": user_data.get("age"),
                "gender": "Not Specified",
                "address": {"line1": user_data.get("location", ""), "line2": ""}
            }
            response = await client.post(f"{PMS_BASE_URL}/api/user/register", json=pms_data)
            if response.status_code == 200:
                logger.info(f"[OK] Successfully synced user {user_data.get('username')} to PMS")
            else:
                logger.warning(f"[WARN] PMS Sync failed for {user_data.get('username')}: {response.text}")
    except Exception as e:
        logger.error(f"[ERROR] Error syncing user to PMS: {str(e)}")

async def sync_doctor_to_pms(doctor_data: dict):
    """Sync a doctor created in ERP to the PMS portal."""
    try:
        # Determine PMS hospital ID from node_code mapping
        pms_hospital_id = None
        node_code = doctor_data.get('node_code')
        if node_code:
            # Find hospital by node_code in mapping
            for pms_id, entry in _PMS_TO_ERP_MAPPING.items():
                if entry.get('node_code') == node_code:
                    pms_hospital_id = int(pms_id)
                    break
        
        async with httpx.AsyncClient() as client:
            pms_data = {
                "name": doctor_data.get("name"),
                "email": f"{doctor_data.get('username')}@medclues.local",
                "password": doctor_data.get("password"),
                "speciality": doctor_data.get("specialization"),
                "degree": "MBBS",
                "experience": doctor_data.get("experience", "0"),
                "fees": 500,
                "about": f"Doctor at node {doctor_data.get('node_code')}",
                "hospitalId": pms_hospital_id or 31  # Default to first PMS hospital
            }
            response = await client.post(f"{PMS_BASE_URL}/api/admin/add-doctor", json=pms_data)
            if response.status_code == 200:
                logger.info(f"✅ Successfully synced doctor {doctor_data.get('username')} to PMS")
            else:
                logger.warning(f"⚠️ PMS Doctor Sync failed: {response.text}")
    except Exception as e:
        logger.error(f"❌ Error syncing doctor to PMS: {str(e)}")

async def sync_pms_appointment_to_erp(appointment_data: dict) -> dict:
    """
    Sync a PMS appointment to the correct ERP hospital.
    
    This is called by the PMS backend when a patient books an appointment.
    The appointment is routed to the ERP hospital that matches the PMS hospital_id.
    
    appointment_data should contain:
      - pms_hospital_id: the PMS hospital_tieup_id
      - patient_name: patient's name
      - patient_email: patient's email (used to look up ERP user)
      - doctor_name: doctor name (for logging)
      - slot_date: appointment date
      - slot_time: appointment time
      - reason: reason/symptoms
      - status: appointment status
    """
    try:
        pms_hospital_id = appointment_data.get('pms_hospital_id') or appointment_data.get('hospital_id')
        erp_hospital_id = get_erp_hospital_id(pms_hospital_id)
        
        if not erp_hospital_id:
            logger.warning(f"⚠️ No ERP mapping for PMS hospital {pms_hospital_id}")
            return {"success": False, "message": f"No ERP hospital mapped for PMS hospital {pms_hospital_id}"}
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            erp_data = {
                "patient_id": appointment_data.get('patient_id', 1),
                "doctor_id": appointment_data.get('erp_doctor_id', 1),
                "hospital_id": erp_hospital_id,
                "status": appointment_data.get('status', 'scheduled'),
                "reason": appointment_data.get('reason') or appointment_data.get('symptoms', ''),
                "type": appointment_data.get('mode', 'offline'),
                "token_number": appointment_data.get('token_number', 0),
                "queue_position": appointment_data.get('queue_position', 0),
                "scheduled_at": appointment_data.get('slot_date', ''),
                # PMS-specific metadata stored in preferred_time
                "preferred_time": appointment_data.get('slot_time', ''),
                # Extra metadata for ERP audit trail
                "pms_appointment_id": appointment_data.get('pms_appointment_id'),
                "pms_hospital_id": pms_hospital_id,
                "patient_name": appointment_data.get('patient_name', ''),
                "doctor_name": appointment_data.get('doctor_name', ''),
            }
            
            response = await client.post(
                f"{ERP_BASE_URL}/api/appointments/internal/sync",
                json=erp_data
            )
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"✅ PMS Appointment synced to ERP Hospital {erp_hospital_id} ({appointment_data.get('doctor_name', '')})")
                return {"success": True, "erp_hospital_id": erp_hospital_id, "data": result}
            else:
                logger.warning(f"⚠️ ERP sync failed: {response.status_code} - {response.text}")
                return {"success": False, "message": response.text}
    
    except Exception as e:
        logger.error(f"❌ Error syncing PMS appointment to ERP: {str(e)}")
        return {"success": False, "message": str(e)}
