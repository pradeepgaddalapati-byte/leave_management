import enum
from datetime import datetime

from sqlalchemy import Column, Date, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    EMPLOYEE = "EMPLOYEE"


class LeaveStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.EMPLOYEE)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    leave_requests = relationship(
        "LeaveRequest",
        back_populates="employee",
        cascade="all, delete-orphan",
    )
    leave_balance = relationship(
        "LeaveBalance",
        back_populates="employee",
        uselist=False,
        cascade="all, delete-orphan",
    )


class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    leave_type = Column(String(50), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    reason = Column(Text, nullable=False)
    status = Column(Enum(LeaveStatus), nullable=False, default=LeaveStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    employee = relationship("User", back_populates="leave_requests")


class LeaveBalance(Base):
    __tablename__ = "leave_balance"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    total_leaves = Column(Integer, nullable=False, default=20)
    used_leaves = Column(Integer, nullable=False, default=0)
    remaining_leaves = Column(Integer, nullable=False, default=20)

    employee = relationship("User", back_populates="leave_balance")

