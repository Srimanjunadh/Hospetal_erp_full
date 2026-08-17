from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.shared.database.models import StaffSchedule, EmployeeProfile, EmployeeAttendance, LeaveRequest, Payroll, PerformanceReview
from typing import List, Optional


class HRRepository:
    @staticmethod
    async def create_schedule(db: AsyncSession, sched: StaffSchedule) -> StaffSchedule:
        db.add(sched)
        await db.commit()
        await db.refresh(sched)
        return sched

    @staticmethod
    async def get_schedules_by_staff_id(db: AsyncSession, staff_id: int) -> List[StaffSchedule]:
        result = await db.execute(select(StaffSchedule).filter(StaffSchedule.staff_id == staff_id))
        return result.scalars().all()

    @staticmethod
    async def get_nurse_assigned_patients(db: AsyncSession, nurse_id: int):
        from app.shared.database.models import User
        result = await db.execute(select(User).filter(User.assigned_nurse_id == nurse_id, User.role == "patient"))
        return result.scalars().all()

    @staticmethod
    async def create_profile(db: AsyncSession, profile) -> EmployeeProfile:
        from app.shared.database.models import EmployeeProfile
        db.add(profile)
        await db.flush()
        return profile

    @staticmethod
    async def get_profile_by_user_id(db: AsyncSession, user_id: int) -> Optional[EmployeeProfile]:
        from app.shared.database.models import EmployeeProfile
        result = await db.execute(select(EmployeeProfile).filter(EmployeeProfile.user_id == user_id))
        return result.scalars().first()

    @staticmethod
    async def get_attendance_by_user_and_date(db: AsyncSession, user_id: int, target_date) -> Optional[EmployeeAttendance]:
        from app.shared.database.models import EmployeeAttendance
        result = await db.execute(
            select(EmployeeAttendance)
            .filter(EmployeeAttendance.user_id == user_id, EmployeeAttendance.date == target_date)
        )
        return result.scalars().first()

    @staticmethod
    async def create_attendance(db: AsyncSession, attendance) -> EmployeeAttendance:
        from app.shared.database.models import EmployeeAttendance
        db.add(attendance)
        await db.flush()
        return attendance

    @staticmethod
    async def create_leave_request(db: AsyncSession, leave) -> LeaveRequest:
        from app.shared.database.models import LeaveRequest
        db.add(leave)
        await db.flush()
        return leave

    @staticmethod
    async def list_leaves(db: AsyncSession, user_id: Optional[int] = None) -> List[LeaveRequest]:
        from app.shared.database.models import LeaveRequest
        query = select(LeaveRequest)
        if user_id:
            query = query.filter(LeaveRequest.user_id == user_id)
        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def get_leave_by_id(db: AsyncSession, leave_id: int) -> Optional[LeaveRequest]:
        from app.shared.database.models import LeaveRequest
        result = await db.execute(select(LeaveRequest).filter(LeaveRequest.id == leave_id))
        return result.scalars().first()

    @staticmethod
    async def create_payroll(db: AsyncSession, payroll) -> Payroll:
        from app.shared.database.models import Payroll
        db.add(payroll)
        await db.flush()
        return payroll

    @staticmethod
    async def get_payrolls_by_user(db: AsyncSession, user_id: int) -> List[Payroll]:
        from app.shared.database.models import Payroll
        result = await db.execute(select(Payroll).filter(Payroll.user_id == user_id))
        return result.scalars().all()

    @staticmethod
    async def create_review(db: AsyncSession, review) -> PerformanceReview:
        from app.shared.database.models import PerformanceReview
        db.add(review)
        await db.flush()
        return review

    @staticmethod
    async def get_reviews_by_user(db: AsyncSession, user_id: int) -> List[PerformanceReview]:
        from app.shared.database.models import PerformanceReview
        result = await db.execute(select(PerformanceReview).filter(PerformanceReview.user_id == user_id))
        return result.scalars().all()

    @staticmethod
    async def get_user_by_id(db: AsyncSession, user_id: int):
        from app.shared.database.models import User
        result = await db.execute(select(User).filter(User.id == user_id))
        return result.scalars().first()

    @staticmethod
    async def save(db: AsyncSession) -> None:
        await db.commit()



