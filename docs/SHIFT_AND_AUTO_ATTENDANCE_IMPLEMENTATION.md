# Employee Shift Management & Auto-Attendance Marking System

## Overview

This system implements:
1. **Employee Shift Management** - Individual shifts for each employee with edit capability for HR/Super Admin
2. **Auto-Attendance Marking** - Automatic marking of unrecorded attendance as Leave or Loss of Pay (LOP) after 2 working days
3. **Manager Approval Workflow** - Manual attendance entries require manager approval before finalization

---

## Features

### 1. Shift Management

#### Backend Components:
- **Model**: `EmployeeShift.js` - Links employees to shifts with effective dates
- **Model**: `Shift.js` - Defines shifts (name, code, start time, end time, grace period)
- **Controller**: `ShiftController.js` - CRUD operations for shifts
- **Routes**: `ShiftRouter.js` - API endpoints for shift management

#### Frontend Components:
- **ShiftEditModal** - Modal for HR/Super Admin to edit employee shifts
- **Shift Display** - Calendar shows employee's current shift for all days

#### API Endpoints:
```
GET  /api/shifts                              - List all shifts
POST /api/shifts                              - Create new shift (SUPER_ADMIN, HR_ADMIN only)
GET  /api/shifts/:shiftId                     - Get shift details
PUT  /api/shifts/:shiftId                     - Update shift (SUPER_ADMIN, HR_ADMIN only)
DELETE /api/shifts/:shiftId                   - Delete shift (SUPER_ADMIN only)
POST /api/shifts/assign                       - Assign shift to employee (SUPER_ADMIN, HR_ADMIN only)
GET  /api/shifts/employee/:employeeId         - Get employee's current shift
GET  /api/shifts/employee/:employeeId/history - Get employee's shift history
GET  /api/shifts/:shiftId/employees           - Get employees on a shift
```

#### Seeder:
The `shiftSeeder.js` creates default shifts:
- Day Shift (09:00-17:00)
- Morning Shift (08:00-16:00)
- Evening Shift (14:00-22:00)
- Night Shift (22:00-06:00)
- Flexible Shift (10:00-18:00)

It also assigns all existing employees to the Day Shift by default.

---

### 2. Auto-Attendance Marking System

#### Functionality:
- **Scheduled Task**: Runs daily at 10 PM (22:00)
- **Process**: Checks last 2 working days for missing attendance
- **Actions**:
  - If employee has earned leave balance → Auto-mark as Leave, deduct balance
  - If no balance → Auto-mark as Loss of Pay (LOP)
  - If attendance is manually added within 2 days → No auto-marking

#### Backend Components:
- **Service**: `attendanceAutoMarkService.js` - Core logic for auto-marking
- **Service**: `schedulerService.js` - Cron job scheduler
- **Model Updates**: Added fields to Attendance model:
  - `isLossOfPay` - Boolean flag for LOP status
  - `lopReason` - Reason for LOP (No Leave Balance, Auto-marked - No Attendance)
  - `isAutoMarked` - Indicates auto-system marking
  - `associatedLeaveRequest` - Links to generated leave request
  - `requiresManagerApproval` - Manual entries need approval
  - `manuallyAddedBy` - User who manually added attendance

#### API Endpoints for Auto-Marking:
```
GET  /api/attendance/pending/approvals        - Get pending manager approvals
GET  /api/attendance/lop/status               - Get LOP records
POST /api/attendance/auto-mark/trigger        - Manually trigger auto-mark (testing/admin only)
```

#### Database Indices:
Added optimized indices for:
- Employee + effective date lookups
- Active shift lookups
- Attendance date queries

---

### 3. Manager Approval Workflow

#### Process:
1. Employee manually adds attendance → Status: "Pending", `requiresManagerApproval: true`
2. Notification sent to manager (optional implementation)
3. Manager reviews and approves/rejects
4. Once approved → Status: "Approved", `approvalStatus: "Approved"`
5. Rejected records can be resubmitted

#### Frontend Indicators:
- Pending approval: Blue badge with ⏳ symbol
- Auto-marked records: Yellow badge with 🤖 symbol
- Loss of Pay: Orange/red badge with reason
- Approval status shown in attendance calendar

#### Manager Approval Interface:
Endpoint: `GET /api/attendance/pending/approvals`
Returns pending records for manager's team

---

## Installation & Setup

### 1. Install Dependencies
```bash
cd server
npm install
```
The `cron` package has been added to schedule the daily task.

### 2. Initialize on Server Start
The system automatically:
- Creates default shifts via seeder
- Assigns shifts to existing employees
- Initializes scheduled tasks
- Runs auto-mark every day at 10 PM

### 3. Environment Configuration
No additional environment variables needed. Scheduler runs with defaults.

---

## Database Schema Updates

