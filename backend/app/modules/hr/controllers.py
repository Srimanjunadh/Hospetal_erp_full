from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.modules.hr.schemas import (
    StaffSchedule, StaffScheduleCreate, EmployeeProfileCreate, EmployeeProfileResponse,
    AttendanceClockIn, AttendanceClockOut, AttendanceResponse,
    LeaveRequestCreate, LeaveRequestResponse, PayrollProcess, PayrollResponse,
    PerformanceReviewCreate, PerformanceReviewResponse
)
from app.modules.hr.services import HRService
from typing import List, Optional

router = APIRouter()

@router.post("/schedule", response_model=StaffSchedule)
async def create_staff_schedule(sched: StaffScheduleCreate, db: AsyncSession = Depends(get_db)):
    return await HRService.create_staff_schedule(db, sched)

@router.get("/{user_id}/schedule", response_model=List[StaffSchedule])
async def get_staff_schedule(user_id: int, db: AsyncSession = Depends(get_db)):
    return await HRService.get_staff_schedule(db, user_id)

@router.get("/nurse/{nurse_id}/patients")
async def get_nurse_assigned_patients(nurse_id: int, db: AsyncSession = Depends(get_db)):
    return await HRService.get_nurse_assigned_patients(db, nurse_id)

# --- HR CORE ENDPOINTS ---

@router.post("/profile", response_model=EmployeeProfileResponse)
async def create_profile(data: EmployeeProfileCreate, db: AsyncSession = Depends(get_db)):
    return await HRService.create_profile(db, data)

@router.get("/profile/{user_id}", response_model=EmployeeProfileResponse)
async def get_profile(user_id: int, db: AsyncSession = Depends(get_db)):
    return await HRService.get_profile(db, user_id)

@router.post("/attendance/clock-in", response_model=AttendanceResponse)
async def clock_in(data: AttendanceClockIn, db: AsyncSession = Depends(get_db)):
    return await HRService.clock_in(db, data.user_id)

@router.post("/attendance/clock-out", response_model=AttendanceResponse)
async def clock_out(data: AttendanceClockOut, db: AsyncSession = Depends(get_db)):
    return await HRService.clock_out(db, data.user_id)

@router.post("/leave", response_model=LeaveRequestResponse)
async def create_leave(data: LeaveRequestCreate, db: AsyncSession = Depends(get_db)):
    return await HRService.create_leave_request(db, data)

@router.patch("/leave/{leave_id}/approve", response_model=LeaveRequestResponse)
async def approve_leave(leave_id: int, status: str = Query("APPROVED"), db: AsyncSession = Depends(get_db)):
    return await HRService.approve_leave(db, leave_id, status)

@router.get("/leave/list", response_model=List[LeaveRequestResponse])
async def list_leaves(user_id: Optional[int] = Query(None), db: AsyncSession = Depends(get_db)):
    return await HRService.list_leaves(db, user_id)

@router.post("/payroll", response_model=PayrollResponse)
async def process_payroll(data: PayrollProcess, db: AsyncSession = Depends(get_db)):
    return await HRService.process_payroll(db, data)

@router.post("/performance", response_model=PerformanceReviewResponse)
async def post_performance_review(data: PerformanceReviewCreate, db: AsyncSession = Depends(get_db)):
    return await HRService.post_performance_review(db, data)

@router.get("/performance/{user_id}", response_model=List[PerformanceReviewResponse])
async def get_performance_reviews(user_id: int, db: AsyncSession = Depends(get_db)):
    return await HRService.get_reviews(db, user_id)
