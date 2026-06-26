# iSpace HRMS — Project Documentation

**Product:** Human Resource Management System (HRMS)  
**Audience:** Business stakeholders, product owners, HR operations, IT, and implementation partners  
**Purpose:** Describe *what* the system delivers for the organization, *who* it serves, and *how* work flows through it—without requiring a technical background to understand the business value.

---

## How to use this document

| You are… | Start here |
|----------|------------|
| **Leadership / sponsor** | [Executive summary](#executive-summary), [Business outcomes](#business-outcomes), [Compliance note](#compliance-and-payroll-disclaimer) |
| **HR / operations** | [Who uses the system](#who-uses-the-system), [Business capabilities](#business-capabilities-by-area), [Roadmap signals](#planned-and-follow-up-work) |
| **IT / engineering** | [Technical overview](#technical-overview-for-it), [Configuration summary](#configuration-summary), [Testing and deployment](#testing-and-deployment) |

This file is plain Markdown: you can open it in any editor, publish it on a wiki, or **export to PDF** (for example from VS Code, GitHub, or your documentation tool) for formal sharing.

---

## Executive summary

**iSpace HRMS** is a web-based platform that supports day-to-day people operations: maintaining employee records, tracking attendance, managing leave, running payroll-related processes, supporting performance and recruitment workflows, storing documents, and controlling *who can do what* through roles and permissions.

The product is built as a **single web application** for employees and people managers, with **different menus and actions depending on role** (for example employee vs manager vs HR vs administrator). The backend exposes a structured **API** so the same business rules can power the user interface consistently.

**Important:** Features described here reflect **what is implemented in the product codebase**. Go-live decisions should still include **user acceptance testing (UAT)**, security review, and validation of payroll and statutory rules with **Finance and Legal** before large-scale rollout.

---

## Business outcomes

| Outcome | What the system helps with |
|--------|----------------------------|
| **Single employee record** | One place for profile, org structure (department, designation), and related HR data instead of scattered spreadsheets. |
| **Controlled access** | People see and change only what their job requires—reducing error and protecting sensitive data. |
| **Time and attendance visibility** | Check-in/out, views for self, team, or wider groups depending on role; supports monthly summaries for oversight. |
| **Leave discipline** | Requests, balances, approvals—so requests are traceable and aligned with policy. |
| **Payroll support** | Workflows for runs, slips, and lock/unlock—**statutory calculations and filings must be confirmed** with finance for your jurisdiction (see [Compliance note](#compliance-and-payroll-disclaimer)). |
| **Communication** | Announcements can be published and tracked (including dismissals where supported). |
| **Governance** | Roles and permissions can be administered for the platform; session visibility supports audit-style needs. |

---

## Compliance and payroll disclaimer

The solution **references Indian statutory concepts** (such as EPF, ESI, TDS, Form 16) in line with common HR payroll language in India. **Final compliance, tax treatment, and reporting obligations are business and legal decisions.** Production payroll should be **signed off** by Finance and, where needed, Legal—not inferred from software documentation alone.

---

## Who uses the system

Understanding *roles* in business terms (actual titles may vary in your organization):

| Role (conceptual) | Typical needs addressed |
|-------------------|-------------------------|
| **Employee** | Own profile, attendance (e.g. punch / check-in-out), leave requests, pay-related views, announcements. |
| **Manager** | Team visibility (attendance, leave approvals, team views), often within the same unified experience with extra actions. |
| **HR / People ops** | Employee lifecycle, departments, designations, broader leave and attendance views, payroll operations, recruitment and performance areas as implemented. |
| **Super Admin / Platform admin** | User administration, roles and fine-grained permissions, system-wide settings and audit-oriented session views. |

The interface uses a **unified dashboard** with **role-based menus** so each group sees a relevant subset of capabilities.

---

## Business capabilities by area

Below, capabilities are described in **process language** (what the business can do), not in code structure.

### Platform and access

- **Sign-in and sessions:** Users authenticate securely; sessions can be listed or ended where the product supports it—useful for security hygiene.
- **Roles and permissions:** Access is not “one size fits all”; it is driven by **roles** and **permissions** so duties are separated appropriately.
- **Daily attendance entry:** A dedicated punch flow may be required before accessing the main home experience for certain roles—aligns with “clock in before work” policies.

### Organization and employee data

- **Employees:** Create and maintain records, profiles, manager relationships, activation/deactivation, and team views.
- **Departments and designations:** Support organizational hierarchy and job titles for reporting and workflows.

### Time and attendance

- **Attendance:** Self-service and, where permitted, team or wider views; check-in and check-out; **monthly summaries** for management reporting.

### Leave

- **Leave lifecycle:** Submit and manage requests; **approve or reject** as a manager or HR depending on rules; **policies and balances** are supported at the API/product level—**always confirm** they match your company policy in UAT.

### Payroll

- **Payroll operations:** Views and processes for payroll runs, slip generation, and lock/unlock style controls—intended to support controlled payroll cycles. **Business rules and legal accuracy** must be validated with Finance.

### Communications

- **Announcements:** Create, update, remove, and dismiss announcements so workforce messaging is centralized.

### Other HR domains (as implemented)

Depending on configuration and completion, the product may include areas such as **recruitment**, **performance management**, **documents**, **manpower planning**, **assets**, and **system access** records. Treat each area as **in scope for your rollout only after** you confirm live workflows and acceptance criteria with your HR and IT teams.

---

## Data and integration (business view)

- The system is designed around a **central database** for HR transactions (implementation uses **MongoDB** in code; **align** any deployment documentation that mentions other databases with your actual environment to avoid confusion during audits or handover).
- The **web client** talks to a **backend API** over HTTPS in production; **environment-specific settings** (URLs, secrets) are managed by IT during deployment.

---

## Planned and follow-up work

The following are **signals from the codebase** (TODOs, placeholders, or partial UI)—**not a fixed commercial roadmap**. Prioritize with your product owner.

| Theme | Business meaning |
|-------|------------------|
| **Manpower planning UI** | Backend may exist; end-to-end “create workforce plan” experience may need completion. |
| **Global search (HR header)** | Faster lookup across HR data may be pending. |
| **Quarterly appraisal** | Messaging may indicate “coming soon”; confirm before promising dates. |
| **Quality at scale** | Automated tests today focus notably on **permission behavior**; broader end-to-end and load testing is a sensible investment before large employee counts. |
| **Documentation alignment** | Resolve any mismatch between README and actual database or hosting choices so operations and compliance reviews stay clear. |

Some HR menu pages (for example exit clearance, meeting rooms, workflows, letter templates) may be **partial or shell experiences** until wired to full APIs—**verify each** before including in a go-live scope.

---

## Technical overview (for IT)

This section stays short so technical staff can onboard without repeating the business sections above.

| Layer | Stack (as in repository) |
|-------|---------------------------|
| **Client** | React 19, React Router, Axios, Tailwind CSS, Recharts; Create React App tooling. |
| **Server** | Node.js, Express, Mongoose (MongoDB), JWT, bcrypt, rate limiting on login, PDF generation where used. |
| **API base** | Routes are under `/api` (auth, users, employees, departments, leaves, payroll, attendance, recruitment, performance, documents, roles, permissions, admin, announcements, manpower planning, education, experience, assets, system access, designations). |

Client route constants should stay aligned with server routes (e.g. `client/src/api/endpoints.js`). Dashboard widgets are largely driven by `unifiedDashboardApi.js` for consistent data binding across roles.

---

## Configuration summary

| Setting | Role |
|---------|------|
| `REACT_APP_API_BASE_URL` | Where the browser calls the API (development often points at a local API URL). |
| `PORT` | API listen port (must match what the client expects). |
| `MONGODB_URI` | Database connection. |
| `CLIENT_ORIGIN` | Allowed web origin for browser calls (CORS). |
| `JWT_SECRET` | Signing key for tokens—**protect in production**. |

---

## Testing and deployment

- **Server:** Install dependencies, set `JWT_SECRET`, run the test suite (see repository `README.md` for permission-focused tests).
- **Client:** Standard test runner as provided by the React toolchain.
- **Deployment:** Project materials may reference hosts such as Vercel (frontend), AWS EC2 / Railway (backend), and monitoring—**validate** each choice against your organization’s security and availability standards.

---

## Document maintenance

| When | Action |
|------|--------|
| New product area goes live | Update [Business capabilities](#business-capabilities-by-area) and, if needed, [Technical overview](#technical-overview-for-it). |
| Scope changes from “planned” to “live” | Move items from [Planned and follow-up work](#planned-and-follow-up-work) into the capabilities section with a short confirmation note. |
| Environment or stack change | Update [Configuration summary](#configuration-summary) and deployment notes. |

---

*This document describes the product intent and implementation as reflected in the repository. Revalidate after major releases or compliance changes.*
