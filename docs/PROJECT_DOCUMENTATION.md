# HRMS — Project & Feature Documentation

This document describes the **iSpace HRMS** (Human Resource Management System) codebase: purpose, architecture, tools, features that are **implemented and usable**, and **planned / backlog** items inferred from the repository (not a contractual sprint commitment—adjust dates and scope with your product owner).

---

## 1. Project overview

| Item | Description |
|------|-------------|
| **Name** | HRMS — Human Resource Management System |
| **Purpose** | Cloud-oriented HR operations: employees, attendance, leave, payroll, performance, recruitment, documents, governance (roles/permissions), and related workflows. |
| **Target compliance theme** | Indian statutory concepts (e.g. EPF, ESI, TDS, Form 16) are referenced in project documentation; **legal/final compliance must be validated** with finance/legal for production payroll. |
| **Clients** | React SPA (`client/`) |
| **API** | Node.js + Express (`server/`) |
| **Data** | **MongoDB** via Mongoose (`server/src/config/db.js`). *Note: root README also mentions PostgreSQL for deployment—align database choice with your actual environment.* |
| **Auth** | JWT with **role-based access control (RBAC)** and fine-grained **permissions** (`permissionGuard`, seeded roles). |

---

## 2. Repository layout (high level)

| Path | Role |
|------|------|
| `client/` | React 19 UI (Create React App), Tailwind, React Router, Axios API client |
| `server/` | Express API, Mongoose models, controllers, middleware (auth, permissions, rate limit on login) |
| `README.md` | High-level modules, security claims, deployment notes, how to run permission tests |

---

## 3. Technology stack

### 3.1 Frontend (`client/package.json`)

| Category | Technology |
|----------|------------|
| UI | React 19, React DOM |
| Routing | `react-router-dom` v6 |
| HTTP | `axios` |
| Charts | `recharts` |
| Icons | `react-icons` |
| Styling | Tailwind CSS 3, PostCSS, Autoprefixer |
| Tooling | `react-scripts` 5 (CRA), Testing Library |

### 3.2 Backend (`server/package.json`)

| Category | Technology |
|----------|------------|
| Runtime | Node.js (ES modules: `"type": "module"`) |
| Framework | Express 5 |
| Database | Mongoose 9 (MongoDB) |
| Auth / security | `jsonwebtoken`, `bcrypt`, `express-rate-limit` (login limiter) |
| PDF | `pdfkit` |
| Dev / test | Jest, Supertest, Babel, `cross-env`, Nodemon |

### 3.3 Configuration & integration (from code/docs)

| Concern | Detail |
|---------|--------|
| API base URL (client) | `REACT_APP_API_BASE_URL`; default in `client/src/api/client.js` is `http://localhost:7888/api` |
| Server port | `PORT` env or **5000** in `server/index.js` — **ensure client base URL matches** your running API port |
| DB | `MONGODB_URI` required for `server/src/config/db.js` |
| CORS | `CLIENT_ORIGIN` or default `http://localhost:3000` |
| JWT | `JWT_SECRET` (required for tokens; tests may use `test-secret`) |

---

## 4. Development & quality tools

| Tool | Use |
|------|-----|
| **Git** | Version control |
| **npm** | Package management (client and server) |
| **ESLint** (CRA) | Client lint via `react-app` config |
| **Jest + Supertest** | Server integration tests for **permission middleware** (`server/tests/permission.test.js`) |
| **React Testing Library** | Client unit/component tests (CRA default) |

---

## 5. AI tools & assisted development

**The repository does not record which AI coding assistants were used** (no committed Cursor rules, Copilot config, or similar in this tree).

Teams commonly use tools such as **Cursor**, **GitHub Copilot**, or other IDE-integrated assistants during development; those choices are **not versioned here**. If you need an audit trail for compliance, maintain a short **engineering handbook** or **ADRs** outside the repo, or document tooling in your internal wiki.

---

## 6. API surface (backend routes)

All routes are mounted under `/api` in `server/index.js`:

| Prefix | Area |
|--------|------|
| `/api/auth` | Login, registration flows, sessions, MFA endpoints (see `AuthRouter`) |
| `/api/users` | User administration |
| `/api/departments` | Departments |
| `/api/leaves` | Leave requests, policies, balances, approvals |
| `/api/payroll` | Payroll runs, processing, slips, lock/unlock |
| `/api/attendance` | Own/team/all attendance, check-in/out, monthly summary |
| `/api/recruitment` | Recruitment (jobs, candidates, interviews—see models/routes) |
| `/api/performance` | Performance reviews / goals |
| `/api/documents` | Employee documents |
| `/api/roles`, `/api/permissions` | RBAC management |
| `/api/admin` | Admin operations |
| `/api/employees` | Employee CRUD, profile, team, activation |
| `/api/designations` | Designations |
| `/api/announcements` | Announcements CRUD / dismiss |
| `/api/manpower-planning` | Manpower planning APIs |
| `/api/education`, `/api/experience` | Profile education & experience |
| `/api/assets` | Assets |
| `/api/system-access` | System access records |

