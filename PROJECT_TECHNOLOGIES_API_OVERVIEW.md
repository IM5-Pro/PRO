# HRMS Project Technologies and API Overview

Last updated: March 17, 2026

## 1) Project Information

HRMS (Human Resource Management System) is a full-stack web application for managing core HR operations.

Primary business modules currently present in the codebase:
- Authentication and role-based access control
- Employee management
- Department and designation masters
- Leave management
- Attendance management
- Payroll management
- Performance management
- Recruitment management
- Document management
- Announcements
- Admin, roles, and permissions

Repository structure:
- `client/` - React frontend
- `server/` - Node.js + Express backend (REST APIs)

## 2) Technology Stack

### Frontend (`client/package.json`)
- React 19 (`react`, `react-dom`)
- Create React App tooling (`react-scripts`)
- Routing: `react-router-dom`
- HTTP client: `axios`
- UI icons: `react-icons`
- Charts: `recharts`
- Styling: Tailwind CSS + PostCSS + Autoprefixer
- Testing libs: `@testing-library/*`, `web-vitals`

### Backend (`server/package.json`)
- Runtime: Node.js (ES modules)
- Framework: Express 5
- Database access: Mongoose
- Auth and security: `jsonwebtoken`, `bcrypt`, `express-rate-limit`, `cors`
- Config: `dotenv`
- Utilities: `pdfkit`, `uuid`
- Dev server: `nodemon`

### Backend Testing
- `jest`
- `supertest`
- `babel-jest` for test transpilation

### Database
- Active code uses MongoDB via Mongoose.

## 3) API Architecture Summary

- API style: REST
- Base URL prefix: `/api`
- Route mounting is defined in `server/index.js`
- Total route modules: 15
- Total API endpoints currently defined in route files: 165

Endpoint counting method:
- Counted `router.get/post/put/patch/delete(...)` occurrences across `server/src/routes/*Router.js`
- Count includes alias endpoints (example: both `/check-in` and `/checkin`)

HTTP method distribution across 165 endpoints:
- GET: 47
- POST: 62
- PUT: 22
- PATCH: 21
- DELETE: 13

## 4) API Module-Wise Endpoint Count

| Route Prefix | Route File | Endpoints |
|---|---|---:|
| `/api/admin` | `AdminRouter.js` | 1 |
| `/api/announcements` | `AnnouncementRouter.js` | 5 |
| `/api/attendance` | `AttendanceRouter.js` | 19 |
| `/api/auth` | `AuthRouter.js` | 16 |
| `/api/departments` | `DepartmentRouter.js` | 6 |
| `/api/designations` | `DesignationRouter.js` | 8 |
| `/api/documents` | `DocumentRouter.js` | 8 |
| `/api/employees` | `EmployeeRouter.js` | 22 |
| `/api/leaves` | `LeaveRouter.js` | 15 |
| `/api/payroll` | `PayrollRouter.js` | 24 |
| `/api/performance` | `PerformanceRouter.js` | 12 |
| `/api/permissions` | `PermissionRouter.js` | 7 |
| `/api/recruitment` | `RecruitmentRouter.js` | 11 |
| `/api/roles` | `RoleRouter.js` | 8 |
| `/api/users` | `UserRouter.js` | 3 |
| **Total** |  | **165** |

## 5) Frontend Delivery Snapshot

The frontend includes:
- Generic app pages (dashboard, employees, leaves, attendance, payroll, reports, settings, announcements, etc.)
- Dedicated HR pages under `client/src/components/Pages/HR/` such as:
  - `UserManagement.jsx`
  - `LeavesAttendance.jsx`
  - `ManpowerPlanning.jsx`
  - `Masters.jsx`
  - `Payroll.jsx`
  - `Workflows.jsx`
  - `ExitClearance.jsx`
  - `MeetingRoom.jsx`

## 6) Notes

- Existing implementation docs indicate strong completion for HR Dashboard and Leaves/Attendance API integration:
  - `HR_DASHBOARD_IMPLEMENTATION.md`
  - `LEAVES_ATTENDANCE_INTEGRATION_COMPLETE.md`
- Keep this document updated whenever new router endpoints are added or removed.
