import asyncio
import os
import sys
from datetime import date
sys.path.insert(0, os.path.abspath('backend'))

from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import AsyncSessionLocal
from app.modules.hr.services import HRService
from app.modules.hr.schemas import (
    EmployeeProfileCreate, LeaveRequestCreate, PayrollProcess, PerformanceReviewCreate
)

async def verify_hr_management():
    print("Verifying HR Management module...")
    db = AsyncSessionLocal()
    
    try:
        # 1. Create Employee Profile for User ID 1 (admin user seeded)
        profile_data = EmployeeProfileCreate(
            user_id=1,
            designation="Principal Architect & Backend Lead",
            department_id=1, # Seeded department
            salary=12000.0
        )
        # Check if already exists from previous runs to make rerun-safe
        try:
            profile = await HRService.create_profile(db, profile_data)
            print("Employee Profile Creation: SUCCESS, ID:", profile.id)
        except Exception as ex:
            if "already exists" in str(ex):
                profile = await HRService.get_profile(db, 1)
                print("Employee Profile (Existing): FOUND, ID:", profile.id)
            else:
                raise ex

        # 2. Log Attendance Check-In
        # Delete today's attendance first to allow safe reruns
        from sqlalchemy import delete
        from app.shared.database.models import EmployeeAttendance
        await db.execute(delete(EmployeeAttendance).filter(EmployeeAttendance.user_id == 1, EmployeeAttendance.date == date.today()))
        await db.commit()

        check_in_rec = await HRService.clock_in(db, 1)
        assert check_in_rec.id is not None, "Attendance ID not generated"
        assert check_in_rec.status == "PRESENT", "Attendance status mismatch"
        print("Attendance Clock-In: SUCCESS, Status:", check_in_rec.status)

        # 3. Log Attendance Check-Out
        check_out_rec = await HRService.clock_out(db, 1)
        assert check_out_rec.check_out is not None, "Check-out timestamp is null"
        print("Attendance Clock-Out: SUCCESS")

        # 4. Create Leave Request
        leave_data = LeaveRequestCreate(
            user_id=1,
            leave_type="SICK",
            start_date=date.today(),
            end_date=date.today(),
            reason="Medical Recovery Checkup"
        )
        leave = await HRService.create_leave_request(db, leave_data)
        assert leave.id is not None, "Leave Request ID not generated"
        assert leave.status == "PENDING", "Leave Request status mismatch"
        print("Leave Request Creation: SUCCESS, ID:", leave.id)

        # 5. Approve Leave Request
        approved_leave = await HRService.approve_leave(db, leave.id, "APPROVED")
        assert approved_leave.status == "APPROVED", "Status was not updated to APPROVED"
        print("Leave Request Approval: SUCCESS")

        # 6. Process Payroll
        payroll_data = PayrollProcess(
            user_id=1,
            month="2026-07",
            allowances=500.0,
            deductions=100.0
        )
        payroll = await HRService.process_payroll(db, payroll_data)
        assert payroll.id is not None, "Payroll ID not generated"
        assert payroll.net_salary == 12400.0, "Net salary calculation mismatch"
        print("Payroll Processing: SUCCESS, Net Salary:", payroll.net_salary)

        # 7. Post Performance Review
        review_data = PerformanceReviewCreate(
            user_id=1,
            reviewer_id=1,
            rating=5,
            comments="Outstanding contribution to domain refactoring milestones."
        )
        review = await HRService.post_performance_review(db, review_data)
        assert review.id is not None, "Review ID not generated"
        assert review.rating == 5, "Rating mismatch"
        print("Performance Review: SUCCESS, Rating:", review.rating)

        print("\nAll HR Management checks PASSED successfully.")
    except Exception as e:
        print("Verification FAILED:", e)
        import traceback
        traceback.print_exc()
    finally:
        await db.close()

if __name__ == "__main__":
    asyncio.run(verify_hr_management())
