# HRMS API Endpoint Catalog

Last updated: March 17, 2026  
Total endpoints: **165**  
Base URL: `http://localhost:5000/api`

Auth legend:
- `public` — no token required
- `auth` — requires valid JWT (Bearer token)
- `auth + role(...)` — requires JWT and specific role(s)
- `auth + perm(...)` — requires JWT and specific permission

---

## /api/auth — Authentication (16 endpoints)

| # | Method | Path | Auth | Description |
|---|--------|------|------|-------------|
| 1 | POST | `/api/auth/register-superadmin` | public | Register the initial super admin account |
| 2 | POST | `/api/auth/register-hr-admin` | auth + role(SUPER_ADMIN, HR_ADMIN) | Create an HR admin account |
| 3 | POST | `/api/auth/register-manager` | auth + role(SUPER_ADMIN, HR_ADMIN) | Create a manager account |
| 4 | POST | `/api/auth/register-employee` | auth + role(SUPER_ADMIN, HR_ADMIN) | Create an employee account |
| 5 | POST | `/api/auth/login` | public (rate-limited) | Login with email and password |
| 6 | POST | `/api/auth/refresh-token` | public | Exchange a refresh token for a new access token |
| 7 | POST | `/api/auth/forgot-username` | public | Retrieve masked username hint by email |
| 8 | POST | `/api/auth/forgot-password` | public | Trigger password reset flow |
| 9 | POST | `/api/auth/reset-password` | public | Set a new password using a reset token |
| 10 | POST | `/api/auth/logout` | auth | Invalidate the current session / refresh token |
| 11 | POST | `/api/auth/change-password` | auth | Change password while logged in |
| 12 | POST | `/api/auth/complete-initial-password` | auth | Complete first-time forced password change |
| 13 | POST | `/api/auth/mfa/enable` | auth | Enable MFA (currently mock) |
| 14 | POST | `/api/auth/mfa/disable` | auth | Disable MFA (currently mock) |
| 15 | GET | `/api/auth/sessions` | auth | View active sessions (currently mock) |
| 16 | POST | `/api/auth/sessions/terminate` | auth | Terminate a session (currently mock) |

---

## /api/employees — Employee Management (22 endpoints)

| # | Method | Path | Auth | Description |
|---|--------|------|------|-------------|
| 17 | POST | `/api/employees` | auth + role(SUPER_ADMIN, HR_ADMIN) | Create a new employee |
| 18 | GET | `/api/employees` | auth + role(SUPER_ADMIN, HR_ADMIN, DEPT_ADMIN, MANAGER) | List employees with pagination and filters |
| 19 | GET | `/api/employees/managers` | auth + role(SUPER_ADMIN, HR_ADMIN) | List managers for assignment dropdown |
| 20 | POST | `/api/employees/bulk/import` | auth + role(SUPER_ADMIN, HR_ADMIN) | Bulk import employees |
| 21 | POST | `/api/employees/bulk/update` | auth + role(SUPER_ADMIN, HR_ADMIN) | Bulk update employees |
| 22 | GET | `/api/employees/export` | auth + role(SUPER_ADMIN, HR_ADMIN) | Export employee list (CSV/JSON) |
| 23 | GET | `/api/employees/me/profile` | auth (all roles) | View own employee profile |
| 24 | GET | `/api/employees/me/manager` | auth (all roles) | View own manager |
| 25 | GET | `/api/employees/my-team` | auth + role(SUPER_ADMIN, HR_ADMIN, DEPT_ADMIN, MANAGER) | View direct reports |
| 26 | PUT | `/api/employees/profile/update` | auth (all roles) | Update own profile fields |
| 27 | GET | `/api/employees/:employeeId` | auth (all roles, scoped) | Get employee details by ID |
| 28 | PUT | `/api/employees/:employeeId` | auth + role(SUPER_ADMIN, HR_ADMIN) | Full update of an employee |
| 29 | GET | `/api/employees/:employeeId/profile` | auth (all roles, scoped) | View employee profile |
| 30 | POST | `/api/employees/:employeeId/documents` | auth + role(SUPER_ADMIN, HR_ADMIN, EMPLOYEE) | Upload employee document |
| 31 | GET | `/api/employees/:employeeId/documents/:documentId` | auth (scoped roles) | Download employee document |
| 32 | GET | `/api/employees/:employeeId/salary` | auth (scoped roles) | View salary information |
| 33 | GET | `/api/employees/:employeeId/history` | auth (scoped roles) | View employee history |
| 34 | PUT | `/api/employees/:employeeId/transfer-dept` | auth + role(SUPER_ADMIN, HR_ADMIN) | Transfer employee to another department |
| 35 | PUT | `/api/employees/:employeeId/change-designation` | auth + role(SUPER_ADMIN, HR_ADMIN) | Change employee designation |
| 36 | PUT | `/api/employees/:employeeId/change-manager` | auth + role(SUPER_ADMIN, HR_ADMIN) | Change employee's manager |
| 37 | PUT | `/api/employees/:employeeId/deactivate` | auth + role(SUPER_ADMIN, HR_ADMIN) | Deactivate employee |
| 38 | PUT | `/api/employees/:employeeId/activate` | auth + role(SUPER_ADMIN, HR_ADMIN) | Activate employee |

