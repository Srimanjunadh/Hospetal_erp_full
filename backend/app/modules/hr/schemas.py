from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional, List

class StaffScheduleBase(BaseModel):
    staff_id: int
    task_name: str
    start_time: datetime
    end_time: datetime
    status: str = "pending"
    notes: Optional[str] = None

class StaffScheduleCreate(StaffScheduleBase):
    pass

class StaffSchedule(StaffScheduleBase):
    id: int

    class Config:
        from_attributes = True

# Employee Profile
class EmployeeProfileCreate(BaseModel):
    user_id: int
    designation: str
    department_id: Optional[int] = None
    salary: float

class EmployeeProfileResponse(BaseModel):
    id: int
    user_id: int
    designation: str
    department_id: Optional[int]
    date_of_joining: datetime
    salary: float
    status: str

    class Config:
        from_attributes = True

# Attendance
class AttendanceClockIn(BaseModel):
    user_id: int

class AttendanceClockOut(BaseModel):
    user_id: int

class AttendanceResponse(BaseModel):
    id: int
    user_id: int
    date: date
    check_in: Optional[datetime]
    check_out: Optional[datetime]
    status: str

    class Config:
        from_attributes = True

# Leave Requests
class LeaveRequestCreate(BaseModel):
    user_id: int
    leave_type: str
    start_date: date
    end_date: date
    reason: Optional[str] = None

class LeaveRequestResponse(BaseModel):
    id: int
    user_id: int
    leave_type: str
    start_date: date
    end_date: date
    status: str
    reason: Optional[str]

    class Config:
        from_attributes = True

# Payroll
class PayrollProcess(BaseModel):
    user_id: int
    month: str
    allowances: Optional[float] = 0.0
    deductions: Optional[float] = 0.0

class PayrollResponse(BaseModel):
    id: int
    user_id: int
    month: str
    basic_salary: float
    allowances: float
    deductions: float
    net_salary: float
    payment_status: str
    paid_at: Optional[datetime]

    class Config:
        from_attributes = True

# Performance Reviews
class PerformanceReviewCreate(BaseModel):
    user_id: int
    reviewer_id: int
    rating: int # 1 to 5
    comments: str

class PerformanceReviewResponse(BaseModel):
    id: int
    user_id: int
    reviewer_id: int
    rating: int
    comments: str
    review_date: datetime

    class Config:
        from_attributes = True
