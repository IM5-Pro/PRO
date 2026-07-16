/**
 * Notification Service Utilities
 * Helper functions for creating notifications across all controllers
 * Simplifies notification creation by providing ready-to-use functions
 */

import { createNotification } from "../controllers/NotificationController.js";

// ============================================================================
// LEAVE NOTIFICATIONS
// ============================================================================

export const notifyLeaveRequest = async (data) => {
  const {
    employeeId,
    managerId,
    hrAdminIds,
    leaveId,
    leaveType,
    startDate,
    endDate,
    reason,
    employeeName,
  } = data;

  // Notify manager about pending leave request
  if (managerId) {
    await createNotification({
      userId: managerId,
      type: "leave_request",
      title: "New Leave Request",
      message: `Employee has requested ${leaveType} leave from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`,
      priority: "high",
      category: "approval",
      referenceType: "leave",
      referenceId: leaveId,
      actionUrl: `/manager/approvals/leave/${leaveId}`,
      metadata: { leaveType, startDate, endDate, reason },
    });
  } else if (hrAdminIds && hrAdminIds.length > 0) {
    // If employee has no manager, notify HR admins with HIGH priority for direct handling
    for (const hrAdminId of hrAdminIds) {
      await createNotification({
        userId: hrAdminId,
        type: "leave_request",
        title: "Urgent: Leave Request from Employee Without Manager",
        message: `${employeeName || "Employee"} (ID: ${employeeId}) requested ${leaveType} leave from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}. This employee has no assigned manager. Please review and approve/reject directly.`,
        priority: "high",
        category: "approval",
        referenceType: "leave",
        referenceId: leaveId,
        actionUrl: `/hr/leave-requests/${leaveId}`,
        metadata: { leaveType, startDate, endDate, noManager: true },
      });
    }
    return; // Exit here since HR already notified as primary handler
  }

  // Notify HR admins as secondary reviewers
  if (hrAdminIds && hrAdminIds.length > 0) {
    for (const hrAdminId of hrAdminIds) {
      await createNotification({
        userId: hrAdminId,
        type: "leave_request",
        title: "Leave Request for Review",
        message: `New ${leaveType} leave request requires review`,
        priority: "medium",
        category: "update",
        referenceType: "leave",
        referenceId: leaveId,
        actionUrl: `/hr/leave-requests/${leaveId}`,
        metadata: { leaveType, startDate, endDate },
      });
    }
  }
};

export const notifyLeaveApproval = async (data) => {
  const { employeeId, leaveId, leaveType, startDate, endDate, approvedBy } =
    data;

  await createNotification({
    userId: employeeId,
    type: "leave_approval",
    title: "Leave Request Approved",
    message: `Your ${leaveType} leave request for ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()} has been approved`,
    priority: "high",
    category: "approval",
    referenceType: "leave",
    referenceId: leaveId,
    actionUrl: `/employee/leaves/${leaveId}`,
    metadata: { leaveType, startDate, endDate },
    triggeredBy: approvedBy,
  });
};

export const notifyLeaveRejection = async (data) => {
  const {
    employeeId,
    leaveId,
    leaveType,
    startDate,
    endDate,
    rejectionReason,
    rejectedBy,
  } = data;

  await createNotification({
    userId: employeeId,
    type: "leave_rejection",
    title: "Leave Request Rejected",
    message: `Your ${leaveType} leave request has been rejected. Reason: ${rejectionReason || "Not specified"}`,
    priority: "high",
    category: "alert",
    referenceType: "leave",
    referenceId: leaveId,
    actionUrl: `/employee/leaves/${leaveId}`,
    metadata: { leaveType, startDate, endDate, rejectionReason },
    triggeredBy: rejectedBy,
  });
};

// ============================================================================
// ATTENDANCE NOTIFICATIONS
// ============================================================================

export const notifyLateArrival = async (data) => {
  const { employeeId, managerId, date, checkInTime, expectedTime } = data;

  // Notify employee
  await createNotification({
    userId: employeeId,
    type: "attendance_late_arrival",
    title: "Late Arrival Recorded",
    message: `You checked in at ${checkInTime} (expected: ${expectedTime})`,
    priority: "medium",
    category: "alert",
    referenceType: "attendance",
    metadata: { date, checkInTime, expectedTime },
  });

  // Notify manager
  if (managerId) {
    await createNotification({
      userId: managerId,
      type: "attendance_alert",
      title: "Team Member Late Arrival",
      message: `Employee had a late arrival on ${new Date(date).toLocaleDateString()} at ${checkInTime}`,
      priority: "low",
      category: "update",
      referenceType: "attendance",
      metadata: { date, checkInTime },
    });
  }
};

