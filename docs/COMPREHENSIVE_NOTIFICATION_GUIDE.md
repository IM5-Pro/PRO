# Comprehensive Notification Integration Guide

This guide explains how to integrate notifications into all HRMS controllers and what notifications to create for each feature.

## Table of Contents
1. [Quick Start](#quick-start)
2. [Integration by Feature](#integration-by-feature)
3. [Implementation Examples](#implementation-examples)
4. [Best Practices](#best-practices)

---

## Quick Start

### 1. Import the Notification Service

```javascript
import * as notificationService from '../services/notificationService.js';
```

### 2. Call Appropriate Notification Function

```javascript
// Example in LeaveController.js
export const createLeaveRequest = async (req, res) => {
  try {
    const leaveRequest = await LeaveRequest.create(req.body);
    
    // Trigger notification
    await notificationService.notifyLeaveRequest({
      employeeId: leaveRequest.employeeId,
      managerId: req.body.managerId,
      hrAdminIds: req.body.hrAdminIds,
      leaveId: leaveRequest._id,
      leaveType: leaveRequest.leaveType,
      startDate: leaveRequest.startDate,
      endDate: leaveRequest.endDate,
      reason: leaveRequest.reason,
    });
    
    res.status(201).json(leaveRequest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### 3. Available Notification Functions

All notification functions are pre-built in `notificationService.js`. No additional setup needed!

---

## Integration by Feature

### 1. LEAVE MANAGEMENT

#### Functions Available:
- `notifyLeaveRequest(data)` - When employee applies leave
- `notifyLeaveApproval(data)` - When manager approves leave
- `notifyLeaveRejection(data)` - When manager rejects leave

#### Integration Points:

**LeaveController.js - createLeaveRequest()**
```javascript
await notificationService.notifyLeaveRequest({
  employeeId: leaveRequest.employeeId,
  managerId: employee.managerId,
  hrAdminIds: hrAdminIds, // Get from HR role users
  leaveId: leaveRequest._id,
  leaveType: leaveType,
  startDate: leaveRequest.startDate,
  endDate: leaveRequest.endDate,
  reason: leaveRequest.reason,
});
```

**LeaveController.js - approveLeave()**
```javascript
await notificationService.notifyLeaveApproval({
  employeeId: leaveRequest.employeeId,
  leaveId: leaveRequest._id,
  leaveType: leaveType,
  startDate: leaveRequest.startDate,
  endDate: leaveRequest.endDate,
  approvedBy: req.user._id,
});
```

**LeaveController.js - rejectLeave()**
```javascript
await notificationService.notifyLeaveRejection({
  employeeId: leaveRequest.employeeId,
  leaveId: leaveRequest._id,
  leaveType: leaveType,
  startDate: leaveRequest.startDate,
  endDate: leaveRequest.endDate,
  rejectionReason: req.body.reason,
  rejectedBy: req.user._id,
});
```

---

### 2. ATTENDANCE & TIMEKEEPING

#### Functions Available:
- `notifyLateArrival(data)` - When employee late to work
- `notifyAbsentDay(data)` - When employee marked absent
- `notifyAttendanceCorrection(data)` - When correction requested
- `notifyAttendanceCorrectionApproval(data)` - When correction approved
- `notifyOvertime(data)` - When overtime logged

#### Integration Points:

**AttendanceController.js - recordCheckIn()**
```javascript
// After check-in, if time > expected time
const checkInTime = new Date();
const expectedTime = new Date(); // Calculate from shift
if (checkInTime > expectedTime) {
  await notificationService.notifyLateArrival({
    employeeId: req.user._id,
    managerId: employee.managerId,
    date: new Date(),
    checkInTime: checkInTime.toLocaleTimeString(),
    expectedTime: expectedTime.toLocaleTimeString(),
  });
}
```

**AttendanceController.js - markAbsent()**
```javascript
await notificationService.notifyAbsentDay({
  employeeId: employeeId,
  managerId: employee.managerId,
  date: attendanceDate,
  dayCount: absenceCount, // Get total absences
});
```

**AttendanceController.js - requestCorrection()**
```javascript
await notificationService.notifyAttendanceCorrection({
  employeeId: employeeId,
  managerId: employee.managerId,
  hrAdminIds: hrAdminIds,
  attendanceId: attendance._id,
  correctionDate: attendance.date,
  reason: req.body.reason,
  requestedBy: req.user._id,
});
```

**AttendanceController.js - approveCorrection()**
```javascript
await notificationService.notifyAttendanceCorrectionApproval({
  employeeId: attendance.employeeId,
  attendanceId: attendance._id,
  correctionDate: attendance.date,
  approvedBy: req.user._id,
  newCheckIn: approved.checkInTime,
  newCheckOut: approved.checkOutTime,
});
```

---

### 3. PAYROLL & COMPENSATION

#### Functions Available:
- `notifyPayrollProcessing(data)` - When payroll starts
- `notifyPayrollProcessed(data)` - When payroll completes
- `notifySalarySlipGenerated(data)` - When salary slip ready
- `notifyReimbursementRequest(data)` - When reimbursement requested
- `notifyReimbursementApproval(data)` - When reimbursement approved
- `notifyBonusNotification(data)` - When bonus awarded

#### Integration Points:

**PayrollController.js - startPayrollRun()**
```javascript
const employeeIds = await Employee.find({ 
  status: 'ACTIVE' 
}).select('_id');

await notificationService.notifyPayrollProcessing({
  employeeIds: employeeIds.map(e => e._id),
  payrollRunId: payrollRun._id,
  month: payrollRun.month,
  year: payrollRun.year,
});
```

**PayrollController.js - completePayrollRun()**
```javascript
await notificationService.notifyPayrollProcessed({
  employeeIds: payrollRun.processedEmployees,
  payrollRunId: payrollRun._id,
  month: payrollRun.month,
  year: payrollRun.year,
});
```

**PayrollController.js - generateSalarySlip()**
```javascript
await notificationService.notifySalarySlipGenerated({
  employeeId: payrollDetail.employeeId,
  payrollDetailId: payrollDetail._id,
  month: payrollDetail.month,
  year: payrollDetail.year,
});
```

**PayrollController.js - requestReimbursement()**
```javascript
await notificationService.notifyReimbursementRequest({
  employeeId: req.user._id,
  managerId: employee.managerId,
  hrAdminIds: hrAdminIds,
  reimbursementId: reimbursement._id,
  amount: req.body.amount,
  description: req.body.description,
});
```

**PayrollController.js - approveReimbursement()**
```javascript
await notificationService.notifyReimbursementApproval({
  employeeId: reimbursement.employeeId,
  reimbursementId: reimbursement._id,
  amount: reimbursement.amount,
  approvedBy: req.user._id,
});
```

**PayrollController.js - awardBonus()**
```javascript
await notificationService.notifyBonusNotification({
  employeeId: req.body.employeeId,
  amount: req.body.amount,
  reason: req.body.reason, // e.g., "Performance Excellence Q4"
  month: new Date().getMonth(),
});
```

---

### 4. PERFORMANCE MANAGEMENT

#### Functions Available:
- `notifyPerformanceReviewRequest(data)` - When review initiated
- `notifyFeedbackRequest(data)` - When 360 feedback requested
- `notifyPerformanceReviewComplete(data)` - When review completed
- `notifyGoalSetting(data)` - When goal assigned
- `notifyPromotionEligible(data)` - When promotion eligible

#### Integration Points:

**PerformanceController.js - initiateReview()**
```javascript
await notificationService.notifyPerformanceReviewRequest({
  employeeId: req.body.employeeId,
  reviewerId: req.user._id,
  performanceReviewId: review._id,
  reviewPeriod: review.period, // "Q4 2024"
});
```

**PerformanceController.js - requestFeedback()**
```javascript
const feedbackProviders = req.body.feedbackProviderIds; // Array of user IDs
for (const providerId of feedbackProviders) {
  await notificationService.notifyFeedbackRequest({
    feedbackProviderId: providerId,
    employeeName: employee.firstName + ' ' + employee.lastName,
    reviewId: review._id,
    dueDate: review.feedbackDeadline,
  });
}
```

**PerformanceController.js - submitReview()**
```javascript
await notificationService.notifyPerformanceReviewComplete({
  employeeId: review.employeeId,
  performanceReviewId: review._id,
  rating: review.rating, // e.g., "4.5/5"
  reviewerName: req.user.firstName + ' ' + req.user.lastName,
});
```

**PerformanceController.js - setGoal()**
```javascript
await notificationService.notifyGoalSetting({
  employeeId: req.body.employeeId,
  goalId: goal._id,
  goalName: req.body.goalName,
  targetDate: req.body.targetDate,
});
```

---

### 5. EMPLOYEE DEVELOPMENT & TRAINING

#### Functions Available:
- `notifyTrainingAssigned(data)` - When training assigned
- `notifyTrainingCompleted(data)` - When training completed
- `notifyCertificationExpiry(data)` - When certification expiring

#### Integration Points:

**TrainingController.js - assignTraining()** (Create if doesn't exist)
```javascript
await notificationService.notifyTrainingAssigned({
  employeeId: req.body.employeeId,
  trainingName: req.body.trainingName,
  startDate: req.body.startDate,
  endDate: req.body.endDate,
  trainingId: training._id,
});
```

**TrainingController.js - completeTraining()** (Create if doesn't exist)
```javascript
await notificationService.notifyTrainingCompleted({
  employeeId: training.employeeId,
  trainingName: training.name,
  certificateId: certificate._id,
});
```

**ScheduledJobs/CertificationExpiry.js** (Create scheduled job)
```javascript
// Run daily to check expiring certifications
const expiringCerts = await Certificate.find({
  expiryDate: { $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
});

for (const cert of expiringCerts) {
  const daysRemaining = Math.ceil(
    (cert.expiryDate - new Date()) / (1000 * 60 * 60 * 24)
  );
  
  await notificationService.notifyCertificationExpiry({
    employeeId: cert.employeeId,
    certificationName: cert.name,
    expiryDate: cert.expiryDate,
    daysRemaining,
  });
}
```

---

### 6. HR OPERATIONS

#### Functions Available:
- `notifyRoleChange(data)` - When role/designation changes
- `notifyOnboardingTask(data)` - When onboarding task assigned

#### Integration Points:

**EmployeeController.js - updateEmployeeRole()**
```javascript
await notificationService.notifyRoleChange({
  employeeId: req.body.employeeId,
  oldRole: employee.role,
  newRole: req.body.newRole,
  effectiveDate: req.body.effectiveDate,
  hrAdminIds: hrAdminIds,
});
```

**OnboardingController.js - assignTask()** (Create if doesn't exist)
```javascript
await notificationService.notifyOnboardingTask({
  employeeId: req.body.employeeId,
  taskName: req.body.taskName,
  dueDate: req.body.dueDate,
  taskId: task._id,
});
```

---

### 7. MEETINGS & CALENDAR

#### Functions Available:
- `notifyMeetingInvitation(data)` - When meeting invitation sent
- `notifyMeetingReminder(data)` - 1-hour before meeting

#### Integration Points:

**MeetingController.js - createMeeting()** (Create if doesn't exist)
```javascript
await notificationService.notifyMeetingInvitation({
  attendeeIds: req.body.attendeeIds,
  meetingTitle: req.body.title,
  meetingDate: req.body.date,
  meetingTime: req.body.time,
  organizer: req.user.firstName + ' ' + req.user.lastName,
  meetingId: meeting._id,
});
```

**ScheduledJobs/MeetingReminder.js** (Create scheduled job)
```javascript
// Run every 5 minutes to check for upcoming meetings
const upcomingMeetings = await Meeting.find({
  startTime: {
    $gte: new Date(),
    $lte: new Date(Date.now() + 75 * 60 * 1000), // 75 minutes from now
  },
});

for (const meeting of upcomingMeetings) {
  if (!meeting.reminderSent) {
    await notificationService.notifyMeetingReminder({
      attendeeIds: meeting.attendees,
      meetingTitle: meeting.title,
      meetingTime: meeting.startTime.toLocaleTimeString(),
      meetingId: meeting._id,
    });
    
    // Mark reminder as sent
    meeting.reminderSent = true;
    await meeting.save();
  }
}
```

---

### 8. ANNOUNCEMENTS & SYSTEM

#### Functions Available:
- `notifyAnnouncement(data)` - Org-wide announcements
- `notifyPolicyUpdate(data)` - Policy change notifications
- `notifySystemAlert(data)` - Critical system alerts

#### Integration Points:

**AnnouncementController.js - createAnnouncement()**
```javascript
const recipientIds = req.body.sendToAll 
  ? (await User.find().select('_id')).map(u => u._id)
  : req.body.recipientIds;

await notificationService.notifyAnnouncement({
  recipientIds,
  title: req.body.title,
  message: req.body.message,
  announcementId: announcement._id,
  priority: req.body.priority || 'medium',
});
```

**PolicyController.js - createPolicy()** (Create if doesn't exist, or use Admin)
```javascript
const allEmployeeIds = (await User.find()).map(u => u._id);

await notificationService.notifyPolicyUpdate({
  recipientIds: allEmployeeIds,
  policyName: req.body.name,
  description: req.body.description,
  effectiveDate: req.body.effectiveDate,
  policyId: policy._id,
});
```

---

### 9. SPECIAL OCCASIONS

#### Functions Available:
- `notifyBirthdayReminder(data)` - Birthday wishes
- `notifyWorkAnniversary(data)` - Work anniversary celebration

#### Integration Points:

**ScheduledJobs/BirthdayReminder.js** (Create scheduled job)
```javascript
// Run daily at 8 AM
const today = new Date();
const birthdayEmployees = await Employee.find({
  'dateOfBirth.month': today.getMonth() + 1,
  'dateOfBirth.date': today.getDate(),
});

for (const employee of birthdayEmployees) {
  const managerId = employee.managerId;
  const hrAdminIds = (await User.find({ role: 'HR_ADMIN' })).map(u => u._id);
  
  await notificationService.notifyBirthdayReminder({
    celebrantId: employee.userId,
    celebrantName: employee.firstName + ' ' + employee.lastName,
    managerIds: [managerId],
    hrAdminIds,
  });
}
```

**ScheduledJobs/AnniversaryReminder.js** (Create scheduled job)
```javascript
// Run daily to check work anniversaries
const today = new Date();
const anniversaries = await Employee.find({
  'joinDate.month': today.getMonth() + 1,
  'joinDate.date': today.getDate(),
});

for (const emp of anniversaries) {
  const yearsOfService = today.getFullYear() - emp.joinDate.getFullYear();
  const managerId = emp.managerId;
  const hrAdminIds = (await User.find({ role: 'HR_ADMIN' })).map(u => u._id);
  
  await notificationService.notifyWorkAnniversary({
    employeeId: emp.userId,
    employeeName: emp.firstName + ' ' + emp.lastName,
    yearsOfService,
    managerIds: [managerId],
    hrAdminIds,
  });
}
```

---

## Implementation Examples

### Example 1: LeaveController.js (Complete)

```javascript
import LeaveRequest from "../models/LeaveRequest.js";
import Employee from "../models/Employee.js";
import User from "../models/User.js";
import * as notificationService from "../services/notificationService.js";

export const createLeaveRequest = async (req, res) => {
  try {
    const leaveRequest = new LeaveRequest({
      employeeId: req.user._id,
      ...req.body,
    });
    
    await leaveRequest.save();
    
    // Get employee and manager info
    const employee = await Employee.findOne({ userId: req.user._id });
    const hrAdminIds = (await User.find({ role: 'HR_ADMIN' })).map(u => u._id);
    
    // Send notifications
    await notificationService.notifyLeaveRequest({
      employeeId: req.user._id,
      managerId: employee.managerId,
      hrAdminIds,
      leaveId: leaveRequest._id,
      leaveType: req.body.leaveType,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      reason: req.body.reason,
    });
    
    res.status(201).json({
      success: true,
      data: leaveRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const approveLeave = async (req, res) => {
  try {
    const leaveRequest = await LeaveRequest.findByIdAndUpdate(
      req.params.id,
      {
        status: 'APPROVED',
        approvedBy: req.user._id,
        approvalDate: new Date(),
      },
      { new: true }
    );
    
    // Send notification to employee
    await notificationService.notifyLeaveApproval({
      employeeId: leaveRequest.employeeId,
      leaveId: leaveRequest._id,
      leaveType: leaveRequest.leaveType,
      startDate: leaveRequest.startDate,
      endDate: leaveRequest.endDate,
      approvedBy: req.user._id,
    });
    
    res.status(200).json({
      success: true,
      data: leaveRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const rejectLeave = async (req, res) => {
  try {
    const leaveRequest = await LeaveRequest.findByIdAndUpdate(
      req.params.id,
      {
        status: 'REJECTED',
        approvedBy: req.user._id,
        approvalDate: new Date(),
      },
      { new: true }
    );
    
    // Send notification to employee
    await notificationService.notifyLeaveRejection({
      employeeId: leaveRequest.employeeId,
      leaveId: leaveRequest._id,
      leaveType: leaveRequest.leaveType,
      startDate: leaveRequest.startDate,
      endDate: leaveRequest.endDate,
      rejectionReason: req.body.reason,
      rejectedBy: req.user._id,
    });
    
    res.status(200).json({
      success: true,
      data: leaveRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
```

### Example 2: PayrollController.js Integration

```javascript
import * as notificationService from "../services/notificationService.js";

export const processPayroll = async (req, res) => {
  try {
    // Start payroll processing
    const payrollRun = new PayrollRun({
      month: req.body.month,
      year: req.body.year,
      status: 'PROCESSING',
    });
    
    await payrollRun.save();
    
    // Notify all employees that processing started
    const employees = await Employee.find({ status: 'ACTIVE' }).select('userId');
    
    await notificationService.notifyPayrollProcessing({
      employeeIds: employees.map(e => e.userId),
      payrollRunId: payrollRun._id,
      month: req.body.month,
      year: req.body.year,
    });
    
    // ... process payroll ...
    
    // Mark as completed
    payrollRun.status = 'COMPLETED';
    await payrollRun.save();
    
    // Notify all employees that processing completed
    await notificationService.notifyPayrollProcessed({
      employeeIds: employees.map(e => e.userId),
      payrollRunId: payrollRun._id,
      month: req.body.month,
      year: req.body.year,
    });
    
    res.status(200).json({
      success: true,
      data: payrollRun,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
```

---

## Best Practices

### 1. **Always Wrap in Try-Catch**
```javascript
try {
  // Create resource
  const resource = await Model.create(data);
  
  // Send notification (don't block on error)
  try {
    await notificationService.notifyFunction(notifyData);
  } catch (notifError) {
    console.error('Notification failed:', notifError);
    // Don't fail the main operation
  }
  
  res.status(201).json(resource);
} catch (error) {
  res.status(500).json({ error: error.message });
}
```

### 2. **Get Manager/HR Admin IDs Efficiently**
```javascript
// Cache at service startup or use helper
const getHRAdminIds = async () => {
  return (await User.find({ role: 'HR_ADMIN' })).map(u => u._id);
};

const getManagerId = async (employeeId) => {
  const employee = await Employee.findOne({ userId: employeeId });
  return employee?.managerId;
};
```

### 3. **Use Async/Await Pattern**
```javascript
// Good
await notificationService.notifyLeaveRequest(data);

// Avoid (fire and forget - can lose errors)
notificationService.notifyLeaveRequest(data); // Missing await
```

### 4. **Include Relevant Context**
```javascript
// Good - provides actionable information
{
  titleName: "Annual Leave",
  startDate: "2024-03-15",
  endDate: "2024-03-20",
  reason: "Family vacation",
}

// Avoid - generic
{
  reason: "Personal",
}
```

### 5. **Handle Bulk Operations**
```javascript
// For payroll, birthdays, etc. affecting many employees
const employeeIds = [...]; // Array of IDs

for (const employeeId of employeeIds) {
  try {
    await notificationService.notifyPayrollProcessed({
      employeeId,
      // ... other data
    });
  } catch (error) {
    console.error(`Failed for employee ${employeeId}:`, error);
  }
}
```

---

## File Checklist

- ✅ `server/src/models/Notification.js` - Notification model created
- ✅ `server/src/controllers/NotificationController.js` - Core notification CRUD
- ✅ `server/src/routes/notificationRoutes.js` - Notification APIs
- ✅ `server/src/services/notificationService.js` - Helper functions for all notifications
- ✅ `server/index.js` - Routes registered
- ⏳ Update `server/src/controllers/LeaveController.js` - Add notification calls
- ⏳ Update `server/src/controllers/AttendanceController.js` - Add notification calls
- ⏳ Update `server/src/controllers/PayrollController.js` - Add notification calls
- ⏳ Similar updates for PerformanceController, etc.
- ⏳ Create scheduled jobs for reminders (birthdays, anniversaries, meeting reminders)

---

## Next Steps

1. **Start with Leave Module** - Most critical for immediate use
   - Update LeaveController with all three notification calls
   - Test through frontend

2. **Add Attendance Corrections** - High-frequency use
   - Add to AttendanceController
   - Test with manager

3. **Payroll Notifications** - Monthly importance
   - Add to PayrollController
   - Test across all employees

4. **Scheduled Jobs** - Run daily/weekly
   - Birthdays
   - Work anniversaries
   - Meeting reminders  
   - Certification expiry warnings

5. **Additional Modules** - As needed for your org
   - Performance reviews
   - Training assignments
   - Document requests

Happy notifying! 🎉
