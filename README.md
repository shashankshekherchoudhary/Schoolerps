# Campusorbit - School ERP System

A comprehensive multi-tenant School ERP built with Django REST Framework and React.

## Features

### 5 User Roles with Role-Based Access
- **Platform Admin**: Manage all schools, suspend/activate, feature toggles, view activity logs
- **School Admin**: Full school management - students, teachers, classes, attendance, fees, exams, notices
- **Account Admin**: Fee management, payment recording
- **Teacher**: Mark attendance for assigned classes, enter exam marks
- **Student/Parent**: View profile, attendance history, fees, exam results, notices

### Core Modules
- **Multi-Tenant Architecture**: Complete school-wise data isolation
- **Attendance Management**: Bulk marking with 20-minute delayed absent alerts to parents
- **Fee Management**: Fee structures per class, partial payments, carry-forward from previous months
- **Exam Management**: Create exams, enter marks, auto-generate PDF report cards
- **Notices**: Target-specific announcements (all/students/teachers with priority levels)

### Technical Stack
- **Backend**: Django 4.2, Django REST Framework, PostgreSQL
- **Frontend**: React 18, Vite, TanStack Query
- **Auth**: JWT with refresh token rotation
- **Task Queue**: Celery + Redis (for delayed absent alerts)
- **PDF Generation**: ReportLab

## Quick Start

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Create .env file
copy .env.example .env
# Edit .env with your database credentials

# Create database
createdb campusorbit

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser (Platform Admin)
python manage.py createsuperuser

# Run server
python manage.py runserver
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

### Start Celery (for absent alerts)

```bash
# Make sure Redis is running
cd backend
celery -A campusorbit worker -l info
```

## API Endpoints Summary

### Authentication
- `POST /api/auth/login/` - Login (returns JWT tokens + user info)
- `POST /api/auth/refresh/` - Refresh access token
- `POST /api/auth/logout/` - Logout (blacklist refresh token)
- `GET /api/auth/me/` - Get current user profile

### Platform Admin
- `GET/POST /api/platform/schools/` - List/Create schools
- `POST /api/platform/schools/{id}/suspend/` - Suspend school
- `PUT /api/platform/schools/{id}/features/` - Toggle features
- `GET /api/platform/activity-logs/` - View all activity

### School Management
- `CRUD /api/school/students/` - Student management
- `CRUD /api/school/teachers/` - Teacher management
- `CRUD /api/school/classes/` - Class & section management
- `POST /api/school/classes/{id}/add_section/` - Add section

### Attendance
- `POST /api/attendance/students/bulk_mark/` - Bulk mark attendance
- `GET /api/attendance/students/by_section/` - Get section attendance
- `GET /api/attendance/student/history/` - Student's own history

### Fees
- `CRUD /api/fees/structures/` - Fee structure management
- `POST /api/fees/records/generate_bulk/` - Generate monthly records
- `POST /api/fees/payments/record_payment/` - Record a payment

### Exams
- `CRUD /api/exams/exams/` - Exam management
- `POST /api/exams/exams/{id}/publish/` - Publish results
- `POST /api/exams/results/bulk_entry/` - Enter marks
- `GET /api/exams/report-cards/{id}/download_pdf/` - Download report card

## Database Schema Overview

```
Users (Custom model with roles)
  └── School (Multi-tenant)
       ├── FeatureToggle (per-school features)
       ├── Classes → Sections
       ├── Subjects
       ├── Teachers (linked to Users)
       ├── Students (linked to Users)
       ├── StudentAttendance → AbsentAlert
       ├── TeacherAttendance
       ├── FeeStructure → FeeRecord → FeePayment
       ├── Exam → ExamSubject → ExamResult
       ├── ReportCard
       └── Notice
```

## Feature Toggles

Each school can have features enabled/disabled:
- `attendance_enabled`
- `fees_enabled`
- `exams_enabled`
- `student_login_enabled`

## Absent Alert System

When a student is marked absent:
1. Alert is scheduled (Celery task)
2. After 20 minutes delay, if still absent:
3. SMS/Email sent to parent (placeholder - integrate with Twilio/SendGrid)
4. If attendance is corrected before 20 min, alert is cancelled

## License

MIT License