export const notifyAbsentDay = async (data) => {
  const { employeeId, managerId, date, dayCount } = data;

  // Notify manager
  if (managerId) {
    await createNotification({
      userId: managerId,
      type: "attendance_absent",
      title: "Team Member Absent",
      message: `Employee marked absent on ${new Date(date).toLocaleDateString()}. Total absences: ${dayCount}`,
      priority: "high",
      category: "alert",
      referenceType: "attendance",
      metadata: { date, dayCount },
    });
  }

  // Notify employee
  await createNotification({
    userId: employeeId,
    type: "attendance_alert",
    title: "Absence Recorded",
    message: `Your absence on ${new Date(date).toLocaleDateString()} has been recorded in system`,
    priority: "medium",
    category: "update",
    referenceType: "attendance",
    metadata: { date },
  });
};

export const notifyAttendanceCorrection = async (data) => {
  const {
    managerId,
    hrAdminIds,
    attendanceId,
    correctionDate,
    reason,
    requestedBy,
  } = data;

  // Notify manager for approval
  if (managerId) {
    await createNotification({
      userId: managerId,
      type: "attendance_correction",
      title: "Attendance Correction Request",
      message: `Correction requested for attendance on ${new Date(correctionDate).toLocaleDateString()}: ${reason}`,
      priority: "high",
      category: "approval",
      referenceType: "attendance",
      referenceId: attendanceId,
      actionUrl: `/manager/attendance-corrections/${attendanceId}`,
      metadata: { correctionDate, reason },
      triggeredBy: requestedBy,
    });
  }

  // Notify HR admins
  if (hrAdminIds && hrAdminIds.length > 0) {
    for (const hrAdminId of hrAdminIds) {
      await createNotification({
        userId: hrAdminId,
        type: "attendance_correction",
        title: "Attendance Correction for Review",
        message: `Attendance correction submission requires review`,
        priority: "medium",
        category: "update",
        referenceType: "attendance",
        referenceId: attendanceId,
        actionUrl: `/hr/attendance-corrections/${attendanceId}`,
      });
    }
  }
};

export const notifyAttendanceCorrectionApproval = async (data) => {
  const {
    employeeId,
    attendanceId,
    correctionDate,
    approvedBy,
    newCheckIn,
    newCheckOut,
  } = data;

  await createNotification({
    userId: employeeId,
    type: "attendance_correction_approval",
    title: "Attendance Request Approved",
    message: `Your attendance for ${new Date(correctionDate).toLocaleDateString()} has been approved. Check-in: ${newCheckIn}, Check-out: ${newCheckOut}`,
    priority: "medium",
    category: "approval",
    referenceType: "attendance",
    referenceId: attendanceId,
    metadata: { correctionDate, newCheckIn, newCheckOut },
    triggeredBy: approvedBy,
  });
};

export const notifyAttendanceCorrectionRejection = async (data) => {
  const {
    employeeId,
    attendanceId,
    correctionDate,
    rejectionReason,
    rejectedBy,
  } = data;

  await createNotification({
    userId: employeeId,
    type: "attendance_correction_rejection",
    title: "Attendance Request Rejected",
    message: `Your attendance for ${new Date(correctionDate).toLocaleDateString()} was rejected.${rejectionReason ? ` Reason: ${rejectionReason}` : ''}`,
    priority: "high",
    category: "alert",
    referenceType: "attendance",
    referenceId: attendanceId,
    metadata: { correctionDate, rejectionReason },
    triggeredBy: rejectedBy,
  });
};

export const notifyOvertime = async (data) => {
  const { employeeId, managerId, date, overtimeHours } = data;

  // Notify manager
  if (managerId) {
    await createNotification({
      userId: managerId,
      type: "attendance_overtime",
      title: "Overtime Logged",
      message: `Employee logged ${overtimeHours} hours of overtime on ${new Date(date).toLocaleDateString()}`,
      priority: "medium",
      category: "update",
      referenceType: "attendance",
      metadata: { date, overtimeHours },
    });
  }

  // Notify employee
  await createNotification({
    userId: employeeId,
    type: "attendance_overtime",
    title: "Overtime Recorded",
    message: `Your overtime of ${overtimeHours} hours for ${new Date(date).toLocaleDateString()} has been recorded`,
    priority: "low",
    category: "update",
    referenceType: "attendance",
    metadata: { date, overtimeHours },
  });
};