---

## /api/attendance — Attendance Management (19 endpoints)

| # | Method | Path | Auth | Description |
|---|--------|------|------|-------------|
| 39 | POST | `/api/attendance/check-in` | auth | Employee check-in |
| 40 | POST | `/api/attendance/check-out` | auth | Employee check-out |
| 41 | POST | `/api/attendance/checkin` | auth | Alias for check-in |
| 42 | POST | `/api/attendance/checkout` | auth | Alias for check-out |
| 43 | POST | `/api/attendance/break/start` | auth | Start break |
| 44 | POST | `/api/attendance/break/end` | auth | End break |
| 45 | GET | `/api/attendance/own` | auth | View own attendance records |
| 46 | GET | `/api/attendance/team` | auth + perm(attendance.view_team) | View team attendance |
| 47 | GET | `/api/attendance/all` | auth + perm(attendance.view_all) | View all attendance (HR/Admin) |
| 48 | GET | `/api/attendance/monthly-summary` | auth + perm(attendance.view_team) | Monthly attendance summary |
| 49 | PUT | `/api/attendance/:attendanceId` | auth + perm(attendance.edit) | Edit an attendance record |
| 50 | DELETE | `/api/attendance/:attendanceId` | auth + perm(attendance.delete) | Soft delete an attendance record |
| 51 | POST | `/api/attendance/bulk/upload` | auth + perm(attendance.bulk_upload) | Bulk upload attendance records |
| 52 | GET | `/api/attendance/export/download` | auth + perm(attendance.export) | Export attendance as CSV |
| 53 | POST | `/api/attendance/:attendanceId/approve` | auth + perm(attendance.approve) | Approve attendance record |
| 54 | POST | `/api/attendance/:attendanceId/reject` | auth + perm(attendance.reject) | Reject attendance record |
| 55 | POST | `/api/attendance/:attendanceId/shift/assign` | auth + perm(attendance.shift_assign) | Assign shift to employee |
| 56 | PUT | `/api/attendance/:attendanceId/shift/update` | auth + perm(attendance.shift_update) | Update shift assignment |
| 57 | DELETE | `/api/attendance/:attendanceId/shift/delete` | auth + perm(attendance.shift_delete) | Delete shift assignment |

---

## /api/leaves — Leave Management (15 endpoints)

| # | Method | Path | Auth | Description |
|---|--------|------|------|-------------|
| 58 | POST | `/api/leaves` | auth + perm(leaves.create) | Apply for leave |
| 59 | POST | `/api/leaves/cancel/:id` | auth + perm(leaves.cancel) | Cancel a leave request |
| 60 | PUT | `/api/leaves/:id` | auth + perm(leaves.update) | Update a leave request |
| 61 | GET | `/api/leaves/own` | auth + perm(leaves.read) | View own leave requests |
| 62 | GET | `/api/leaves/team` | auth + perm(leaves.list) | View team leave requests |
| 63 | GET | `/api/leaves/all` | auth + perm(leaves.list) | View all leave requests (HR/Admin) |
| 64 | PATCH | `/api/leaves/:id/approve` | auth + perm(leaves.approve) | Approve a leave request |
| 65 | PATCH | `/api/leaves/:id/reject` | auth + perm(leaves.reject) | Reject a leave request |
| 66 | POST | `/api/leaves/bulk-approve` | auth + perm(leaves.approve) | Bulk approve leave requests |
| 67 | POST | `/api/leaves/policy` | auth + perm(leaves.create) | Create a leave policy |
| 68 | PUT | `/api/leaves/policy/:id` | auth + perm(leaves.update) | Update a leave policy |
| 69 | DELETE | `/api/leaves/policy/:id` | auth + perm(leaves.delete) | Delete a leave policy |
| 70 | GET | `/api/leaves/policy` | auth + perm(leaves.read) | View leave policies |
| 71 | GET | `/api/leaves/balance` | auth + perm(leaves.read) | View leave balances |
| 72 | PATCH | `/api/leaves/balance` | auth + perm(leaves.update) | Adjust leave balance |

