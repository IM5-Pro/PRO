/**
 * Attendance Validation Functions
 */

export const validateAttendanceCheckIn = (body) => {
  const errors = {};
  let isValid = true;

  // Employee ID is required
  if (!body.employee || typeof body.employee !== "string") {
    errors.employee = "Valid employee ID is required";
    isValid = false;
  }

  // Check-in location is optional
  if (body.checkInLocation && typeof body.checkInLocation !== "string") {
    errors.checkInLocation = "Check-in location must be a string";
    isValid = false;
  }

  return { isValid, errors };
};

export const validateAttendanceCheckOut = (body) => {
  const errors = {};
  let isValid = true;

  // Employee ID is required
  if (!body.employee || typeof body.employee !== "string") {
    errors.employee = "Valid employee ID is required";
    isValid = false;
  }

  // Check-out location is optional
  if (body.checkOutLocation && typeof body.checkOutLocation !== "string") {
    errors.checkOutLocation = "Check-out location must be a string";
    isValid = false;
  }

  return { isValid, errors };
};

export const validateAttendanceUpdate = (body) => {
  const errors = {};
  let isValid = true;

  // Employee ID (if provided)
  if (body.employee && typeof body.employee !== "string") {
    errors.employee = "Employee ID must be a string";
    isValid = false;
  }

  // Status validation
  const validStatuses = ["Present", "Absent", "Late", "LateCheckout", "EarlyCheckout", "HalfDay", "Leave", "OnLeave", "WFH"];
  if (body.status && !validStatuses.includes(body.status)) {
    errors.status = `Status must be one of: ${validStatuses.join(", ")}`;
    isValid = false;
  }

  // Working hours
  if (body.workingHours !== undefined) {
    if (typeof body.workingHours !== "number" || body.workingHours < 0 || body.workingHours > 24) {
      errors.workingHours = "Working hours must be between 0 and 24";
      isValid = false;
    }
  }

  // Check-in time
  if (body.checkInTime) {
    const date = new Date(body.checkInTime);
    if (isNaN(date.getTime())) {
      errors.checkInTime = "Invalid check-in time format";
      isValid = false;
    }
  }

  // Check-out time
  if (body.checkOutTime) {
    const date = new Date(body.checkOutTime);
    if (isNaN(date.getTime())) {
      errors.checkOutTime = "Invalid check-out time format";
      isValid = false;
    }
  }

  // Remarks
  if (body.remarks && typeof body.remarks !== "string") {
    errors.remarks = "Remarks must be a string";
    isValid = false;
  }

  // Shift times
  if (body.assignedShiftStart) {
    if (!/^\d{2}:\d{2}$/.test(body.assignedShiftStart)) {
      errors.assignedShiftStart = "Shift start must be in HH:MM format";
      isValid = false;
    }
  }

  if (body.assignedShiftEnd) {
    if (!/^\d{2}:\d{2}$/.test(body.assignedShiftEnd)) {
      errors.assignedShiftEnd = "Shift end must be in HH:MM format";
      isValid = false;
    }
  }

  return { isValid, errors };
};

export const validateAttendanceApproval = (body) => {
  const errors = {};
  let isValid = true;

  // Approval status is required
  if (!body.approvalStatus || !["Approved", "Rejected"].includes(body.approvalStatus)) {
    errors.approvalStatus = "Approval status must be either 'Approved' or 'Rejected'";
    isValid = false;
  }

  // Approval remarks
  if (body.approvalRemarks && typeof body.approvalRemarks !== "string") {
    errors.approvalRemarks = "Approval remarks must be a string";
    isValid = false;
  }

  return { isValid, errors };
};

export const validateShiftAssignment = (body) => {
  const errors = {};
  let isValid = true;

  // Employee ID is required
  if (!body.employee || typeof body.employee !== "string") {
    errors.employee = "Valid employee ID is required";
    isValid = false;
  }

  // Shift start time is required
  if (!body.assignedShiftStart || !/^\d{2}:\d{2}$/.test(body.assignedShiftStart)) {
    errors.assignedShiftStart = "Shift start time must be in HH:MM format";
    isValid = false;
  }

  // Shift end time is required
  if (!body.assignedShiftEnd || !/^\d{2}:\d{2}$/.test(body.assignedShiftEnd)) {
    errors.assignedShiftEnd = "Shift end time must be in HH:MM format";
    isValid = false;
  }

  // Validate shift times
  if (body.assignedShiftStart && body.assignedShiftEnd) {
    const start = body.assignedShiftStart.split(":").map(Number);
    const end = body.assignedShiftEnd.split(":").map(Number);
    const startMinutes = start[0] * 60 + start[1];
    const endMinutes = end[0] * 60 + end[1];

    if (startMinutes >= endMinutes) {
      errors.shift = "Shift start time must be before shift end time";
      isValid = false;
    }
  }

  // Effective date (optional)
  if (body.effectiveDate) {
    const date = new Date(body.effectiveDate);
    if (isNaN(date.getTime())) {
      errors.effectiveDate = "Invalid effective date format";
      isValid = false;
    }
  }

  return { isValid, errors };
};

export const validateBulkAttendanceUpload = (body) => {
  const errors = {};
  let isValid = true;

  // Attendance records array is required
  if (!Array.isArray(body.records)) {
    errors.records = "Records must be an array";
    isValid = false;
    return { isValid, errors };
  }

  if (body.records.length === 0) {
    errors.records = "At least one attendance record is required";
    isValid = false;
    return { isValid, errors };
  }

  // Validate each record
  const recordErrors = [];
  body.records.forEach((record, index) => {
    const recordError = {};

    if (!record.employee || typeof record.employee !== "string") {
      recordError.employee = "Valid employee ID is required";
    }

    if (record.attendanceDate) {
      const date = new Date(record.attendanceDate);
      if (isNaN(date.getTime())) {
        recordError.attendanceDate = "Invalid attendance date format";
      }
    }

    const validStatuses = ["Present", "Absent", "Late", "LateCheckout", "EarlyCheckout", "HalfDay", "Leave", "OnLeave", "WFH"];
    if (record.status && !validStatuses.includes(record.status)) {
      recordError.status = `Status must be one of: ${validStatuses.join(", ")}`;
    }

    if (Object.keys(recordError).length > 0) {
      recordErrors.push({ index, errors: recordError });
      isValid = false;
    }
  });

  if (recordErrors.length > 0) {
    errors.records = recordErrors;
  }

  return { isValid, errors };
};

export const validateAttendanceDateRange = (body) => {
  const errors = {};
  let isValid = true;

  // Start date is required
  if (!body.startDate) {
    errors.startDate = "Start date is required";
    isValid = false;
  } else {
    const date = new Date(body.startDate);
    if (isNaN(date.getTime())) {
      errors.startDate = "Invalid start date format";
      isValid = false;
    }
  }

  // End date is required
  if (!body.endDate) {
    errors.endDate = "End date is required";
    isValid = false;
  } else {
    const date = new Date(body.endDate);
    if (isNaN(date.getTime())) {
      errors.endDate = "Invalid end date format";
      isValid = false;
    }
  }

  // Validate date range
  if (body.startDate && body.endDate) {
    const start = new Date(body.startDate);
    const end = new Date(body.endDate);
    if (start > end) {
      errors.dateRange = "Start date must be before end date";
      isValid = false;
    }
  }

  return { isValid, errors };
};
