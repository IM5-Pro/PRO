import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";
import User from "../models/User.js";
import AuditLog from "../models/AuditLog.js";
import {
  validateAttendanceCheckIn,
  validateAttendanceCheckOut,
  validateAttendanceUpdate,
  validateAttendanceApproval,
  validateShiftAssignment,
  validateBulkAttendanceUpload,
  validateAttendanceDateRange,
} from "../utils/attendanceValidators.js";
import { sendError, sendSuccess } from "../utils/response.js";

/**
 * Check-in: Employee marks attendance (automatic)
 */
export const checkIn = async (req, res) => {
  try {
    // Validate input
    const validation = validateAttendanceCheckIn(req.body);
    if (!validation.isValid) {
      return sendError(res, 400, "Validation failed", validation.errors);
    }

    const { employee, checkInLocation = "Office" } = req.body;

    // Verify employee exists
    const employeeRecord = await Employee.findById(employee);
    if (!employeeRecord) {
      return sendError(res, 404, "Employee not found", {
        employee: "The requested employee does not exist",
      });
    }

    // Get today's date (without time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if attendance record exists for today
    let attendance = await Attendance.findOne({
      employee,
      attendanceDate: today,
    });

    if (!attendance) {
      // Create new attendance record
      attendance = new Attendance({
        employee,
        attendanceDate: today,
        checkInTime: new Date(),
        checkInLocation,
        status: "Present",
        createdBy: req.user.id,
      });
    } else {
      // Update existing record
      if (attendance.checkInTime) {
        return sendError(res, 409, "Already checked in today", {
          checkIn: "You have already checked in today",
        });
      }
      attendance.checkInTime = new Date();
      attendance.checkInLocation = checkInLocation;
      attendance.status = "Present";
      attendance.updatedBy = req.user.id;
    }

    await attendance.save();

    // Log action
    await AuditLog.create({
      userId: req.user.id,
      action: "CHECK_IN",
      entityType: "Attendance",
      entityId: attendance._id,
      description: `Employee checked in at ${checkInLocation}`,
    });

    return sendSuccess(res, 201, "Check-in recorded successfully", attendance);
  } catch (error) {
    console.error("Check-in error:", error);
    return sendError(res, 500, "Failed to record check-in", {
      error: error.message,
    });
  }
};

/**
 * Check-out: Employee marks departure (automatic)
 */
export const checkOut = async (req, res) => {
  try {
    // Validate input
    const validation = validateAttendanceCheckOut(req.body);
    if (!validation.isValid) {
      return sendError(res, 400, "Validation failed", validation.errors);
    }

    const { employee, checkOutLocation = "Office" } = req.body;

    // Verify employee exists
    const employeeRecord = await Employee.findById(employee);
    if (!employeeRecord) {
      return sendError(res, 404, "Employee not found", {
        employee: "The requested employee does not exist",
      });
    }

    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if attendance record exists for today
    const attendance = await Attendance.findOne({
      employee,
      attendanceDate: today,
    });

    if (!attendance) {
      return sendError(res, 404, "No check-in found for today", {
        attendance: "Please check in first before checking out",
      });
    }

    if (!attendance.checkInTime) {
      return sendError(res, 400, "No check-in found for today", {
        checkIn: "You must check in before checking out",
      });
    }

    if (attendance.checkOutTime) {
      return sendError(res, 409, "Already checked out today", {
        checkOut: "You have already checked out today",
      });
    }

    // Calculate working hours
    const checkOutTime = new Date();
    const workingHours =
      (checkOutTime - attendance.checkInTime) / (1000 * 60 * 60);

    attendance.checkOutTime = checkOutTime;
    attendance.checkOutLocation = checkOutLocation;
    attendance.workingHours = Math.round(workingHours * 100) / 100;
    attendance.updatedBy = req.user.id;
    attendance.approvalStatus = "Approved"; // Auto-approve for check-out

    await attendance.save();

    // Log action
    await AuditLog.create({
      userId: req.user.id,
      action: "CHECK_OUT",
      entityType: "Attendance",
      entityId: attendance._id,
      description: `Employee checked out at ${checkOutLocation}. Working hours: ${attendance.workingHours}`,
    });

    return sendSuccess(res, 200, "Check-out recorded successfully", attendance);
  } catch (error) {
    console.error("Check-out error:", error);
    return sendError(res, 500, "Failed to record check-out", {
      error: error.message,
    });
  }
};