// ============================================================================
// PAYROLL NOTIFICATIONS
// ============================================================================

export const notifyPayrollProcessing = async (data) => {
  const { employeeIds, payrollRunId, month, year } = data;

  for (const employeeId of employeeIds) {
    await createNotification({
      userId: employeeId,
      type: "payroll_ready",
      title: "Payroll Processing Started",
      message: `Payroll for ${month}/${year} is being processed. Your salary slip will be ready soon`,
      priority: "medium",
      category: "update",
      referenceType: "payroll",
      referenceId: payrollRunId,
      metadata: { month, year },
    });
  }
};

export const notifyPayrollProcessed = async (data) => {
  const { employeeIds, payrollRunId, month, year } = data;

  for (const employeeId of employeeIds) {
    await createNotification({
      userId: employeeId,
      type: "payroll_processed",
      title: "Payroll Processed",
      message: `Your payroll for ${month}/${year} has been processed. Salary will be credited soon`,
      priority: "high",
      category: "update",
      referenceType: "payroll",
      referenceId: payrollRunId,
      actionUrl: `/employee/payroll/${payrollRunId}`,
      metadata: { month, year },
    });
  }
};

export const notifySalarySlipGenerated = async (data) => {
  const { employeeId, payrollDetailId, month, year } = data;

  await createNotification({
    userId: employeeId,
    type: "salary_slip_generated",
    title: "Salary Slip Generated",
    message: `Your salary slip for ${month}/${year} is now available for download`,
    priority: "medium",
    category: "update",
    referenceType: "payroll",
    referenceId: payrollDetailId,
    actionUrl: `/employee/payroll/slip/${payrollDetailId}`,
    metadata: { month, year },
  });
};

export const notifyReimbursementRequest = async (data) => {
  const {
    managerId,
    hrAdminIds,
    reimbursementId,
    amount,
    description,
  } = data;

  // Notify manager
  if (managerId) {
    await createNotification({
      userId: managerId,
      type: "reimbursement_request",
      title: "Reimbursement Request for Approval",
      message: `Employee requesting reimbursement of ₹${amount} for: ${description}`,
      priority: "high",
      category: "approval",
      referenceType: "payroll",
      referenceId: reimbursementId,
      actionUrl: `/manager/reimbursements/${reimbursementId}`,
      metadata: { amount, description },
    });
  }

  // Notify HR
  if (hrAdminIds && hrAdminIds.length > 0) {
    for (const hrAdminId of hrAdminIds) {
      await createNotification({
        userId: hrAdminId,
        type: "reimbursement_request",
        title: "Reimbursement for Processing",
        message: `New reimbursement request of ₹${amount} requires processing`,
        priority: "medium",
        category: "update",
        referenceType: "payroll",
        referenceId: reimbursementId,
        actionUrl: `/hr/reimbursements/${reimbursementId}`,
        metadata: { amount },
      });
    }
  }
};

export const notifyReimbursementApproval = async (data) => {
  const { employeeId, reimbursementId, amount, approvedBy } = data;

  await createNotification({
    userId: employeeId,
    type: "reimbursement_approval",
    title: "Reimbursement Approved",
    message: `Your reimbursement request for ₹${amount} has been approved. Amount will be credited soon`,
    priority: "high",
    category: "approval",
    referenceType: "payroll",
    referenceId: reimbursementId,
    metadata: { amount },
    triggeredBy: approvedBy,
  });
};

export const notifyBonusNotification = async (data) => {
  const { employeeId, amount, reason, month } = data;

  await createNotification({
    userId: employeeId,
    type: "bonus_notification",
    title: "Bonus Awarded",
    message: `Congratulations! You have been awarded a bonus of ₹${amount} for ${reason}`,
    priority: "high",
    category: "achievement",
    referenceType: "payroll",
    metadata: { amount, reason, month },
  });
};

// ============================================================================
// PERFORMANCE NOTIFICATIONS
// ============================================================================

