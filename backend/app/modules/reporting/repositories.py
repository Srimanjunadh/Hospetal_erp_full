from sqlalchemy.ext.asyncio import AsyncSession

class ReportingRepository:
    @staticmethod
    async def get_report_metadata(db: AsyncSession, report_id: str) -> dict:
        return {"report_id": report_id, "status": "ready"}
