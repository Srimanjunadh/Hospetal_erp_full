from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.modules.notification.schemas import AlertCreate
from app.modules.notification.services import NotificationService

router = APIRouter()

@router.post("/alerts")
async def create_alert(data: AlertCreate, db: AsyncSession = Depends(get_db)):
    return await NotificationService.create_alert(db, data)

@router.post("/emergency")
async def send_emergency_alert(data: dict, db: AsyncSession = Depends(get_db)):
    return await NotificationService.send_emergency_alert(db, data)

@router.get("/alerts/{user_id}")
async def get_system_alerts(user_id: int, db: AsyncSession = Depends(get_db)):
    return await NotificationService.get_system_alerts(db, user_id)
