# Employee Leave Management System

A fresher-level full-stack project for managing employee leave requests. The project is intentionally simple: one FastAPI backend, one React frontend, PostgreSQL tables, JWT login, and role-based APIs for Admin and Employee users.

## Features

- Admin login
- Employee login
- JWT authentication with role-based access
- Admin can create employees
- Admin can view employees and all leave requests
- Admin can approve or reject pending leave requests
- Employee can view leave balance
- Employee can apply for Casual Leave, Sick Leave, or Loss of Pay
- Employee can view leave history and request status
- Approved leave requests reduce the employee leave balance
- When paid leaves are completed, employees can apply only for Loss of Pay
- Loss of Pay approvals do not reduce paid leave balance

## Tech Stack

Backend:
- Python
- FastAPI
- PostgreSQL
- SQLAlchemy ORM
- Psycopg PostgreSQL driver
- JWT authentication

Frontend:
- React
- Axios
- React Router
- Basic CSS

## Architecture Diagram

```text
React Frontend
    |
    | Axios HTTP requests with JWT token
    v
FastAPI Backend
    |
    | SQLAlchemy ORM
    v
PostgreSQL Database
```

## Project Structure

```text
backend/
  app/
    main.py              FastAPI app startup, CORS, route registration
    database.py          Env-based PostgreSQL engine and database session
    models.py            SQLAlchemy database tables and relationships
    schemas.py           Request and response validation models
    auth.py              Password hashing, JWT creation, JWT validation
    routes/
      auth.py            Login API
      employees.py       Employee dashboard, leave, and balance APIs
      leaves.py          Admin employee and leave management APIs

frontend/
  src/
    pages/
      Login.jsx
      AdminDashboard.jsx
      EmployeeDashboard.jsx
    components/
      Navbar.jsx
      LeaveCard.jsx
    services/
      api.js             Axios setup with JWT header
```

## Database Design

### users

Stores both Admin and Employee users.

Columns:
- id
- name
- email
- password_hash
- role: `ADMIN` or `EMPLOYEE`
- created_at

### leave_requests

Stores every leave application submitted by employees.

Columns:
- id
- employee_id
- leave_type
- start_date
- end_date
- reason: required leave description
- status: `PENDING`, `APPROVED`, or `REJECTED`
- created_at

### leave_balance

Stores one leave balance row per employee.

Columns:
- id
- employee_id
- total_leaves
- used_leaves
- remaining_leaves

Relationships:
- One user can have many leave requests.
- One employee user has one leave balance.

## Authentication Flow

1. User submits email and password to `POST /auth/login`.
2. Backend finds the user by email.
3. Backend checks the plain password against the hashed password.
4. Backend creates a JWT token containing `user_id` and `role`.
5. Frontend stores the token in `localStorage`.
6. Axios sends the token in the `Authorization: Bearer <token>` header.
7. Protected APIs validate the JWT and check the user role.

## Backend Setup

Create a PostgreSQL database:

```sql
CREATE DATABASE leave_management;
```

Install and run the backend:

```bash
cd backend
python -m venv venv
venv\Scripts\activate
python -m pip install -r requirements.txt
copy .env.example .env
python -m uvicorn app.main:app --reload
```

The backend dependencies are tested with the versions in `requirements.txt`.
The project uses `psycopg[binary]` for PostgreSQL and keeps compatible
Pydantic and bcrypt versions for newer Python installs.

Set your PostgreSQL connection in `backend/.env`:

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=leave_management
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
```

You can also provide a single `DATABASE_URL` in `backend/.env` instead of the
`POSTGRES_*` values, for example when using a hosted PostgreSQL service.

Example:

```env
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/leave_management
```

The backend starts at:

```text
http://localhost:8000
```

API docs:

```text
http://localhost:8000/docs
```

Default admin credentials are created during startup if they do not already exist:

```text
Email: admin@example.com
Password: admin123
```

Change these in `backend/.env` for a real demo.

## Frontend Setup

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

The frontend starts at:

```text
http://localhost:5173
```

## API Details

Authentication:
- `POST /auth/login`

Employee:
- `GET /employee/dashboard`
- `GET /employee/leaves`
- `POST /employee/leaves`
- `GET /employee/balance`

Admin:
- `GET /admin/dashboard`
- `POST /admin/employees`
- `GET /admin/employees`
- `GET /admin/leaves`
- `PUT /admin/leaves/{leave_id}`

## Leave Flow

1. Admin creates an employee and assigns total paid leaves.
2. Employee logs in and sees total, used, and remaining leave balance.
3. Employee applies for leave with leave type, start date, end date, and required description.
4. Available leave types are `Casual Leave`, `Sick Leave`, and `Loss of Pay`.
5. If remaining paid leaves are `0`, the employee can select only `Loss of Pay`.
6. Admin approves or rejects pending requests.
7. Approved Casual Leave and Sick Leave reduce used and remaining leave balance.
8. Approved Loss of Pay does not reduce paid leave balance.

## Step-by-Step Development Summary

Step 1: Created backend and frontend project structure.

Why: A clear folder structure makes the code easier to explain and maintain.

Step 2: Connected FastAPI to PostgreSQL using SQLAlchemy and env-based settings.

Why: SQLAlchemy gives Python classes for database tables, while env variables keep database credentials out of source code.

Step 3: Created SQLAlchemy models.

Why: Models define the three required tables and the relationships between users, leave requests, and leave balances.

Step 4: Implemented password hashing and JWT authentication.

Why: Passwords should never be stored as plain text, and JWT allows protected APIs without server-side sessions.

Step 5: Implemented employee APIs.

Why: Employees need to view their dashboard, apply for paid leave or Loss of Pay, check balance, and see request history.

Step 6: Implemented admin APIs.

Why: Admins need to create employees, review leave requests, and approve or reject them.

Step 7: Created the React frontend.

Why: The UI demonstrates login, role-based navigation, forms, and API integration.

Step 8: Connected frontend with backend.

Why: Axios sends API requests and attaches the JWT token for protected routes.

Step 9: Added leave balance rules and safer frontend error handling.

Why: Employees should only use Loss of Pay after paid leave balance is completed, and validation errors should show messages instead of a blank page.

Step 10: Prepared project documentation.

Why: A good README helps interviewers understand the project quickly.

## AI Usage

AI tools were used for:

- Requirement understanding
- Architecture planning
- Database design
- API planning
- Debugging support
- Documentation improvement

Implementation decisions were manually reviewed.

## Challenges Faced

- Keeping the project simple while still showing full-stack skills.
- Designing role-based access without adding unnecessary architecture.
- Updating leave balance only when a pending request is approved.
- Allowing Loss of Pay after paid leave balance is completed without deducting balance.
- Keeping frontend state readable for a fresher-level project.
- Preventing validation errors from blanking the React page.

## Future Improvements

- Add pagination for leave requests.
- Add employee profile editing.
- Add admin filters by status.
- Add unit tests for backend services.
- Add better form validation messages in the frontend.
