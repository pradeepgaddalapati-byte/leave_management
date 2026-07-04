from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import hash_password, require_role
from app.database import get_db
from app.models import LeaveBalance, LeaveRequest, LeaveStatus, User, UserRole
from app.schemas import (
    AdminDashboardResponse,
    AdminLeaveResponse,
    EmployeeCreate,
    EmployeeResponse,
    LeaveStatusUpdate,
)

router = APIRouter(prefix="/admin", tags=["Admin"])
LOSS_OF_PAY_LEAVE_TYPE = "Loss of Pay"


@router.get("/dashboard", response_model=AdminDashboardResponse)
def admin_dashboard(
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    return {
        "total_employees": db.query(User)
        .filter(User.role == UserRole.EMPLOYEE)
        .count(),
        "pending_leaves": db.query(LeaveRequest)
        .filter(LeaveRequest.status == LeaveStatus.PENDING)
        .count(),
        "approved_leaves": db.query(LeaveRequest)
        .filter(LeaveRequest.status == LeaveStatus.APPROVED)
        .count(),
    }


@router.post("/employees", response_model=EmployeeResponse, status_code=201)
def create_employee(
    request: EmployeeCreate,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An employee with this email already exists",
        )

    employee = User(
        name=request.name,
        email=request.email,
        password_hash=hash_password(request.password),
        role=UserRole.EMPLOYEE,
    )
    db.add(employee)
    db.flush()

    db.add(
        LeaveBalance(
            employee_id=employee.id,
            total_leaves=request.total_leaves,
            used_leaves=0,
            remaining_leaves=request.total_leaves,
        )
    )
    db.commit()
    db.refresh(employee)
    return employee


@router.get("/employees", response_model=list[EmployeeResponse])
def get_employees(
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    return (
        db.query(User)
        .filter(User.role == UserRole.EMPLOYEE)
        .order_by(User.created_at.desc())
        .all()
    )


@router.get("/leaves", response_model=list[AdminLeaveResponse])
def get_all_leaves(
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    leave_requests = (
        db.query(LeaveRequest)
        .join(User, LeaveRequest.employee_id == User.id)
        .order_by(LeaveRequest.created_at.desc())
        .all()
    )

    return [
        AdminLeaveResponse(
            id=leave_request.id,
            employee_id=leave_request.employee_id,
            employee_name=leave_request.employee.name,
            employee_email=leave_request.employee.email,
            leave_type=leave_request.leave_type,
            start_date=leave_request.start_date,
            end_date=leave_request.end_date,
            reason=leave_request.reason,
            status=leave_request.status,
            created_at=leave_request.created_at,
        )
        for leave_request in leave_requests
    ]


@router.put("/leaves/{leave_id}", response_model=AdminLeaveResponse)
def update_leave_status(
    leave_id: int,
    request: LeaveStatusUpdate,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    leave_request = db.query(LeaveRequest).filter(LeaveRequest.id == leave_id).first()
    if not leave_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Leave request not found",
        )

    if leave_request.status != LeaveStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only pending leave requests can be updated",
        )

    if (
        request.status == LeaveStatus.APPROVED
        and leave_request.leave_type != LOSS_OF_PAY_LEAVE_TYPE
    ):
        requested_days = (leave_request.end_date - leave_request.start_date).days + 1
        balance = leave_request.employee.leave_balance

        if balance.remaining_leaves < requested_days:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Employee does not have enough leave balance",
            )

        balance.used_leaves += requested_days
        balance.remaining_leaves -= requested_days

    leave_request.status = request.status
    db.commit()
    db.refresh(leave_request)

    return AdminLeaveResponse(
        id=leave_request.id,
        employee_id=leave_request.employee_id,
        employee_name=leave_request.employee.name,
        employee_email=leave_request.employee.email,
        leave_type=leave_request.leave_type,
        start_date=leave_request.start_date,
        end_date=leave_request.end_date,
        reason=leave_request.reason,
        status=leave_request.status,
        created_at=leave_request.created_at,
    )
