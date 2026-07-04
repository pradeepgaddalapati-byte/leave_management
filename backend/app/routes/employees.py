from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import require_role
from app.database import get_db
from app.models import LeaveBalance, LeaveRequest, LeaveStatus, User, UserRole
from app.schemas import (
    EmployeeDashboardResponse,
    LeaveApplyRequest,
    LeaveBalanceResponse,
    LeaveResponse,
)

router = APIRouter(prefix="/employee", tags=["Employee"])
LOSS_OF_PAY_LEAVE_TYPE = "Loss of Pay"


@router.get("/dashboard", response_model=EmployeeDashboardResponse)
def employee_dashboard(
    current_user: User = Depends(require_role(UserRole.EMPLOYEE)),
    db: Session = Depends(get_db),
):
    requests = (
        db.query(LeaveRequest)
        .filter(LeaveRequest.employee_id == current_user.id)
        .all()
    )

    return {
        "balance": current_user.leave_balance,
        "total_requests": len(requests),
        "pending_requests": sum(
            1 for request in requests if request.status == LeaveStatus.PENDING
        ),
        "approved_requests": sum(
            1 for request in requests if request.status == LeaveStatus.APPROVED
        ),
        "rejected_requests": sum(
            1 for request in requests if request.status == LeaveStatus.REJECTED
        ),
    }


@router.get("/leaves", response_model=list[LeaveResponse])
def get_my_leaves(
    current_user: User = Depends(require_role(UserRole.EMPLOYEE)),
    db: Session = Depends(get_db),
):
    return (
        db.query(LeaveRequest)
        .filter(LeaveRequest.employee_id == current_user.id)
        .order_by(LeaveRequest.created_at.desc())
        .all()
    )


@router.post("/leaves", response_model=LeaveResponse, status_code=201)
def apply_leave(
    request: LeaveApplyRequest,
    current_user: User = Depends(require_role(UserRole.EMPLOYEE)),
    db: Session = Depends(get_db),
):
    balance = current_user.leave_balance

    if not balance:
        balance = LeaveBalance(
            employee_id=current_user.id,
            total_leaves=20,
            used_leaves=0,
            remaining_leaves=20,
        )
        db.add(balance)
        db.flush()

    if (
        balance.remaining_leaves <= 0
        and request.leave_type != LOSS_OF_PAY_LEAVE_TYPE
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Leave balance is completed. You can apply only Loss of Pay leave.",
        )

    leave_request = LeaveRequest(
        employee_id=current_user.id,
        leave_type=request.leave_type,
        start_date=request.start_date,
        end_date=request.end_date,
        reason=request.reason,
        status=LeaveStatus.PENDING,
    )
    db.add(leave_request)
    db.commit()
    db.refresh(leave_request)
    return leave_request


@router.get("/balance", response_model=LeaveBalanceResponse)
def get_leave_balance(
    current_user: User = Depends(require_role(UserRole.EMPLOYEE)),
    db: Session = Depends(get_db),
):
    balance = current_user.leave_balance

    if not balance:
        balance = LeaveBalance(
            employee_id=current_user.id,
            total_leaves=20,
            used_leaves=0,
            remaining_leaves=20,
        )
        db.add(balance)
        db.commit()
        db.refresh(balance)

    return balance
