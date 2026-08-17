from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from app.shared.database.models import Hospital, User

class AnalyticsRepository:
    @staticmethod
    async def get_global_stats(db: AsyncSession) -> dict:
        h_res = await db.execute(select(func.count(Hospital.id)))
        h_count = h_res.scalar() or 0
        
        d_res = await db.execute(select(func.count(User.id)).filter(User.role == "doctor"))
        d_count = d_res.scalar() or 0
        
        s_res = await db.execute(select(func.count(User.id)).filter(User.role.in_(["nurse", "lab", "pharmacist"])))
        s_count = s_res.scalar() or 0
        
        p_res = await db.execute(select(func.count(User.id)).filter(User.role == "patient"))
        p_count = p_res.scalar() or 0
        
        rev_res = await db.execute(select(func.sum(Hospital.total_revenue)))
        total_rev = rev_res.scalar() or 0.0
        
        return {
            "total_hospitals": h_count,
            "total_doctors": d_count,
            "total_staff": s_count,
            "total_patients": p_count,
            "total_revenue": float(total_rev)
        }