export const notifyPerformanceReviewRequest = async (data) => {
  const { employeeId, reviewerId, performanceReviewId, reviewPeriod } = data;

  await createNotification({
    userId: employeeId,
    type: "performance_review_request",
    title: "Performance Review Started",
    message: `Your performance review for ${reviewPeriod} has been initiated. Please provide your self-assessment`,
    priority: "high",
    category: "approval",
    referenceType: "performance",
    referenceId: performanceReviewId,
    actionUrl: `/employee/performance-reviews/${performanceReviewId}`,
    metadata: { reviewPeriod, reviewerId },
  });
};

export const notifyFeedbackRequest = async (data) => {
  const { feedbackProviderId, employeeName, reviewId, dueDate } = data;

  await createNotification({
    userId: feedbackProviderId,
    type: "performance_feedback_request",
    title: "360-Degree Feedback Requested",
    message: `Please provide feedback for ${employeeName}. Due: ${new Date(dueDate).toLocaleDateString()}`,
    priority: "medium",
    category: "approval",
    referenceType: "performance",
    referenceId: reviewId,
    actionUrl: `/feedback/provide/${reviewId}`,
    metadata: { employeeName, dueDate },
  });
};

export const notifyPerformanceReviewComplete = async (data) => {
  const { employeeId, performanceReviewId, rating, reviewerName } = data;

  await createNotification({
    userId: employeeId,
    type: "performance_review_complete",
    title: "Performance Review Completed",
    message: `Your performance review by ${reviewerName} has been completed. Rating: ${rating}`,
    priority: "high",
    category: "update",
    referenceType: "performance",
    referenceId: performanceReviewId,
    actionUrl: `/employee/performance-reviews/${performanceReviewId}`,
    metadata: { rating, reviewerName },
  });
};

export const notifyGoalSetting = async (data) => {
  const { employeeId, goalId, goalName, targetDate } = data;

  await createNotification({
    userId: employeeId,
    type: "goal_setting",
    title: "New Goal Assigned",
    message: `New goal assigned: ${goalName}. Target completion: ${new Date(targetDate).toLocaleDateString()}`,
    priority: "high",
    category: "update",
    referenceType: "performance",
    referenceId: goalId,
    actionUrl: `/employee/goals/${goalId}`,
    metadata: { goalName, targetDate },
  });
};

export const notifyPromotionEligible = async (data) => {
  const { employeeId, employeeName, nextDesignation, hrAdminIds } = data;

  // Notify employee
  await createNotification({
    userId: employeeId,
    type: "promotion_eligible",
    title: "Promotion Eligible",
    message: `Congratulations! You are eligible for promotion to ${nextDesignation}`,
    priority: "high",
    category: "achievement",
    referenceType: "employee",
    metadata: { nextDesignation },
  });

  // Notify HR for processing
  if (hrAdminIds && hrAdminIds.length > 0) {
    for (const hrAdminId of hrAdminIds) {
      await createNotification({
        userId: hrAdminId,
        type: "promotion_eligible",
        title: "Promotion Application",
        message: `${employeeName} is eligible for promotion to ${nextDesignation}`,
        priority: "medium",
        category: "update",
        referenceType: "employee",
        referenceId: employeeId,
        metadata: { nextDesignation },
      });
    }
  }
};

// ============================================================================
// TRAINING & DEVELOPMENT NOTIFICATIONS
// ============================================================================

export const notifyTrainingAssigned = async (data) => {
  const { employeeId, trainingName, startDate, endDate, trainingId } = data;

  await createNotification({
    userId: employeeId,
    type: "training_assigned",
    title: "Training Assignment",
    message: `You have been assigned to training: ${trainingName}. Duration: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`,
    priority: "high",
    category: "update",
    referenceType: "system",
    referenceId: trainingId,
    actionUrl: `/employee/trainings/${trainingId}`,
    metadata: { trainingName, startDate, endDate },
  });
};

export const notifyTrainingCompleted = async (data) => {
  const { employeeId, trainingName, certificateId } = data;

  await createNotification({
    userId: employeeId,
    type: "training_completed",
    title: "Training Completed",
    message: `You have successfully completed the training: ${trainingName}. Certificate is available for download`,
    priority: "high",
    category: "achievement",
    referenceType: "system",
    referenceId: certificateId,
    actionUrl: `/employee/certificates/${certificateId}`,
    metadata: { trainingName },
  });
};

