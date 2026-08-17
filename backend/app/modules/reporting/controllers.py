from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.modules.reporting.schemas import ReportRequest, ReportResponse
from app.modules.reporting.services import ReportingService

router = APIRouter()

@router.post("/generate", response_model=ReportResponse)
async def generate_report(req: ReportRequest, db: AsyncSession = Depends(get_db)):
    return await ReportingService.generate_report(db, req)