---

## /api/payroll — Payroll (24 endpoints)

| # | Method | Path | Auth | Description |
|---|--------|------|------|-------------|
| 73 | POST | `/api/payroll` | auth + perm(payroll.create) | Create payroll run |
| 74 | POST | `/api/payroll/process` | auth + perm(payroll.process) | Process payroll (no run ID) |
| 75 | POST | `/api/payroll/:runId/process` | auth + perm(payroll.process) | Process a specific payroll run |
| 76 | PATCH | `/api/payroll/:id/approve` | auth + perm(payroll.approve) | Approve a payroll run |
| 77 | PATCH | `/api/payroll/:id/reject` | auth + perm(payroll.reject) | Reject a payroll run |
| 78 | POST | `/api/payroll/generate-slips` | auth + perm(payroll.generate_slips) | Generate payslips (no run ID) |
| 79 | POST | `/api/payroll/:runId/generate-slips` | auth + perm(payroll.generate_slips) | Generate payslips for a run |
| 80 | GET | `/api/payroll/own` | auth + perm(payroll.view_own) | View own payslips |
| 81 | GET | `/api/payroll/all` | auth + perm(payroll.view_all) | View all payroll records |
| 82 | GET | `/api/payroll/download/:id` | auth + perm(payroll.download_slip) | Download a payslip PDF |
| 83 | GET | `/api/payroll/export` | auth + perm(payroll.export) | Export payroll data |
| 84 | GET | `/api/payroll/:runId/export` | auth + perm(payroll.export) | Export data for a specific run |
| 85 | PATCH | `/api/payroll/salary/:id` | auth + perm(payroll.update_salary) | Update an employee's salary |
| 86 | GET | `/api/payroll/structure` | auth + perm(payroll.view_salary_structure) | View salary structure/template |
| 87 | PATCH | `/api/payroll/structure` | auth + perm(payroll.update_salary_structure) | Update salary structure |
| 88 | PATCH | `/api/payroll/structure/:templateId` | auth + perm(payroll.update_salary_structure) | Update a specific salary template |
| 89 | POST | `/api/payroll/tax/calculate` | auth + perm(payroll.tax_calculate) | Calculate tax |
| 90 | PATCH | `/api/payroll/tax/update` | auth + perm(payroll.tax_update) | Update tax configuration |
| 91 | POST | `/api/payroll/bonus` | auth + perm(payroll.bonus_add) | Add bonus |
| 92 | POST | `/api/payroll/deduction` | auth + perm(payroll.deduction_add) | Add deduction |
| 93 | PATCH | `/api/payroll/lock` | auth + perm(payroll.lock) | Lock payroll |
| 94 | PATCH | `/api/payroll/:runId/lock` | auth + perm(payroll.lock) | Lock a specific payroll run |
| 95 | PATCH | `/api/payroll/unlock` | auth + perm(payroll.unlock) | Unlock payroll |
| 96 | PATCH | `/api/payroll/:runId/unlock` | auth + perm(payroll.unlock) | Unlock a specific payroll run |

---

## /api/performance — Performance Management (12 endpoints)

| # | Method | Path | Auth | Description |
|---|--------|------|------|-------------|
| 97 | POST | `/api/performance/review` | auth + perm(performance.create_review) | Create a performance review |
| 98 | PUT | `/api/performance/review/:id` | auth + perm(performance.update_review) | Update a review |
| 99 | DELETE | `/api/performance/review/:id` | auth + perm(performance.delete_review) | Delete a review |
| 100 | GET | `/api/performance/review/:id` | auth + perm(performance.view_review) | View a review |
| 101 | POST | `/api/performance/review/:id/submit` | auth + perm(performance.submit_review) | Submit a review |
| 102 | PATCH | `/api/performance/review/:id/approve` | auth + perm(performance.approve_review) | Approve a review |
| 103 | PATCH | `/api/performance/review/:id/reject` | auth + perm(performance.reject_review) | Reject a review |
| 104 | POST | `/api/performance/goal` | auth + perm(performance.goal_create) | Create a goal |
| 105 | PUT | `/api/performance/goal/:id` | auth + perm(performance.goal_update) | Update a goal |
| 106 | DELETE | `/api/performance/goal/:id` | auth + perm(performance.goal_delete) | Delete a goal |
| 107 | PATCH | `/api/performance/goal/:id/assign` | auth + perm(performance.goal_assign) | Assign a goal to an employee |
| 108 | GET | `/api/performance/goal/:id` | auth + perm(performance.goal_view) | View a goal |