export const notifyCertificationExpiry = async (data) => {
  const { employeeId, certificationName, expiryDate, daysRemaining } = data;

  await createNotification({
    userId: employeeId,
    type: "certification_expiry",
    title: "Certification Expiring Soon",
    message: `Your ${certificationName} certification expires on ${new Date(expiryDate).toLocaleDateString()} (${daysRemaining} days remaining)`,
    priority: "high",
    category: "alert",
    referenceType: "system",
    metadata: { certificationName, expiryDate, daysRemaining },
  });
};

// ============================================================================
// HR OPERATIONS NOTIFICATIONS
// ============================================================================

export const notifyRoleChange = async (data) => {
  const { employeeId, oldRole, newRole, effectiveDate, hrAdminIds } = data;

  // Notify employee
  await createNotification({
    userId: employeeId,
    type: "role_change",
    title: "Role Change Notification",
    message: `Your role has been changed from ${oldRole} to ${newRole} effective ${new Date(effectiveDate).toLocaleDateString()}`,
    priority: "high",
    category: "update",
    referenceType: "employee",
    metadata: { oldRole, newRole, effectiveDate },
  });

  // Notify HR
  if (hrAdminIds && hrAdminIds.length > 0) {
    for (const hrAdminId of hrAdminIds) {
      await createNotification({
        userId: hrAdminId,
        type: "role_change",
        title: "Employee Role Changed",
        message: `Employee role changed from ${oldRole} to ${newRole}`,
        priority: "medium",
        category: "update",
        referenceType: "employee",
        referenceId: employeeId,
        metadata: { oldRole, newRole },
      });
    }
  }
};

export const notifyOnboardingTask = async (data) => {
  const { employeeId, taskName, dueDate, taskId } = data;

  await createNotification({
    userId: employeeId,
    type: "onboarding_task",
    title: "Onboarding Task Assigned",
    message: `New onboarding task: ${taskName}. Due: ${new Date(dueDate).toLocaleDateString()}`,
    priority: "high",
    category: "update",
    referenceType: "employee",
    referenceId: taskId,
    actionUrl: `/employee/onboarding/${taskId}`,
    metadata: { taskName, dueDate },
  });
};

// ============================================================================
// MEETING NOTIFICATIONS
// ============================================================================

export const notifyMeetingInvitation = async (data) => {
  const {
    attendeeIds,
    meetingTitle,
    meetingDate,
    meetingTime,
    organizer,
    meetingId,
  } = data;

  for (const attendeeId of attendeeIds) {
    await createNotification({
      userId: attendeeId,
      type: "meeting_invitation",
      title: "Meeting Invitation",
      message: `${organizer} has invited you to meeting: ${meetingTitle} on ${new Date(meetingDate).toLocaleDateString()} at ${meetingTime}`,
      priority: "high",
      category: "update",
      referenceType: "system",
      referenceId: meetingId,
      actionUrl: `/meetings/${meetingId}`,
      metadata: { meetingTitle, meetingDate, meetingTime, organizer },
    });
  }
};

export const notifyMeetingReminder = async (data) => {
  const { attendeeIds, meetingTitle, meetingTime, meetingId } = data;

  for (const attendeeId of attendeeIds) {
    await createNotification({
      userId: attendeeId,
      type: "meeting_reminder",
      title: "Upcoming Meeting Reminder",
      message: `Reminder: Meeting "${meetingTitle}" starts in 1 hour at ${meetingTime}`,
      priority: "high",
      category: "reminder",
      referenceType: "system",
      referenceId: meetingId,
      actionUrl: `/meetings/${meetingId}`,
      metadata: { meetingTitle, meetingTime },
    });
  }
};

// ============================================================================
// ANNOUNCEMENT NOTIFICATIONS
// ============================================================================

export const notifyAnnouncement = async (data) => {
  const {
    recipientIds,
    title,
    message,
    announcementId,
    priority = "medium",
  } = data;

  for (const recipientId of recipientIds) {
    await createNotification({
      userId: recipientId,
      type: "announcement",
      title,
      message,
      priority,
      category: "update",
      referenceType: "system",
      referenceId: announcementId,
      actionUrl: `/announcements/${announcementId}`,
    });
  }
};

