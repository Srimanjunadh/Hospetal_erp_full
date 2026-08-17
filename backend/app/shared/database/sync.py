"""
Database Synchronization Bridge for Microservices
Allows independent databases to synchronize shared records (Users, Doctors, Hospitals, Appointments, etc.) via background HTTP requests.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.session import get_db
import httpx
import asyncio
import logging
from datetime import datetime
from typing import Optional

logger = logging.getLogger(__name__)
sync_router = APIRouter()

# Ports of all microservices mapping to the gateway list
MICROSERVICES_URLS = [
    "http://gateway:8000",
    "http://identity-service:8001",
    "http://organization-service:8002",
    "http://hospital-service:8003",
    "http://hr-service:8004",
    "http://doctor-service:8005",
    "http://patient-service:8006",
    "http://appointment-service:8007",
    "http://medical-record-service:8008",
    "http://billing-service:8009",
    "http://finance-service:8010",
    "http://inventory-service:8011",
    "http://notification-service:8012",
    "http://reporting-service:8013",
    "http://analytics-service:8014",
]

@sync_router.post("/internal/sync/{model_name}")
async def sync_data(model_name: str, data: dict, db: AsyncSession = Depends(get_db)):
    """
    HTTP endpoint registered on every microservice to apply synced values to the local database.
    """
    from app.shared.database.models import User, Doctor, Hospital, Appointment, Prescription, PharmacyOrder, Admission
    models_map = {
        "User": User,
        "Doctor": Doctor,
        "Hospital": Hospital,
        "Appointment": Appointment,
        "Prescription": Prescription,
        "PharmacyOrder": PharmacyOrder,
        "Admission": Admission
    }
    model_cls = models_map.get(model_name)
    if not model_cls:
        return {"status": "ignored", "reason": f"Unknown model name: {model_name}"}
    
    pk = data.get("id")
    if pk is None:
        return {"status": "error", "reason": "No primary key 'id' provided in sync data"}
        
    try:
        result = await db.execute(select(model_cls).filter(model_cls.id == pk))
        obj = result.scalars().first()
        
        is_new = False
        if not obj:
            is_new = True
            obj = model_cls()
            db.add(obj)
            
        # Map values
        for k, v in data.items():
            if hasattr(obj, k):
                # Safely parse ISO datetimes
                if k in ["created_at", "scheduled_at", "due_date", "admitted_at", "discharged_at", "expiry_date", "updated_at", "subscription_expiry"] and isinstance(v, str):
                    try:
                        v = datetime.fromisoformat(v.replace("Z", "+00:00"))
                    except ValueError:
                        pass
                setattr(obj, k, v)
                
        await db.commit()
        action = "created" if is_new else "updated"
        logger.info(f"Successfully synced model={model_name} ID={pk} action={action}")
        return {"status": "synced", "action": action, "id": pk}
    except Exception as e:
        logger.error(f"Failed to sync model={model_name} ID={pk}: {e}", exc_info=True)
        return {"status": "failed", "reason": str(e)}
 
async def broadcast_sync(model_name: str, obj_dict: dict, current_port: Optional[int] = None):
    """
    Asynchronously broadcasts an entity write/update event to all other microservices.
    """
    async def send_sync(base_url: str):
        # Prevent loopback sync to self
        if current_port and f":{current_port}" in base_url:
            return
        # Resolve network alias in docker-compose. Local development will override service hosts
        if os.path.exists("/.dockerenv") or os.getenv("RUNNING_IN_DOCKER") == "true":
            url = base_url
        else:
            url = base_url.replace("identity-service", "127.0.0.1") \
                          .replace("organization-service", "127.0.0.1") \
                          .replace("hospital-service", "127.0.0.1") \
                          .replace("hr-service", "127.0.0.1") \
                          .replace("doctor-service", "127.0.0.1") \
                          .replace("patient-service", "127.0.0.1") \
                          .replace("appointment-service", "127.0.0.1") \
                          .replace("medical-record-service", "127.0.0.1") \
                          .replace("billing-service", "127.0.0.1") \
                          .replace("finance-service", "127.0.0.1") \
                          .replace("inventory-service", "127.0.0.1") \
                          .replace("notification-service", "127.0.0.1") \
                          .replace("reporting-service", "127.0.0.1") \
                          .replace("analytics-service", "127.0.0.1") \
                          .replace("gateway", "127.0.0.1")
        try:
            async with httpx.AsyncClient(timeout=1.0) as client:
                await client.post(f"{url}/internal/sync/{model_name}", json=obj_dict)
        except Exception:
            # Silence connections to offline/not yet started local containers
            pass

    tasks = [send_sync(url) for url in MICROSERVICES_URLS]
    await asyncio.gather(*tasks)

def trigger_broadcast_sync(model_name: str, obj_dict: dict, current_port: Optional[int] = None):
    """
    Helper to trigger microservice sync broadcasts in a non-blocking background event loop task.
    """
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(broadcast_sync(model_name, obj_dict, current_port))
    except RuntimeError:
        # Fallback if no active event loop is running (e.g. CLI/scripts execution)
        asyncio.run(broadcast_sync(model_name, obj_dict, current_port))