---

## /api/recruitment — Recruitment (11 endpoints)

| # | Method | Path | Auth | Description |
|---|--------|------|------|-------------|
| 109 | POST | `/api/recruitment/job` | auth + perm(recruitment.create_job) | Create a job posting |
| 110 | PUT | `/api/recruitment/job/:id` | auth + perm(recruitment.update_job) | Update a job posting |
| 111 | DELETE | `/api/recruitment/job/:id` | auth + perm(recruitment.delete_job) | Delete a job posting |
| 112 | GET | `/api/recruitment/job` | auth + perm(recruitment.view_jobs) | List job postings |
| 113 | POST | `/api/recruitment/candidate/apply` | auth + perm(recruitment.apply_candidate) | Add/apply a candidate |
| 114 | PUT | `/api/recruitment/candidate/:id` | auth + perm(recruitment.update_candidate) | Update candidate record |
| 115 | DELETE | `/api/recruitment/candidate/:id` | auth + perm(recruitment.delete_candidate) | Delete a candidate |
| 116 | POST | `/api/recruitment/interview` | auth + perm(recruitment.schedule_interview) | Schedule an interview |
| 117 | PUT | `/api/recruitment/interview/:id` | auth + perm(recruitment.update_interview) | Update an interview |
| 118 | PATCH | `/api/recruitment/candidate/:id/reject` | auth + perm(recruitment.reject_candidate) | Reject a candidate |
| 119 | PATCH | `/api/recruitment/candidate/:id/hire` | auth + perm(recruitment.hire_candidate) | Hire a candidate |

---

## /api/departments — Departments (6 endpoints)

| # | Method | Path | Auth | Description |
|---|--------|------|------|-------------|
| 120 | POST | `/api/departments` | auth + perm(department.create) | Create a department |
| 121 | GET | `/api/departments` | auth + perm(department.list) | List all departments |
| 122 | GET | `/api/departments/:id` | auth + perm(department.read) | Get a department |
| 123 | PUT | `/api/departments/:id` | auth + perm(department.update) | Update a department |
| 124 | DELETE | `/api/departments/:id` | auth + perm(department.delete) | Delete a department |
| 125 | PATCH | `/api/departments/:id/assign-manager` | auth + perm(department.assign_manager) | Assign manager to department |

---

## /api/designations — Designations (8 endpoints)

| # | Method | Path | Auth | Description |
|---|--------|------|------|-------------|
| 126 | POST | `/api/designations` | auth + perm(designation.create) | Create a designation |
| 127 | GET | `/api/designations/hierarchy` | auth + perm(designation.read) | View designation hierarchy |
| 128 | GET | `/api/designations/org-chart` | auth + perm(designation.read) | View org chart |
| 129 | GET | `/api/designations` | auth + perm(designation.list) | List designations |
| 130 | GET | `/api/designations/:designationId` | auth + perm(designation.read) | Get a designation |
| 131 | PUT | `/api/designations/:designationId` | auth + perm(designation.update) | Update a designation |
| 132 | DELETE | `/api/designations/:designationId` | auth + perm(designation.delete) | Delete a designation |
| 133 | POST | `/api/designations/:designationId/assign` | auth + perm(designation.assign) | Assign designation to employee |

---

## /api/documents — Documents (8 endpoints)

| # | Method | Path | Auth | Description |
|---|--------|------|------|-------------|
| 134 | POST | `/api/documents` | auth + perm(document.upload) | Upload a document |
| 135 | GET | `/api/documents/:id` | auth + perm(document.view) | View document details |
| 136 | GET | `/api/documents/:id/download` | auth + perm(document.download) | Download a document |
| 137 | PUT | `/api/documents/:id` | auth + perm(document.update) | Update document metadata |
| 138 | DELETE | `/api/documents/:id` | auth + perm(document.delete) | Delete a document |
| 139 | POST | `/api/documents/:id/share` | auth + perm(document.share) | Share a document |
| 140 | PATCH | `/api/documents/:id/archive` | auth + perm(document.archive) | Archive a document |
| 141 | PATCH | `/api/documents/:id/restore` | auth + perm(document.restore) | Restore an archived document |

