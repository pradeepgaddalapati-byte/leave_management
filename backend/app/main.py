import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.auth import hash_password
from app.database import Base, SessionLocal, engine
from app.models import User, UserRole
from app.routes import auth, employees, leaves

load_dotenv()

app = FastAPI(title="Employee Leave Management System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(employees.router)
app.include_router(leaves.router)


def create_default_admin(db: Session) -> None:
    admin_email = os.getenv("DEFAULT_ADMIN_EMAIL", "pradeep@gmail.com")
    admin_password = os.getenv("DEFAULT_ADMIN_PASSWORD", "pradeep123")

    existing_admin = db.query(User).filter(User.email == admin_email).first()
    if existing_admin:
        return

    db.add(
        User(
            name="Admin",
            email=admin_email,
            password_hash=hash_password(admin_password),
            role=UserRole.ADMIN,
        )
    )
    db.commit()


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        create_default_admin(db)
    finally:
        db.close()


@app.get("/")
def health_check():
    return {"message": "Employee Leave Management API is running"}