### Attendance Model Changes
```javascript
// New Fields Added:
isLossOfPay: Boolean          // LOP flag
lopReason: String             // "No Leave Balance" | "Auto-marked - No Attendance"
isAutoMarked: Boolean         // Auto-system marking flag
associatedLeaveRequest: ID    // Reference to generated leave request
requiresManagerApproval: Boolean
manuallyAddedBy: ID           // User who manually added
```

### EmployeeShift Model
- Links Employee ↔ Shift
- Tracks effective dates and history
- Supports shift changes over time

---

## User Permissions

### Shift Management:
- **View Shifts**: All authenticated users
- **Create/Update/Delete Shifts**: SUPER_ADMIN, HR_ADMIN only
- **Assign Shifts**: SUPER_ADMIN, HR_ADMIN only

### Attendance Approval:
- **View Own Attendance**: All employees
- **Manager Approvals**: Managers of team members
- **View All LOP**: HR_ADMIN, SUPER_ADMIN
- **Trigger Auto-mark**: SUPER_ADMIN only (for testing)

---

## Frontend Enhancements

### Calendar Display:
- Shows employee's current shift for all days
- Visual indicators for:
  - 🤖 Auto-marked records (yellow)
  - 💼 Loss of Pay with reason (orange/red)
  - ⏳ Pending approval (blue)
  - 📌 Both leave and attendance

### Edit Shift Button:
- Available for HR_ADMIN and SUPER_ADMIN
- Opens modal to select from available shifts
- Effective immediately after assignment

### Legend:
Updated to show all new statuses and indicators

---

## Working Days Calculation

System considers **working days** as Monday-Friday (excludes Saturday and Sunday).

**Example Timeline:**
- Monday (Day 1): No attendance recorded → No action
- Tuesday (Day 2): No attendance recorded → No action
- Wednesday (10 PM): Auto-mark trigger
  - If balance available → Marked as Leave for Monday & Tuesday
  - If no balance → Marked as LOP for both days
  - If attendance added on Monday/Tuesday → Only LOP for days without attendance

---

## Testing Auto-Mark Feature

### Trigger Manually (Admin Only):
```bash
POST /api/attendance/auto-mark/trigger

# Response:
{
  "success": true,
  "message": "Auto-mark task completed"
}
```

### View LOP Records:
```bash
GET /api/attendance/lop/status?page=1&limit=10

# Response:
{
  "success": true,
  "data": {
    "lopRecords": [...],
    "pagination": {...}
  }
}
```

---

## Troubleshooting

### Auto-Mark Not Running:
1. Check server logs for scheduler initialization
2. Verify MongoDB connection
3. Ensure `cron` package is installed: `npm list cron`
4. Check if scheduled time (10 PM) has passed
5. Use manual trigger for testing

### Shifts Not Showing:
1. Verify shift seeder ran successfully
2. Check employee has active shift assignment
3. Confirm shift dates are valid (effectiveFrom <= today)

### Approval Not Required:
- Only manually added attendance requires approval
- Auto-marked records are auto-approved
- Regular punch records don't require approval

---

## Future Enhancements

1. **Notifications**: Email/SMS to managers when approval needed
2. **Bulk Operations**: Approve multiple records at once
3. **Shift Templates**: Copy shifts across multiple employees
4. **Advance Approval**: Managers can pre-approve known absences
5. **Reports**: LOP trends, approval statistics
6. **Integration**: SMS/Email confirmations for employees

---

## Monitoring & Maintenance

### Logs to Monitor:
- Scheduler initialization: `📅 Initializing scheduled jobs...`
- Auto-mark execution: `🔄 Starting auto-mark attendance process...`
- Completion: `✨ Auto-mark completed! Marked X as Leave, Y as LOP`

### Regular Checks:
- Database indices are properly created
- Leave balance calculations are accurate
- Pending approvals don't pile up (managers should review regularly)

---

## API Response Examples

### Get Employee's Current Shift:
```bash
GET /api/shifts/employee/{employeeId}

{
  "success": true,
  "data": {
    "_id": "...",
    "name": "Day Shift",
    "startTime": "09:00",
    "endTime": "17:00",
    "gracePeriodMinutes": 15
  }
}
```

### Assign Shift to Employee:
```bash
POST /api/shifts/assign

Request:
{
  "employeeId": "...",
  "shiftId": "...",
  "effectiveFrom": "2026-04-20"
}

Response:
{
  "success": true,
  "data": {
    "employee": "...",
    "shift": "...",
    "effectiveFrom": "2026-04-20",
    "isActive": true
  }
}
```

---

## Implementation Checklist

- ✅ Shift management with employee assignments
- ✅ Auto-attendance marking after 2 working days
- ✅ Loss of Pay (LOP) for no balance cases
- ✅ Manager approval workflow for manual entries
- ✅ Scheduler running at 10 PM daily
- ✅ Frontend displays all statuses
- ✅ Permission guards for HR/Super Admin
- ✅ Database optimizations and indices
- ✅ Comprehensive logging
- ✅ Backwards compatible with existing functionality