---

## /api/announcements — Announcements (5 endpoints)

| # | Method | Path | Auth | Description |
|---|--------|------|------|-------------|
| 142 | GET | `/api/announcements` | auth | List announcements |
| 143 | POST | `/api/announcements` | auth | Create an announcement |
| 144 | PUT | `/api/announcements/:id` | auth | Update an announcement |
| 145 | DELETE | `/api/announcements/:id` | auth | Delete an announcement |
| 146 | POST | `/api/announcements/:id/dismiss` | auth | Dismiss an announcement |

---

## /api/roles — Roles (8 endpoints)

| # | Method | Path | Auth | Description |
|---|--------|------|------|-------------|
| 147 | GET | `/api/roles` | auth + role(SUPER_ADMIN, HR_ADMIN) | List all roles |
| 148 | GET | `/api/roles/:roleId` | auth + role(SUPER_ADMIN, HR_ADMIN) | Get a role |
| 149 | POST | `/api/roles` | auth + role(SUPER_ADMIN, HR_ADMIN) | Create a role |
| 150 | PUT | `/api/roles/:roleId` | auth + role(SUPER_ADMIN, HR_ADMIN) | Update a role |
| 151 | DELETE | `/api/roles/:roleId` | auth + role(SUPER_ADMIN, HR_ADMIN) | Delete a role |
| 152 | POST | `/api/roles/:roleId/assign-permission` | auth + role(SUPER_ADMIN, HR_ADMIN) | Assign permission to a role |
| 153 | POST | `/api/roles/:roleId/remove-permission` | auth + role(SUPER_ADMIN, HR_ADMIN) | Remove permission from a role |
| 154 | GET | `/api/roles/:roleId/permissions` | auth + role(SUPER_ADMIN, HR_ADMIN) | View all permissions of a role |

---

## /api/permissions — Permissions (7 endpoints)

| # | Method | Path | Auth | Description |
|---|--------|------|------|-------------|
| 155 | GET | `/api/permissions` | auth + role(SUPER_ADMIN, HR_ADMIN) | List all permissions |
| 156 | GET | `/api/permissions/:permissionId` | auth + role(SUPER_ADMIN, HR_ADMIN) | Get a permission |
| 157 | POST | `/api/permissions` | auth + role(SUPER_ADMIN, HR_ADMIN) | Create a permission |
| 158 | PUT | `/api/permissions/:permissionId` | auth + role(SUPER_ADMIN, HR_ADMIN) | Update a permission |
| 159 | DELETE | `/api/permissions/:permissionId` | auth + role(SUPER_ADMIN, HR_ADMIN) | Delete a permission |
| 160 | POST | `/api/permissions/:permissionId/assign-role` | auth + role(SUPER_ADMIN, HR_ADMIN) | Assign role to a permission |
| 161 | POST | `/api/permissions/:permissionId/remove-role` | auth + role(SUPER_ADMIN, HR_ADMIN) | Remove role from a permission |

---

## /api/users — User Accounts (3 endpoints)

| # | Method | Path | Auth | Description |
|---|--------|------|------|-------------|
| 162 | POST | `/api/users/create-user` | auth + role(SUPER_ADMIN, HR_ADMIN) | Create a user account manually |
| 163 | GET | `/api/users/employees` | auth + role(SUPER_ADMIN, HR_ADMIN, MANAGER) | List all employee user accounts |
| 164 | POST | `/api/users/:employeeId/reset-password` | auth + role(SUPER_ADMIN, HR_ADMIN) | Admin reset of employee password |

---

## /api/admin — Admin Operations (1 endpoint)

| # | Method | Path | Auth | Description |
|---|--------|------|------|-------------|
| 165 | GET | `/api/admin/audit-logs` | auth + perm(audit_logs.view) | View system audit logs |

---

## Summary

| Module | Endpoints |
|--------|----------:|
| Auth | 16 |
| Employees | 22 |
| Attendance | 19 |
| Leaves | 15 |
| Payroll | 24 |
| Performance | 12 |
| Recruitment | 11 |
| Departments | 6 |
| Designations | 8 |
| Documents | 8 |
| Announcements | 5 |
| Roles | 8 |
| Permissions | 7 |
| Users | 3 |
| Admin | 1 |
| **Total** | **165** |