export const notifyPolicyUpdate = async (data) => {
  const {
    recipientIds,
    policyName,
    description,
    effectiveDate,
    policyId,
  } = data;

  for (const recipientId of recipientIds) {
    await createNotification({
      userId: recipientId,
      type: "policy_update",
      title: `Policy Update: ${policyName}`,
      message: `New policy "${policyName}" effective ${new Date(effectiveDate).toLocaleDateString()}. ${description}`,
      priority: "high",
      category: "update",
      referenceType: "system",
      referenceId: policyId,
      actionUrl: `/policies/${policyId}`,
      metadata: { policyName, effectiveDate },
    });
  }
};

// ============================================================================
// BIRTHDAY & ANNIVERSARY NOTIFICATIONS
// ============================================================================

export const notifyBirthdayReminder = async (data) => {
  const { celebrantId, celebrantName, managerIds, hrAdminIds } = data;

  // Notify celebrant
  await createNotification({
    userId: celebrantId,
    type: "birthday_reminder",
    title: "Happy Birthday!",
    message: `Wishing you a wonderful birthday! 🎉`,
    priority: "medium",
    category: "update",
  });

  // Notify manager
  if (managerIds && managerIds.length > 0) {
    for (const managerId of managerIds) {
      await createNotification({
        userId: managerId,
        type: "birthday_reminder",
        title: "Team Member Birthday",
        message: `Today is ${celebrantName}'s birthday! 🎂`,
        priority: "low",
        category: "reminder",
        metadata: { celebrantName },
      });
    }
  }

  // Notify HR for sending gifts/cards
  if (hrAdminIds && hrAdminIds.length > 0) {
    for (const hrAdminId of hrAdminIds) {
      await createNotification({
        userId: hrAdminId,
        type: "birthday_reminder",
        title: "Employee Birthday",
        message: `${celebrantName}'s birthday today. Send birthday wishes! 🎂`,
        priority: "low",
        category: "reminder",
        metadata: { celebrantName },
      });
    }
  }
};

export const notifyWorkAnniversary = async (data) => {
  const { employeeId, employeeName, yearsOfService, managerIds, hrAdminIds } =
    data;

  // Notify employee
  await createNotification({
    userId: employeeId,
    type: "work_anniversary",
    title: "Work Anniversary",
    message: `Congratulations! You have completed ${yearsOfService} years with our organization! 🎊`,
    priority: "medium",
    category: "achievement",
    metadata: { yearsOfService },
  });

  // Notify manager
  if (managerIds && managerIds.length > 0) {
    for (const managerId of managerIds) {
      await createNotification({
        userId: managerId,
        type: "work_anniversary",
        title: "Team Member's Work Anniversary",
        message: `${employeeName} has completed ${yearsOfService} years with us today!`,
        priority: "low",
        category: "reminder",
        metadata: { employeeName, yearsOfService },
      });
    }
  }

  // Notify HR
  if (hrAdminIds && hrAdminIds.length > 0) {
    for (const hrAdminId of hrAdminIds) {
      await createNotification({
        userId: hrAdminId,
        type: "work_anniversary",
        title: "Employee Work Anniversary",
        message: `${employeeName}'s ${yearsOfService} year work anniversary today`,
        priority: "low",
        category: "reminder",
        metadata: { employeeName, yearsOfService },
      });
    }
  }
};

// ============================================================================
// SYSTEM ALERTS
// ============================================================================

export const notifySystemAlert = async (data) => {
  const { recipientIds, title, message, alertId } = data;

  for (const recipientId of recipientIds) {
    await createNotification({
      userId: recipientId,
      type: "system_alert",
      title,
      message,
      priority: "urgent",
      category: "alert",
      referenceType: "system",
      referenceId: alertId,
    });
  }
};

export const notifySystemMaintenance = async (data) => {
  const {
    recipientIds,
    maintenanceStart,
    maintenanceEnd,
    affectedServices,
  } = data;

  for (const recipientId of recipientIds) {
    await createNotification({
      userId: recipientId,
      type: "system_maintenance",
      title: "Scheduled System Maintenance",
      message: `System maintenance scheduled from ${new Date(maintenanceStart).toLocaleString()} to ${new Date(maintenanceEnd).toLocaleString()}. Affected services: ${affectedServices.join(", ")}`,
      priority: "high",
      category: "alert",
      metadata: { maintenanceStart, maintenanceEnd, affectedServices },
    });
  }
};
