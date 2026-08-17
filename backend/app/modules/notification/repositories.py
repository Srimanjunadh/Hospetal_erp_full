from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.shared.database.models import SystemAlert
from typing import List

class NotificationRepository:
    @staticmethod
    async def create_alert(db: AsyncSession, alert: SystemAlert) -> SystemAlert:
        db.add(alert)
        await db.commit()
        await db.refresh(alert)
        return alert

    @staticmethod
    async def get_alerts_by_user_id(db: AsyncSession, user_id: int) -> List[SystemAlert]:
        result = await db.execute(
            select(SystemAlert)
            .filter(SystemAlert.to_user_id == user_id)
            .order_by(SystemAlert.created_at.desc())
        )
        return result.scalars().all()