Client-side route constants live in `client/src/api/endpoints.js` and should stay aligned with the server.

---

## 7. Features — ready to use (production readiness note)

**“Ready to use”** here means: **implemented in this repo** with API routes and/or wired dashboard data—not a formal warranty. Always run **UAT**, **security review**, and **load testing** before large rollouts (e.g. 2,000 employees).

### 7.1 Core platform

| Feature | Notes |
|---------|--------|
| **Authentication & sessions** | JWT auth; session listing / termination endpoints in client API map |
| **RBAC & permissions** | Roles seeded; `permissionGuard` tested via Jest (see README test instructions) |
| **Role-based UI** | Single `UnifiedDashboard` with per-role menus (`UnifiedDashboardConfig.js`) |
| **Daily punch flow** | Cookie + `/punch` route for employee/manager/HR before home (`App.js`) |

### 7.2 Employee & org structure

| Feature | Notes |
|---------|--------|
| **Employees** | List, create, update, profile, managers search, my-team, activate/deactivate |
| **Departments** | Department APIs + Super Admin UI |
| **Designations** | Designation APIs + HR Masters UI patterns |

### 7.3 Attendance

| Feature | Notes |
|---------|--------|
| **Own / team / all attendance** | Endpoints in `ATTENDANCE_ENDPOINTS` |
| **Check-in / check-out** | Wired in client endpoints |
| **Monthly summary** | Used for manager analytics/reports widgets |

### 7.4 Leave

| Feature | Notes |
|---------|--------|
| **Leave requests** | Create, update, own, team, all |
| **Approve / reject** | Integrated in `RolePage` actions for managers/HR |
| **Policies & balance** | Policy and balance endpoints |

### 7.5 Payroll

| Feature | Notes |
|---------|--------|
| **Own payroll / all runs** | HR and employee views |
| **Process / generate slips / lock** | Endpoints exposed; validate with finance for statutory rules |

### 7.6 Communications & content

| Feature | Notes |
|---------|--------|
| **Announcements** | List/create/update/delete/dismiss (`ANNOUNCEMENT_ENDPOINTS`) |

### 7.7 Governance (Super Admin)

| Feature | Notes |
|---------|--------|
| **Roles & permissions** | CRUD and assign flows; dashboard datasets from `ROLE_ENDPOINTS` / `PERMISSION_ENDPOINTS` |
| **Audit / session visibility** | Session activity used in audit-oriented pages (data source: `AUTH_ENDPOINTS.sessions`) |

### 7.8 Dashboard data wiring

`client/src/services/unifiedDashboardApi.js` binds **widgets** and **role page datasets** to real endpoints for employees, managers, HR admins, and super admins (attendance, leaves, payroll, employees, departments, roles, sessions, etc.). Pages that reuse this pipeline are **more consistently “data-backed”** than ad-hoc mocks.

---

## 8. Features — backlog / next sprint candidates

These items are **candidates** derived from **code comments and messaging**, not a fixed roadmap. Rename or reschedule with your team.

| Item | Source / signal |
|------|------------------|
| **Manpower planning — create workforce plan API** | `TODO` in `client/src/components/Pages/HR/ManpowerPlanning.jsx` (backend route exists; UI completion pending) |
| **HR header global search** | `TODO` in `client/src/components/HRHeader/HRHeader.jsx` |
| **Quarterly appraisal cycle** | UI copy: “coming soon” in `client/src/hooks/useHRDashboard.js` |
| **Broader E2E & load testing** | Only **permission middleware** has automated integration tests documented; expand Jest/API/UI tests per module |
| **Database documentation consistency** | README mentions MongoDB and PostgreSQL in different sections—resolve for ops |

### 8.1 HR portal pages (may mix “full API” vs “UX shell”)

Some HR menu items (e.g. exit clearance, meeting room, workflows, letter templates) have dedicated React pages. **Treat each as ready only after** you verify live API usage and acceptance criteria—do not assume parity with core attendance/leave/payroll without review.

---

## 9. Testing (how to run)

### Server — permission tests

From repository root `README.md`:

1. `cd server`
2. `npm install` (including devDependencies for Jest)
3. Set `JWT_SECRET` (tests default to `test-secret` if unset)
4. `npm test`

### Client

- `cd client && npm test` — CRA test runner (interactive by default)

---

## 10. Deployment (from project README)

Documented targets include **Vercel** (frontend), **AWS EC2 / Railway** (backend), **AWS RDS** (note conflict with MongoDB in code—**clarify actual DB**), **CloudWatch** monitoring. **Validate** each integration in your tenant.

---

## 11. Document maintenance

| When | Action |
|------|--------|
| New API module | Update §6 and `client/src/api/endpoints.js` reference |
| Feature complete | Move from §8 to §7 with short verification notes |
| Tooling change | Update §3–§5 |
| AI governance | If your org mandates AI disclosure, add an internal appendix—this file does not track AI vendors automatically |

---

*Last generated from repository structure and source files. Re-run technical review after major merges.*