/**
 * View Own Attendance: Employee views their own attendance
 */
export const viewOwn = async (req, res) => {
  try {
    const { page = 1, limit = 10, startDate, endDate } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query
    let query = { employee: req.user.id, isArchived: false };

    if (startDate && endDate) {
      const validation = validateAttendanceDateRange({
        startDate,
        endDate,
      });
      if (!validation.isValid) {
        return sendError(res, 400, "Invalid date range", validation.errors);
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      query.attendanceDate = { $gte: start, $lte: end };
    }

    // Get total count
    const total = await Attendance.countDocuments(query);

    // Get paginated results
    const attendance = await Attendance.find(query)
      .populate("employee", "firstName lastName email")
      .populate("approvedBy", "firstName lastName email")
      .sort({ attendanceDate: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    return sendSuccess(res, 200, "Own attendance retrieved successfully", {
      attendance,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("View own attendance error:", error);
    return sendError(res, 500, "Failed to retrieve attendance", {
      error: error.message,
    });
  }
};

/**
 * View Team Attendance: Manager/HR views their team's attendance
 */
export const viewTeam = async (req, res) => {
  try {
    const { page = 1, limit = 10, employeeId, startDate, endDate } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get user's role and determine access
    const user = await User.findById(req.user.id).populate("role");
    const userRole = user?.role?.name;

    let query = { isArchived: false };

    // Manager can only see team members
    if (userRole === "MANAGER") {
      const managedEmployees = await Employee.find({ manager: req.user.id });
      const managedIds = managedEmployees.map((e) => e._id);
      query.employee = { $in: managedIds };
    }

    // HR_ADMIN and SUPER_ADMIN can see all or filtered by employee
    if (employeeId) {
      query.employee = employeeId;
    }

    if (startDate && endDate) {
      const validation = validateAttendanceDateRange({
        startDate,
        endDate,
      });
      if (!validation.isValid) {
        return sendError(res, 400, "Invalid date range", validation.errors);
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      query.attendanceDate = { $gte: start, $lte: end };
    }

    // Get total count
    const total = await Attendance.countDocuments(query);

    // Get paginated results
    const attendance = await Attendance.find(query)
      .populate("employee", "firstName lastName email department designation")
      .populate("approvedBy", "firstName lastName email")
      .sort({ attendanceDate: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    return sendSuccess(res, 200, "Team attendance retrieved successfully", {
      attendance,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("View team attendance error:", error);
    return sendError(res, 500, "Failed to retrieve team attendance", {
      error: error.message,
    });
  }
};

/**
 * View All Attendance: Super Admin and HR Admin view all attendance
 */
export const viewAll = async (req, res) => {
  try {
    const { page = 1, limit = 10, employeeId, status, startDate, endDate } =
      req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = { isArchived: false };

    if (employeeId) {
      query.employee = employeeId;
    }

    if (status) {
      query.status = status;
    }

    if (startDate && endDate) {
      const validation = validateAttendanceDateRange({
        startDate,
        endDate,
      });
      if (!validation.isValid) {
        return sendError(res, 400, "Invalid date range", validation.errors);
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      query.attendanceDate = { $gte: start, $lte: end };
    }

    // Get total count
    const total = await Attendance.countDocuments(query);

    // Get paginated results
    const attendance = await Attendance.find(query)
      .populate("employee", "firstName lastName email department designation")
      .populate("approvedBy", "firstName lastName email")
      .sort({ attendanceDate: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    return sendSuccess(res, 200, "All attendance retrieved successfully", {
      attendance,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("View all attendance error:", error);
    return sendError(res, 500, "Failed to retrieve all attendance", {
      error: error.message,
    });
  }
};

/**
 * Edit Attendance: HR Admin can correct mistakes
 */
export const editAttendance = async (req, res) => {
  try {
    const { attendanceId } = req.params;

    // Validate input
    const validation = validateAttendanceUpdate(req.body);
    if (!validation.isValid) {
      return sendError(res, 400, "Validation failed", validation.errors);
    }

    // Check if attendance exists
    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
      return sendError(res, 404, "Attendance record not found", {
        attendanceId: "The requested attendance record does not exist",
      });
    }

    // Track changes
    const changes = {};

    // Update status
    if (req.body.status && req.body.status !== attendance.status) {
      changes.status = { from: attendance.status, to: req.body.status };
      attendance.status = req.body.status;
    }

    // Update check-in time
    if (req.body.checkInTime && req.body.checkInTime !== attendance.checkInTime) {
      changes.checkInTime = {
        from: attendance.checkInTime,
        to: req.body.checkInTime,
      };
      attendance.checkInTime = new Date(req.body.checkInTime);
    }

    // Update check-out time
    if (req.body.checkOutTime && req.body.checkOutTime !== attendance.checkOutTime) {
      changes.checkOutTime = {
        from: attendance.checkOutTime,
        to: req.body.checkOutTime,
      };
      attendance.checkOutTime = new Date(req.body.checkOutTime);
    }

    // Update working hours
    if (req.body.workingHours !== undefined && req.body.workingHours !== attendance.workingHours) {
      changes.workingHours = {
        from: attendance.workingHours,
        to: req.body.workingHours,
      };
      attendance.workingHours = req.body.workingHours;
    }

    // Update remarks
    if (req.body.remarks && req.body.remarks !== attendance.remarks) {
      changes.remarks = { from: attendance.remarks, to: req.body.remarks };
      attendance.remarks = req.body.remarks;
    }

    // Update shift times
    if (req.body.assignedShiftStart && req.body.assignedShiftStart !== attendance.assignedShiftStart) {
      changes.assignedShiftStart = {
        from: attendance.assignedShiftStart,
        to: req.body.assignedShiftStart,
      };
      attendance.assignedShiftStart = req.body.assignedShiftStart;
    }

    if (req.body.assignedShiftEnd && req.body.assignedShiftEnd !== attendance.assignedShiftEnd) {
      changes.assignedShiftEnd = {
        from: attendance.assignedShiftEnd,
        to: req.body.assignedShiftEnd,
      };
      attendance.assignedShiftEnd = req.body.assignedShiftEnd;
    }

    attendance.updatedBy = req.user.id;
    await attendance.save();

    // Log action
    await AuditLog.create({
      userId: req.user.id,
      action: "UPDATE",
      entityType: "Attendance",
      entityId: attendance._id,
      description: "Updated attendance record",
      changes,
    });

    return sendSuccess(res, 200, "Attendance updated successfully", attendance);
  } catch (error) {
    console.error("Edit attendance error:", error);
    return sendError(res, 500, "Failed to update attendance", {
      error: error.message,
    });
  }
};

/**
 * Delete Attendance: Super Admin only (soft delete)
 */
export const deleteAttendance = async (req, res) => {
  try {
    const { attendanceId } = req.params;

    // Check if attendance exists
    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
      return sendError(res, 404, "Attendance record not found", {
        attendanceId: "The requested attendance record does not exist",
      });
    }

    // Soft delete
    attendance.isArchived = true;
    attendance.updatedBy = req.user.id;
    await attendance.save();

    // Log action
    await AuditLog.create({
      userId: req.user.id,
      action: "DELETE",
      entityType: "Attendance",
      entityId: attendance._id,
      description: "Archived attendance record",
    });

    return sendSuccess(res, 200, "Attendance deleted successfully", attendance);
  } catch (error) {
    console.error("Delete attendance error:", error);
    return sendError(res, 500, "Failed to delete attendance", {
      error: error.message,
    });
  }
};

/**
 * Bulk Upload Attendance: HR Admin and Super Admin
 */
export const bulkUpload = async (req, res) => {
  try {
    // Validate input
    const validation = validateBulkAttendanceUpload(req.body);
    if (!validation.isValid) {
      return sendError(res, 400, "Validation failed", validation.errors);
    }

    const { records } = req.body;
    const uploadedRecords = [];
    const failedRecords = [];

    for (let i = 0; i < records.length; i++) {
      try {
        const record = records[i];

        // Verify employee exists
        const employee = await Employee.findById(record.employee);
        if (!employee) {
          failedRecords.push({
            index: i,
            error: "Employee not found",
          });
          continue;
        }

        const attendanceDate = new Date(record.attendanceDate);
        attendanceDate.setHours(0, 0, 0, 0);

        // Check if record exists
        let attendance = await Attendance.findOne({
          employee: record.employee,
          attendanceDate,
        });

        if (attendance) {
          // Update existing
          attendance.status = record.status || attendance.status;
          attendance.workingHours = record.workingHours || attendance.workingHours;
          attendance.remarks = record.remarks || attendance.remarks;
          attendance.updatedBy = req.user.id;
        } else {
          // Create new
          attendance = new Attendance({
            employee: record.employee,
            attendanceDate,
            status: record.status || "Present",
            workingHours: record.workingHours || 0,
            remarks: record.remarks || "",
            createdBy: req.user.id,
          });
        }

        await attendance.save();
        uploadedRecords.push(attendance);
      } catch (error) {
        failedRecords.push({
          index: i,
          error: error.message,
        });
      }
    }

    // Log action
    await AuditLog.create({
      userId: req.user.id,
      action: "BULK_UPLOAD",
      entityType: "Attendance",
      description: `Bulk uploaded ${uploadedRecords.length} attendance records`,
    });

    return sendSuccess(res, 200, "Bulk upload completed", {
      uploaded: uploadedRecords.length,
      failed: failedRecords.length,
      uploadedRecords,
      failedRecords,
    });
  } catch (error) {
    console.error("Bulk upload error:", error);
    return sendError(res, 500, "Failed to bulk upload attendance", {
      error: error.message,
    });
  }
};

/**
 * Export Attendance: HR Admin and Super Admin
 */
export const exportAttendance = async (req, res) => {
  try {
    const { startDate, endDate, format = "json" } = req.query;

    let query = { isArchived: false };

    if (startDate && endDate) {
      const validation = validateAttendanceDateRange({
        startDate,
        endDate,
      });
      if (!validation.isValid) {
        return sendError(res, 400, "Invalid date range", validation.errors);
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      query.attendanceDate = { $gte: start, $lte: end };
    }

    const records = await Attendance.find(query)
      .populate("employee", "firstName lastName email department designation")
      .lean();

    // Log action
    await AuditLog.create({
      userId: req.user.id,
      action: "EXPORT",
      entityType: "Attendance",
      description: `Exported ${records.length} attendance records`,
    });

    if (format === "csv") {
      // Convert to CSV
      const csv = convertToCSV(records);
      res.header("Content-Type", "text/csv");
      res.header("Content-Disposition", "attachment; filename=attendance.csv");
      return res.send(csv);
    }

    // Default to JSON
    return sendSuccess(res, 200, "Attendance exported successfully", {
      records,
      total: records.length,
    });
  } catch (error) {
    console.error("Export attendance error:", error);
    return sendError(res, 500, "Failed to export attendance", {
      error: error.message,
    });
  }
};

/**
 * Approve Attendance: Manager and HR Admin
 */
export const approveAttendance = async (req, res) => {
  try {
    const { attendanceId } = req.params;

    // Validate input
    const validation = validateAttendanceApproval(req.body);
    if (!validation.isValid) {
      return sendError(res, 400, "Validation failed", validation.errors);
    }

    // Check if attendance exists
    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
      return sendError(res, 404, "Attendance record not found", {
        attendanceId: "The requested attendance record does not exist",
      });
    }

    const { approvalStatus, approvalRemarks = "" } = req.body;

    attendance.approvalStatus = approvalStatus;
    attendance.approvalRemarks = approvalRemarks;
    attendance.approvedBy = req.user.id;
    attendance.approvalDate = new Date();
    attendance.updatedBy = req.user.id;

    await attendance.save();

    // Log action
    await AuditLog.create({
      userId: req.user.id,
      action: approvalStatus,
      entityType: "Attendance",
      entityId: attendance._id,
      description: `${approvalStatus} attendance record. Remarks: ${approvalRemarks}`,
    });

    return sendSuccess(
      res,
      200,
      `Attendance ${approvalStatus.toLowerCase()} successfully`,
      attendance
    );
  } catch (error) {
    console.error("Approve attendance error:", error);
    return sendError(res, 500, "Failed to approve attendance", {
      error: error.message,
    });
  }
};

/**
 * Reject Attendance: Manager and HR Admin
 */
export const rejectAttendance = async (req, res) => {
  try {
    const { attendanceId } = req.params;

    // Validate input
    const validation = validateAttendanceApproval(req.body);
    if (!validation.isValid) {
      return sendError(res, 400, "Validation failed", validation.errors);
    }

    // Check if attendance exists
    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
      return sendError(res, 404, "Attendance record not found", {
        attendanceId: "The requested attendance record does not exist",
      });
    }

    const { approvalRemarks = "" } = req.body;

    attendance.approvalStatus = "Rejected";
    attendance.approvalRemarks = approvalRemarks;
    attendance.approvedBy = req.user.id;
    attendance.approvalDate = new Date();
    attendance.updatedBy = req.user.id;

    await attendance.save();

    // Log action
    await AuditLog.create({
      userId: req.user.id,
      action: "REJECT",
      entityType: "Attendance",
      entityId: attendance._id,
      description: `Rejected attendance record. Remarks: ${approvalRemarks}`,
    });

    return sendSuccess(res, 200, "Attendance rejected successfully", attendance);
  } catch (error) {
    console.error("Reject attendance error:", error);
    return sendError(res, 500, "Failed to reject attendance", {
      error: error.message,
    });
  }
};

/**
 * Assign Shift: HR Admin and Super Admin
 */
export const assignShift = async (req, res) => {
  try {
    const { attendanceId } = req.params;

    // Validate input
    const validation = validateShiftAssignment(req.body);
    if (!validation.isValid) {
      return sendError(res, 400, "Validation failed", validation.errors);
    }

    const { assignedShiftStart, assignedShiftEnd, effectiveDate } = req.body;

    // Check if attendance exists
    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
      return sendError(res, 404, "Attendance record not found", {
        attendanceId: "The requested attendance record does not exist",
      });
    }

    const changes = {
      assignedShiftStart: {
        from: attendance.assignedShiftStart,
        to: assignedShiftStart,
      },
      assignedShiftEnd: {
        from: attendance.assignedShiftEnd,
        to: assignedShiftEnd,
      },
    };

    attendance.assignedShiftStart = assignedShiftStart;
    attendance.assignedShiftEnd = assignedShiftEnd;
    attendance.updatedBy = req.user.id;

    await attendance.save();

    // Log action
    await AuditLog.create({
      userId: req.user.id,
      action: "ASSIGN_SHIFT",
      entityType: "Attendance",
      entityId: attendance._id,
      description: `Assigned shift ${assignedShiftStart} - ${assignedShiftEnd}`,
      changes,
    });

    return sendSuccess(res, 200, "Shift assigned successfully", attendance);
  } catch (error) {
    console.error("Assign shift error:", error);
    return sendError(res, 500, "Failed to assign shift", {
      error: error.message,
    });
  }
};

/**
 * Update Shift: HR Admin and Super Admin
 */
export const updateShift = async (req, res) => {
  try {
    const { attendanceId } = req.params;

    // Validate input
    const validation = validateShiftAssignment(req.body);
    if (!validation.isValid) {
      return sendError(res, 400, "Validation failed", validation.errors);
    }

    // Check if attendance exists
    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
      return sendError(res, 404, "Attendance record not found", {
        attendanceId: "The requested attendance record does not exist",
      });
    }

    const changes = {};

    if (req.body.assignedShiftStart && req.body.assignedShiftStart !== attendance.assignedShiftStart) {
      changes.assignedShiftStart = {
        from: attendance.assignedShiftStart,
        to: req.body.assignedShiftStart,
      };
      attendance.assignedShiftStart = req.body.assignedShiftStart;
    }

    if (req.body.assignedShiftEnd && req.body.assignedShiftEnd !== attendance.assignedShiftEnd) {
      changes.assignedShiftEnd = {
        from: attendance.assignedShiftEnd,
        to: req.body.assignedShiftEnd,
      };
      attendance.assignedShiftEnd = req.body.assignedShiftEnd;
    }

    attendance.updatedBy = req.user.id;
    await attendance.save();

    // Log action
    await AuditLog.create({
      userId: req.user.id,
      action: "UPDATE_SHIFT",
      entityType: "Attendance",
      entityId: attendance._id,
      description: `Updated shift to ${req.body.assignedShiftStart} - ${req.body.assignedShiftEnd}`,
      changes,
    });

    return sendSuccess(res, 200, "Shift updated successfully", attendance);
  } catch (error) {
    console.error("Update shift error:", error);
    return sendError(res, 500, "Failed to update shift", {
      error: error.message,
    });
  }
};

/**
 * Delete Shift: HR Admin and Super Admin
 */
export const deleteShift = async (req, res) => {
  try {
    const { attendanceId } = req.params;

    // Check if attendance exists
    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
      return sendError(res, 404, "Attendance record not found", {
        attendanceId: "The requested attendance record does not exist",
      });
    }

    const changes = {
      shift: { from: attendance.shift, to: null },
      assignedShiftStart: {
        from: attendance.assignedShiftStart,
        to: "09:00",
      },
      assignedShiftEnd: {
        from: attendance.assignedShiftEnd,
        to: "18:00",
      },
    };

    // Reset to default shift
    attendance.shift = null;
    attendance.assignedShiftStart = "09:00";
    attendance.assignedShiftEnd = "18:00";
    attendance.updatedBy = req.user.id;

    await attendance.save();

    // Log action
    await AuditLog.create({
      userId: req.user.id,
      action: "DELETE_SHIFT",
      entityType: "Attendance",
      entityId: attendance._id,
      description: "Deleted custom shift assignment",
      changes,
    });

    return sendSuccess(res, 200, "Shift deleted successfully", attendance);
  } catch (error) {
    console.error("Delete shift error:", error);
    return sendError(res, 500, "Failed to delete shift", {
      error: error.message,
    });
  }
};

/**
 * Helper function to convert records to CSV
 */
function convertToCSV(records) {
  if (!records || records.length === 0) {
    return "No records";
  }

  const headers = [
    "Employee Name",
    "Email",
    "Department",
    "Designation",
    "Date",
    "Check-in",
    "Check-out",
    "Status",
    "Working Hours",
    "Approval Status",
  ];

  const rows = records.map((r) => [
    `${r.employee?.firstName} ${r.employee?.lastName}`,
    r.employee?.email,
    r.employee?.department,
    r.employee?.designation,
    r.attendanceDate?.toLocaleDateString(),
    r.checkInTime?.toLocaleTimeString(),
    r.checkOutTime?.toLocaleTimeString(),
    r.status,
    r.workingHours,
    r.approvalStatus,
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell || ""}"`).join(",")),
  ].join("\n");

  return csvContent;
}
