# Platform Admin Panel – Campusorbit

## 1. Overview
### What is the Platform Admin Panel?
The **Platform Admin Panel** is the "Super Admin" or "SaaS Owner" interface of Campusorbit. It is the control center for managing the entire SaaS business.

### Who uses it?
- **SaaS Owners / Founders**: To monitor business growth and health.
- **Support Staff**: To onboard new schools and resolve technical issues.
- **Operations Team**: To manage subscriptions and feature access.

### Platform Admin vs. School Admin
| Feature | Platform Admin (You) | School Admin (Client) |
| :--- | :--- | :--- |
| **Scope** | Manages **All** Schools/Tuitions | Manages **One** School/Tuition |
| **Data Access** | Operational Metadata (Plan, Status) | Student/Teacher Academic Data |
| **Capabilities** | Onboard Schools, Enable Features, View Logs | Admissions, Fees, Attendance, Exams |
| **Security** | Highest Privilege | Restricted to their tenant |

---

## 2. Roles & Permissions
### The "Platform Admin" Role
This is a super-user role with specialized access protected by strict backend permissions (`IsPlatformAdmin`).

### ✅ What You CAN Do
- **Create & Onboard** new Schools and Tuition Centers.
- **Access Control**: Enable or disable features (e.g., "Notes", "Attendance") for specific tenants.
- **Support**: View and resolve support tickets raised by schools.
- **Audit**: View system-wide activity logs for security monitoring.
- **Login**: Access the dedicated URL `/platform/dashboard`.

### 🚫 What You CANNOT Do (Privacy & Safety)
- **Edit Academic Data**: You cannot directly modify student grades or attendance records within a school (unless you impersonate or have specific db access).
- **Manage School Internal Staff**: You create the *School*, but the *School Admin* manages their own teachers.

---

## 3. Platform Admin Dashboard
**URL:** `/platform/dashboard`

The dashboard provides an at-a-glance view of your SaaS business health.

### Key Metrics
- **Total Schools**: Number of registered educational institutions.
- **Active Students**: Aggregate count of students across all schools (indicates usage volume).
- **Total Revenue**: (If configured) Estimated monthly revenue based on subscription plans.
- **System Health**: Quick status check of services.

---

## 4. Managing Schools & Tuitions
This is the core function of the panel.

### Adding a New Tenant
1.  Navigate to **Schools** > **Add School**.
2.  **Basic Info**: Enter School Name, Code (Unique ID), and Contact details.
3.  **Account Type (Crucial)**:
    - Select **School**: For formal K-12 schools with Principals, multiple classes/sections.
    - Select **Tuition**: For coaching centers (enables "Batch" terminology and simplified dashboard).
4.  **Plan**: Assign a subscription plan (Trial, Basic, Premium).
5.  **Save**.

### Configuring Features (Feature Toggles)
You can monetize features by enabling them only for premium plans.
- **Select School** > **Settings** (or Feature Toggles logic).
- **Toggle Options**:
    - `Attendance`: Enforce digital attendance.
    - `Notes`: Enable "Study Materials" module (`notes_enabled`).
    - `Fees`: Enable Fee management.
    - `Student Login`: Allow students to access their own portal.

---

## 5. Operations & Support
### Activity Logs
**URL:** `/platform/activity-logs`
- **Purpose**: Security and Debugging.
- **What it tracks**: Who logged in, who deleted a student, who changed a fee structure.
- **Usage**: Use this to investigate "Who did this?" questions from clients.

### Support Requests
**URL:** `/platform/support`
- **Purpose**: Ticketing system.
- **Workflow**:
    1.  School Admin raises a request from their panel.
    2.  You see it in this list.
    3.  You can mark it as **Resolved** after fixing it.

---

## 6. Technical Notes for Developers
- **Routes**: All platform routes are prefixed with `/platform/` and guarded by `ProtectedRoute({ allowedRoles: ['platform_admin'] })`.
- **API**: Backend endpoints reside in `apps/schools/urls.py` under `api/platform/`.
- **Logic**: Use `user.role === 'platform_admin'` for any logic that applies strictly to this panel.
