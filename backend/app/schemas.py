from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models import LeaveStatus, UserRole


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    role: UserRole


class EmployeeCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=6)
    total_leaves: int = Field(default=20, ge=0)


class EmployeeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr
    role: UserRole
    created_at: datetime


class LeaveApplyRequest(BaseModel):
    leave_type: str = Field(min_length=2, max_length=50)
    start_date: date
    end_date: date
    reason: str = Field(min_length=5, description="Required leave description")

    @field_validator("end_date")
    @classmethod
    def validate_dates(cls, end_date, info):
        start_date = info.data.get("start_date")
        if start_date and end_date < start_date:
            raise ValueError("end_date must be on or after start_date")
        return end_date


class LeaveStatusUpdate(BaseModel):
    status: LeaveStatus

    @field_validator("status")
    @classmethod
    def validate_admin_status(cls, status):
        if status == LeaveStatus.PENDING:
            raise ValueError("Admin can only approve or reject leave requests")
        return status


class LeaveResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    employee_id: int
    leave_type: str
    start_date: date
    end_date: date
    reason: str
    status: LeaveStatus
    created_at: datetime


class AdminLeaveResponse(LeaveResponse):
    employee_name: str
    employee_email: EmailStr


class LeaveBalanceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    employee_id: int
    total_leaves: int
    used_leaves: int
    remaining_leaves: int


class EmployeeDashboardResponse(BaseModel):
    balance: LeaveBalanceResponse
    total_requests: int
    pending_requests: int
    approved_requests: int
    rejected_requests: int


class AdminDashboardResponse(BaseModel):
    total_employees: int
    pending_leaves: int
    approved_leaves: int
