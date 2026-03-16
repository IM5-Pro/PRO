import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";
import User from "../models/User.js";
import AuditLog from "../models/AuditLog.js";
import Shift from "../models/Shift.js";
import EmployeeShift from "../models/EmployeeShift.js";
import Roles from "../constants/roles.js";
import {
  validateAttendanceCheckIn,
  validateAttendanceCheckOut,
  validateAttendanceUpdate,
  validateAttendanceApproval,
  validateBulkAttendanceUpload,
  validateAttendanceDateRange,
} from "../utils/attendanceValidators.js";
import { sendError, sendSuccess } from "../utils/response.js";

const DEFAULT_SHIFT_START = "09:00";
const DEFAULT_SHIFT_END = "18:00";
const DEFAULT_GRACE_PERIOD_MINUTES = 15;
const DEFAULT_EARLY_CHECKOUT_THRESHOLD_MINUTES = 30;
const MAX_PUNCH_WINDOW_HOURS = 12;
const MAX_PUNCH_WINDOW_MS = MAX_PUNCH_WINDOW_HOURS * 60 * 60 * 1000;

const getDayStart = (date = new Date()) => {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  return day;
};

const parseTime = (timeString) => {
  const [hour, minute] = String(timeString || "").split(":").map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return { hour: 9, minute: 0 };
  }
  return { hour, minute };
};

const getDateTimeForShift = (baseDate, timeString) => {
  const date = new Date(baseDate);
  const { hour, minute } = parseTime(timeString);
  date.setHours(hour, minute, 0, 0);
  return date;
};

const normalizeLocationPayload = (location, req, fallbackLabel = "Office") => {
  if (typeof location === "string") {
    return {
      label: location,
      ipAddress: req.ip || "",
      device: req.headers["user-agent"] || "",
    };
  }

  const input = location && typeof location === "object" ? location : {};

  return {
    latitude:
      typeof input.latitude === "number" && Number.isFinite(input.latitude)
        ? input.latitude
        : null,
    longitude:
      typeof input.longitude === "number" && Number.isFinite(input.longitude)
        ? input.longitude
        : null,
    ipAddress:
      typeof input.ipAddress === "string" && input.ipAddress.trim()
        ? input.ipAddress.trim()
        : req.ip || "",
    device:
      typeof input.device === "string" && input.device.trim()
        ? input.device.trim()
        : req.headers["user-agent"] || "",
    label:
      typeof input.label === "string" && input.label.trim()
        ? input.label.trim()
        : fallbackLabel,
  };
};

const getResolvedEmployeeIdFromAuth = async (req) => {
  if (req.user?.employeeId) {
    return req.user.employeeId;
  }

  if (!req.user?.id) {
    return null;
  }

  const authUser = await User.findById(req.user.id).select("employeeId").lean();
  if (authUser?.employeeId) {
    req.user.employeeId = authUser.employeeId;
    return authUser.employeeId;
  }

  return null;
};

const resolveShiftConfigForAttendance = async ({ employeeId, attendanceDate, attendance }) => {
  const defaultConfig = {
    startTime: attendance?.assignedShiftStart || DEFAULT_SHIFT_START,
    endTime: attendance?.assignedShiftEnd || DEFAULT_SHIFT_END,
    gracePeriodMinutes: DEFAULT_GRACE_PERIOD_MINUTES,
    earlyCheckoutThresholdMinutes: DEFAULT_EARLY_CHECKOUT_THRESHOLD_MINUTES,
  };

  const assignment = await EmployeeShift.findOne({
    employee: employeeId,
    isActive: true,
    effectiveFrom: { $lte: attendanceDate },
    $or: [{ effectiveTo: null }, { effectiveTo: { $gte: attendanceDate } }],
  })
    .sort({ effectiveFrom: -1 })
    .populate("shift")
    .lean();

  if (assignment?.shift) {
    return {
      startTime: assignment.shift.startTime || defaultConfig.startTime,
      endTime: assignment.shift.endTime || defaultConfig.endTime,
      gracePeriodMinutes:
        typeof assignment.shift.gracePeriodMinutes === "number"
          ? assignment.shift.gracePeriodMinutes
          : defaultConfig.gracePeriodMinutes,
      earlyCheckoutThresholdMinutes:
        typeof assignment.shift.earlyCheckoutThresholdMinutes === "number"
          ? assignment.shift.earlyCheckoutThresholdMinutes
          : defaultConfig.earlyCheckoutThresholdMinutes,
      shiftId: assignment.shift._id,
    };
  }

  if (attendance?.shift) {
    const shift = await Shift.findById(attendance.shift).lean();
    if (shift) {
      return {
        startTime: shift.startTime || defaultConfig.startTime,
        endTime: shift.endTime || defaultConfig.endTime,
        gracePeriodMinutes:
          typeof shift.gracePeriodMinutes === "number"
            ? shift.gracePeriodMinutes
            : defaultConfig.gracePeriodMinutes,
        earlyCheckoutThresholdMinutes:
          typeof shift.earlyCheckoutThresholdMinutes === "number"
            ? shift.earlyCheckoutThresholdMinutes
            : defaultConfig.earlyCheckoutThresholdMinutes,
        shiftId: shift._id,
      };
    }
  }

  return defaultConfig;
};

const computeBreakDuration = (breaks = [], checkoutTime = null) => {
  let totalMinutes = 0;
  const normalizedBreaks = breaks.map((entry) => {
    const start = entry?.start ? new Date(entry.start) : null;
    const fallbackEnd = checkoutTime || new Date();
    const end = entry?.end ? new Date(entry.end) : fallbackEnd;

    if (!start || Number.isNaN(start.getTime()) || !end || end < start) {
      return {
        start,
        end: entry?.end || null,
        durationMinutes: 0,
      };
    }

    const durationMinutes = Math.round((end - start) / (1000 * 60));
    totalMinutes += durationMinutes;

    return {
      start,
      end,
      durationMinutes,
    };
  });

  return {
    normalizedBreaks,
    totalMinutes,
  };
};

const deriveStatus = ({ checkInTime, checkOutTime, attendanceDate, workingHours, shiftConfig }) => {
  const shiftStartDate = getDateTimeForShift(attendanceDate, shiftConfig.startTime);
  const shiftEndDate = getDateTimeForShift(attendanceDate, shiftConfig.endTime);
  const lateThreshold = new Date(
    shiftStartDate.getTime() + shiftConfig.gracePeriodMinutes * 60 * 1000,
  );
  const earlyCheckoutThreshold = new Date(
    shiftEndDate.getTime() - shiftConfig.earlyCheckoutThresholdMinutes * 60 * 1000,
  );

  const isLate = checkInTime ? checkInTime > lateThreshold : false;
  const isEarlyCheckout = checkOutTime ? checkOutTime < earlyCheckoutThreshold : false;

  let status = "Present";
  if (typeof workingHours === "number" && workingHours < 4) {
    status = "HalfDay";
  } else if (isEarlyCheckout) {
    status = "EarlyCheckout";
  } else if (isLate) {
    status = "Late";
  }

  return {
    status,
    isLate,
    isEarlyCheckout,
  };
};

const getMaxCheckoutTime = (checkInTime) => {
  return new Date(new Date(checkInTime).getTime() + MAX_PUNCH_WINDOW_MS);
};

const hasExceededPunchWindow = (attendance, referenceTime = new Date()) => {
  if (!attendance?.checkInTime || attendance?.checkOutTime) {
    return false;
  }

  return referenceTime.getTime() >= getMaxCheckoutTime(attendance.checkInTime).getTime();
};

const findLatestOpenAttendance = async (employeeId) => {
  return Attendance.findOne({
    employee: employeeId,
    isArchived: false,
    checkInTime: { $ne: null },
    checkOutTime: null,
  }).sort({ checkInTime: -1, attendanceDate: -1 });
};

const finalizeAttendanceCheckout = async ({
  attendance,
  employeeId,
  actorId,
  checkOutTime,
  checkOutLocation,
  action,
  description,
}) => {
  const breakSummary = computeBreakDuration(attendance.breaks || [], checkOutTime);
  const grossWorkingHours =
    (checkOutTime - attendance.checkInTime) / (1000 * 60 * 60);
  const netWorkingHours = Math.max(
    0,
    grossWorkingHours - breakSummary.totalMinutes / 60,
  );
  const attendanceDate = attendance.attendanceDate || getDayStart(checkOutTime);
  const shiftConfig = await resolveShiftConfigForAttendance({
    employeeId,
    attendanceDate,
    attendance,
  });
  const derivedStatus = deriveStatus({
    checkInTime: attendance.checkInTime,
    checkOutTime,
    attendanceDate,
    workingHours: netWorkingHours,
    shiftConfig,
  });

  attendance.checkOutTime = checkOutTime;
  attendance.checkOutLocation = checkOutLocation;
  attendance.breaks = breakSummary.normalizedBreaks;
  attendance.breakDurationMinutes = breakSummary.totalMinutes;
  attendance.workingHours = Math.round(netWorkingHours * 100) / 100;
  attendance.status = derivedStatus.status;
  attendance.remarks = [
    derivedStatus.isLate ? "Late check-in" : "",
    derivedStatus.isEarlyCheckout ? "Early checkout" : "",
    attendance.workingHours < 4 ? "Half-day due to low working hours" : "",
    action === "AUTO_CHECK_OUT" ? `Auto check-out after ${MAX_PUNCH_WINDOW_HOURS} hours limit` : "",
  ]
    .filter(Boolean)
    .join(" | ");
  attendance.updatedBy = actorId;
  attendance.approvalStatus = "Approved";

  const resolvedDescription = typeof description === "function"
    ? description(attendance, checkOutLocation)
    : description;

  await attendance.save();

  await AuditLog.create({
    userId: actorId,
    action,
    entityType: "Attendance",
    entityId: attendance._id,
    description: resolvedDescription,
  });

  return attendance;
};

const syncOpenAttendanceWindow = async ({ req, employeeId }) => {
  const openAttendance = await findLatestOpenAttendance(employeeId);
  if (!openAttendance || !hasExceededPunchWindow(openAttendance)) {
    return null;
  }

  const autoCheckoutTime = getMaxCheckoutTime(openAttendance.checkInTime);
  const autoCheckoutLocation = normalizeLocationPayload(
    { label: `Auto punch-out (${MAX_PUNCH_WINDOW_HOURS} hour limit)` },
    req,
    `Auto punch-out (${MAX_PUNCH_WINDOW_HOURS} hour limit)`,
  );

  return finalizeAttendanceCheckout({
    attendance: openAttendance,
    employeeId,
    actorId: req.user?.id || null,
    checkOutTime: autoCheckoutTime,
    checkOutLocation: autoCheckoutLocation,
    action: "AUTO_CHECK_OUT",
    description: (updatedAttendance, location) => `Employee automatically checked out after reaching the ${MAX_PUNCH_WINDOW_HOURS}-hour limit at ${location?.label || "Office"}. Working hours: ${updatedAttendance.workingHours}`,
  });
};

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

    const employee = await getResolvedEmployeeIdFromAuth(req);
    if (!employee) {
      return sendError(res, 403, "Employee mapping missing for authenticated user", {
        employee: "No employee record is linked to this account",
      });
    }

    const { checkInLocation = "Office" } = req.body;
    const normalizedLocation = normalizeLocationPayload(checkInLocation, req);

    // Verify employee exists
    const employeeRecord = await Employee.findById(employee);
    if (!employeeRecord) {
      return sendError(res, 404, "Employee not found", {
        employee: "The requested employee does not exist",
      });
    }

    await syncOpenAttendanceWindow({ req, employeeId: employee });

    // Get today's date (without time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if attendance record exists for today
    let attendance = await Attendance.findOne({
      employee,
      attendanceDate: today,
    });

    if (!attendance) {
      const shiftConfig = await resolveShiftConfigForAttendance({
        employeeId: employee,
        attendanceDate: today,
      });
      const checkInTime = new Date();
      const derivedStatus = deriveStatus({
        checkInTime,
        checkOutTime: null,
        attendanceDate: today,
        workingHours: null,
        shiftConfig,
      });

      // Create new attendance record
      attendance = new Attendance({
        employee,
        attendanceDate: today,
        checkInTime,
        checkInLocation: normalizedLocation,
        status: derivedStatus.status,
        remarks: derivedStatus.isLate ? "Auto-marked late based on shift policy" : "",
        shift: shiftConfig.shiftId || null,
        createdBy: req.user.id,
      });
    } else {
      // Update existing record
      // Allow re-check-in if employee already checked out (e.g., re-entry after lunch)
      if (attendance.checkInTime && !attendance.checkOutTime) {
        return sendError(res, 409, "Already checked in today", {
          checkIn: "You have already checked in today",
        });
      }
      const checkInTime = new Date();
      const shiftConfig = await resolveShiftConfigForAttendance({
        employeeId: employee,
        attendanceDate: today,
        attendance,
      });
      const derivedStatus = deriveStatus({
        checkInTime,
        checkOutTime: null,
        attendanceDate: today,
        workingHours: null,
        shiftConfig,
      });

      attendance.checkInTime = checkInTime;
      attendance.checkInLocation = normalizedLocation;
      // Reset checkout so the new punch cycle works cleanly
      attendance.checkOutTime = null;
      attendance.checkOutLocation = undefined;
      attendance.workingHours = 0;
      attendance.status = derivedStatus.status;
      attendance.remarks = derivedStatus.isLate
        ? "Auto-marked late based on shift policy"
        : attendance.remarks;
      attendance.shift = shiftConfig.shiftId || attendance.shift || null;
      attendance.updatedBy = req.user.id;
    }

    await attendance.save();

    // Log action
    await AuditLog.create({
      userId: req.user.id,
      action: "CHECK_IN",
      entityType: "Attendance",
      entityId: attendance._id,
      description: `Employee checked in at ${attendance.checkInLocation?.label || "Office"}`,
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

    const employee = await getResolvedEmployeeIdFromAuth(req);
    if (!employee) {
      return sendError(res, 403, "Employee mapping missing for authenticated user", {
        employee: "No employee record is linked to this account",
      });
    }

    const { checkOutLocation = "Office" } = req.body;
    const normalizedLocation = normalizeLocationPayload(checkOutLocation, req);

    // Verify employee exists
    const employeeRecord = await Employee.findById(employee);
    if (!employeeRecord) {
      return sendError(res, 404, "Employee not found", {
        employee: "The requested employee does not exist",
      });
    }

    const autoClosedAttendance = await syncOpenAttendanceWindow({ req, employeeId: employee });
    if (autoClosedAttendance) {
      return sendSuccess(
        res,
        200,
        `Attendance automatically punched out after ${MAX_PUNCH_WINDOW_HOURS} hours`,
        autoClosedAttendance,
      );
    }

    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Prefer the latest open attendance record so users can punch out the next day
    // if they forgot to close the previous day's shift.
    let attendance = await findLatestOpenAttendance(employee);

    if (!attendance) {
      attendance = await Attendance.findOne({
        employee,
        attendanceDate: today,
        isArchived: false,
      });
    }

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

    const checkOutTime = new Date();
    await finalizeAttendanceCheckout({
      attendance,
      employeeId: employee,
      actorId: req.user.id,
      checkOutTime,
      checkOutLocation: normalizedLocation,
      action: "CHECK_OUT",
      description: (updatedAttendance, location) => `Employee checked out at ${location?.label || "Office"}. Working hours: ${updatedAttendance.workingHours}`,
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
 * Start Break: Employee starts a break during an active day
 */
export const startBreak = async (req, res) => {
  try {
    const employee = await getResolvedEmployeeIdFromAuth(req);
    if (!employee) {
      return sendError(res, 403, "Employee mapping missing for authenticated user", {
        employee: "No employee record is linked to this account",
      });
    }

    const today = getDayStart(new Date());
    const attendance = await Attendance.findOne({
      employee,
      attendanceDate: today,
      isArchived: false,
    });

    if (!attendance || !attendance.checkInTime) {
      return sendError(res, 400, "Check-in required before starting a break", {
        break: "Please check in first",
      });
    }

    if (attendance.checkOutTime) {
      return sendError(res, 409, "Cannot start break after checkout");
    }

    const latestBreak = attendance.breaks?.[attendance.breaks.length - 1];
    if (latestBreak && !latestBreak.end) {
      return sendError(res, 409, "A break is already in progress");
    }

    attendance.breaks.push({ start: new Date() });
    attendance.updatedBy = req.user.id;
    await attendance.save();

    return sendSuccess(res, 200, "Break started successfully", attendance);
  } catch (error) {
    console.error("Start break error:", error);
    return sendError(res, 500, "Failed to start break", {
      error: error.message,
    });
  }
};

/**
 * End Break: Employee ends an active break
 */
export const endBreak = async (req, res) => {
  try {
    const employee = await getResolvedEmployeeIdFromAuth(req);
    if (!employee) {
      return sendError(res, 403, "Employee mapping missing for authenticated user", {
        employee: "No employee record is linked to this account",
      });
    }

    const today = getDayStart(new Date());
    const attendance = await Attendance.findOne({
      employee,
      attendanceDate: today,
      isArchived: false,
    });

    if (!attendance || !attendance.checkInTime) {
      return sendError(res, 400, "Check-in required before ending a break", {
        break: "Please check in first",
      });
    }

    if (attendance.checkOutTime) {
      return sendError(res, 409, "Cannot end break after checkout");
    }

    const latestBreakIndex = (attendance.breaks || []).length - 1;
    if (latestBreakIndex < 0 || attendance.breaks[latestBreakIndex].end) {
      return sendError(res, 409, "No active break found");
    }

    const breakEntry = attendance.breaks[latestBreakIndex];
    const breakEnd = new Date();
    const durationMinutes = Math.max(
      0,
      Math.round((breakEnd - new Date(breakEntry.start)) / (1000 * 60)),
    );

    attendance.breaks[latestBreakIndex].end = breakEnd;
    attendance.breaks[latestBreakIndex].durationMinutes = durationMinutes;

    const breakSummary = computeBreakDuration(attendance.breaks, null);
    attendance.breakDurationMinutes = breakSummary.totalMinutes;
    attendance.updatedBy = req.user.id;
    await attendance.save();

    return sendSuccess(res, 200, "Break ended successfully", attendance);
  } catch (error) {
    console.error("End break error:", error);
    return sendError(res, 500, "Failed to end break", {
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
    const employeeId = await getResolvedEmployeeIdFromAuth(req);

    if (!employeeId) {
      return sendError(res, 403, "Employee mapping missing for authenticated user", {
        employee: "No employee record is linked to this account",
      });
    }

    await syncOpenAttendanceWindow({ req, employeeId });

    // Build query
    let query = { employee: employeeId, isArchived: false };

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
    const user = await User.findById(req.user.id).lean();
    const userRole = req.user.role || user?.role;
    const requesterEmployeeId = await getResolvedEmployeeIdFromAuth(req);
    let managedIds = [];

    let query = { isArchived: false };

    // Manager can only see team members
    if (userRole === Roles.MANAGER) {
      if (!requesterEmployeeId) {
        return sendError(res, 403, "Manager account is not linked to an employee");
      }

      const managedEmployees = await Employee.find({
        $or: [
          { manager: requesterEmployeeId },
          { managerId: requesterEmployeeId },
          { managerID: requesterEmployeeId },
        ],
      });
      managedIds = managedEmployees.map((e) => String(e._id));
      query.employee = { $in: managedIds };
    }

    // HR_ADMIN and SUPER_ADMIN can see all or filtered by employee
    if (employeeId) {
      if (userRole === Roles.MANAGER && !managedIds.includes(String(employeeId))) {
        return sendError(res, 403, "Requested employee is not part of your team");
      }
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
 * Monthly Summary: Aggregated monthly metrics for dashboards
 */

export const monthlySummary = async (req, res) => {
  try {
    const now = new Date();
    const year = Number.parseInt(req.query.year || now.getFullYear(), 10);
    const month = Number.parseInt(req.query.month || now.getMonth() + 1, 10);
    const requestedEmployeeId = req.query.employeeId || null;

    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
      return sendError(res, 400, "Invalid year or month");
    }

    const monthStart = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

    const user = await User.findById(req.user.id).lean();
    const userRole = req.user.role || user?.role;
    const requesterEmployeeId = await getResolvedEmployeeIdFromAuth(req);

    const match = {
      isArchived: false,
      attendanceDate: {
        $gte: monthStart,
        $lte: monthEnd,
      },
    };

    if (userRole === Roles.EMPLOYEE) {
      if (!requesterEmployeeId) {
        return sendError(res, 403, "Employee mapping missing for authenticated user");
      }
      match.employee = requesterEmployeeId;
    } else if (userRole === Roles.MANAGER) {
      if (!requesterEmployeeId) {
        return sendError(res, 403, "Manager account is not linked to an employee");
      }

      const managedEmployees = await Employee.find(
        {
          $or: [
            { manager: requesterEmployeeId },
            { managerId: requesterEmployeeId },
            { managerID: requesterEmployeeId },
          ],
        },
        { _id: 1 },
      ).lean();

      const managedIds = managedEmployees.map((employee) => employee._id.toString());

      if (requestedEmployeeId) {
        if (!managedIds.includes(String(requestedEmployeeId))) {
          return sendError(res, 403, "Requested employee is not part of your team");
        }
        match.employee = requestedEmployeeId;
      } else {
        match.employee = { $in: managedIds };
      }
    } else if (requestedEmployeeId) {
      match.employee = requestedEmployeeId;
    }

    const [overall] = await Attendance.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          presentCount: {
            $sum: {
              $cond: [{ $in: ["$status", ["Present", "Late", "EarlyCheckout"]] }, 1, 0],
            },
          },
          lateCount: { $sum: { $cond: [{ $eq: ["$status", "Late"] }, 1, 0] } },
          earlyCheckoutCount: {
            $sum: { $cond: [{ $eq: ["$status", "EarlyCheckout"] }, 1, 0] },
          },
          halfDayCount: { $sum: { $cond: [{ $eq: ["$status", "HalfDay"] }, 1, 0] } },
          absentCount: { $sum: { $cond: [{ $eq: ["$status", "Absent"] }, 1, 0] } },
          leaveCount: {
            $sum: {
              $cond: [{ $in: ["$status", ["Leave", "OnLeave"]] }, 1, 0],
            },
          },
          totalWorkingHours: { $sum: "$workingHours" },
          averageWorkingHours: { $avg: "$workingHours" },
          totalBreakMinutes: { $sum: "$breakDurationMinutes" },
        },
      },
    ]);

    const dailyBreakdown = await Attendance.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$attendanceDate",
            },
          },
          presentCount: {
            $sum: {
              $cond: [{ $in: ["$status", ["Present", "Late", "EarlyCheckout"]] }, 1, 0],
            },
          },
          absentCount: { $sum: { $cond: [{ $eq: ["$status", "Absent"] }, 1, 0] } },
          lateCount: { $sum: { $cond: [{ $eq: ["$status", "Late"] }, 1, 0] } },
          averageWorkingHours: { $avg: "$workingHours" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return sendSuccess(res, 200, "Monthly summary retrieved successfully", {
      month,
      year,
      summary: overall || {
        totalRecords: 0,
        presentCount: 0,
        lateCount: 0,
        earlyCheckoutCount: 0,
        halfDayCount: 0,
        absentCount: 0,
        leaveCount: 0,
        totalWorkingHours: 0,
        averageWorkingHours: 0,
        totalBreakMinutes: 0,
      },
      dailyBreakdown,
    });
  } catch (error) {
    console.error("Monthly summary error:", error);
    return sendError(res, 500, "Failed to retrieve monthly summary", {
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
    const failedRecords = [];

    const uniqueEmployeeIds = [
      ...new Set(records.map((record) => String(record.employee))),
    ];

    const employeeDocs = await Employee.find(
      { _id: { $in: uniqueEmployeeIds } },
      { _id: 1 },
    ).lean();
    const validEmployeeIds = new Set(employeeDocs.map((employee) => String(employee._id)));

    const operations = [];

    records.forEach((record, index) => {
      const employeeId = String(record.employee || "");
      if (!validEmployeeIds.has(employeeId)) {
        failedRecords.push({
          index,
          error: "Employee not found",
        });
        return;
      }

      const attendanceDate = getDayStart(new Date(record.attendanceDate));
      if (Number.isNaN(attendanceDate.getTime())) {
        failedRecords.push({
          index,
          error: "Invalid attendanceDate",
        });
        return;
      }

      operations.push({
        updateOne: {
          filter: {
            employee: record.employee,
            attendanceDate,
          },
          update: {
            $set: {
              status: record.status || "Present",
              workingHours:
                typeof record.workingHours === "number" ? record.workingHours : 0,
              remarks: record.remarks || "",
              updatedBy: req.user.id,
            },
            $setOnInsert: {
              employee: record.employee,
              attendanceDate,
              createdBy: req.user.id,
            },
          },
          upsert: true,
        },
      });
    });

    const result = operations.length
      ? await Attendance.bulkWrite(operations, { ordered: false })
      : null;

    const uploadedCount = operations.length;

    // Log action
    await AuditLog.create({
      userId: req.user.id,
      action: "BULK_UPLOAD",
      entityType: "Attendance",
      description: `Bulk uploaded ${operations.length} attendance records via bulkWrite`,
    });

    return sendSuccess(res, 200, "Bulk upload completed", {
      uploaded: uploadedCount,
      failed: failedRecords.length,
      failedRecords,
      bulkResult: {
        matchedCount: result?.matchedCount || 0,
        modifiedCount: result?.modifiedCount || 0,
        upsertedCount: result?.upsertedCount || 0,
      },
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
    const normalizedFormat = String(format).toLowerCase();

    if (!["json", "csv"].includes(normalizedFormat)) {
      return sendError(res, 400, "Invalid export format. Use json or csv");
    }

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

    const total = await Attendance.countDocuments(query);

    const pipeline = [
      { $match: query },
      {
        $lookup: {
          from: "employees",
          localField: "employee",
          foreignField: "_id",
          as: "employee",
        },
      },
      {
        $unwind: {
          path: "$employee",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          attendanceDate: 1,
          checkInTime: 1,
          checkOutTime: 1,
          status: 1,
          workingHours: 1,
          approvalStatus: 1,
          employee: {
            firstName: "$employee.firstName",
            lastName: "$employee.lastName",
            email: "$employee.email",
            department: "$employee.department",
            designation: "$employee.designation",
          },
        },
      },
      { $sort: { attendanceDate: -1, _id: 1 } },
    ];

    const cursor = await Attendance.aggregate(pipeline)
      .allowDiskUse(true)
      .cursor({ batchSize: 1000 })
      .exec();

    if (normalizedFormat === "csv") {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=attendance.csv");
      res.write(
        "Employee Name,Email,Department,Designation,Date,Check-in,Check-out,Status,Working Hours,Approval Status\n",
      );

      for await (const row of cursor) {
        const employeeName = `${row.employee?.firstName || ""} ${row.employee?.lastName || ""}`.trim();
        const csvRow = [
          employeeName,
          row.employee?.email || "",
          row.employee?.department || "",
          row.employee?.designation || "",
          row.attendanceDate ? new Date(row.attendanceDate).toISOString() : "",
          row.checkInTime ? new Date(row.checkInTime).toISOString() : "",
          row.checkOutTime ? new Date(row.checkOutTime).toISOString() : "",
          row.status || "",
          row.workingHours ?? "",
          row.approvalStatus || "",
        ]
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(",");

        res.write(`${csvRow}\n`);
      }

      res.end();
    } else {
      res.setHeader("Content-Type", "application/json");
      res.write(`{"total":${total},"records":[`);

      let first = true;
      for await (const row of cursor) {
        if (!first) {
          res.write(",");
        }
        res.write(JSON.stringify(row));
        first = false;
      }

      res.write("]}");
      res.end();
    }

    await AuditLog.create({
      userId: req.user.id,
      action: "EXPORT",
      entityType: "Attendance",
      description: `Exported ${total} attendance records via streaming`,
    });

    return null;
  } catch (error) {
    console.error("Export attendance error:", error);
    if (res.headersSent) {
      res.end();
      return null;
    }
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
    const { shiftId, assignedShiftStart, assignedShiftEnd, effectiveDate } = req.body;

    if (!shiftId && (!assignedShiftStart || !assignedShiftEnd)) {
      return sendError(
        res,
        400,
        "Either shiftId or assignedShiftStart/assignedShiftEnd is required",
      );
    }

    // Check if attendance exists
    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
      return sendError(res, 404, "Attendance record not found", {
        attendanceId: "The requested attendance record does not exist",
      });
    }

    let targetShift = null;
    if (shiftId) {
      targetShift = await Shift.findOne({ _id: shiftId, isActive: true });
      if (!targetShift) {
        return sendError(res, 404, "Shift not found", {
          shiftId: "The requested shift does not exist or is inactive",
        });
      }
    } else {
      targetShift = await Shift.create({
        name: `Custom ${assignedShiftStart}-${assignedShiftEnd}`,
        startTime: assignedShiftStart,
        endTime: assignedShiftEnd,
        createdBy: req.user.id,
      });
    }

    const effectiveFrom = effectiveDate ? new Date(effectiveDate) : new Date();
    if (Number.isNaN(effectiveFrom.getTime())) {
      return sendError(res, 400, "Invalid effectiveDate");
    }

    await EmployeeShift.updateMany(
      {
        employee: attendance.employee,
        isActive: true,
      },
      {
        $set: {
          isActive: false,
          effectiveTo: effectiveFrom,
          updatedBy: req.user.id,
        },
      },
    );

    await EmployeeShift.create({
      employee: attendance.employee,
      shift: targetShift._id,
      effectiveFrom,
      isActive: true,
      createdBy: req.user.id,
      updatedBy: req.user.id,
    });

    const changes = {
      shift: {
        from: attendance.shift,
        to: targetShift._id,
      },
      assignedShiftStart: {
        from: attendance.assignedShiftStart,
        to: targetShift.startTime,
      },
      assignedShiftEnd: {
        from: attendance.assignedShiftEnd,
        to: targetShift.endTime,
      },
    };

    attendance.shift = targetShift._id;
    attendance.assignedShiftStart = targetShift.startTime;
    attendance.assignedShiftEnd = targetShift.endTime;
    attendance.updatedBy = req.user.id;

    await attendance.save();

    // Log action
    await AuditLog.create({
      userId: req.user.id,
      action: "ASSIGN_SHIFT",
      entityType: "Attendance",
      entityId: attendance._id,
      description: `Assigned shift ${targetShift.name} (${targetShift.startTime} - ${targetShift.endTime})`,
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
    const { shiftId, assignedShiftStart, assignedShiftEnd, effectiveDate } = req.body;

    if (!shiftId && (!assignedShiftStart || !assignedShiftEnd)) {
      return sendError(
        res,
        400,
        "Either shiftId or assignedShiftStart/assignedShiftEnd is required",
      );
    }

    // Check if attendance exists
    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
      return sendError(res, 404, "Attendance record not found", {
        attendanceId: "The requested attendance record does not exist",
      });
    }

    let targetShift = null;
    if (shiftId) {
      targetShift = await Shift.findOne({ _id: shiftId, isActive: true });
      if (!targetShift) {
        return sendError(res, 404, "Shift not found", {
          shiftId: "The requested shift does not exist or is inactive",
        });
      }
    } else {
      targetShift = await Shift.create({
        name: `Custom ${assignedShiftStart}-${assignedShiftEnd}`,
        startTime: assignedShiftStart,
        endTime: assignedShiftEnd,
        createdBy: req.user.id,
      });
    }

    const effectiveFrom = effectiveDate ? new Date(effectiveDate) : new Date();
    if (Number.isNaN(effectiveFrom.getTime())) {
      return sendError(res, 400, "Invalid effectiveDate");
    }

    const activeAssignment = await EmployeeShift.findOne({
      employee: attendance.employee,
      isActive: true,
    }).sort({ effectiveFrom: -1 });

    const changes = {
      shift: {
        from: attendance.shift,
        to: targetShift._id,
      },
      assignedShiftStart: {
        from: attendance.assignedShiftStart,
        to: targetShift.startTime,
      },
      assignedShiftEnd: {
        from: attendance.assignedShiftEnd,
        to: targetShift.endTime,
      },
    };

    if (activeAssignment) {
      activeAssignment.shift = targetShift._id;
      activeAssignment.effectiveFrom = effectiveFrom;
      activeAssignment.updatedBy = req.user.id;
      await activeAssignment.save();
    } else {
      await EmployeeShift.create({
        employee: attendance.employee,
        shift: targetShift._id,
        effectiveFrom,
        isActive: true,
        createdBy: req.user.id,
        updatedBy: req.user.id,
      });
    }

    attendance.shift = targetShift._id;
    attendance.assignedShiftStart = targetShift.startTime;
    attendance.assignedShiftEnd = targetShift.endTime;

    attendance.updatedBy = req.user.id;
    await attendance.save();

    // Log action
    await AuditLog.create({
      userId: req.user.id,
      action: "UPDATE_SHIFT",
      entityType: "Attendance",
      entityId: attendance._id,
      description: `Updated shift to ${targetShift.name} (${targetShift.startTime} - ${targetShift.endTime})`,
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
        to: DEFAULT_SHIFT_START,
      },
      assignedShiftEnd: {
        from: attendance.assignedShiftEnd,
        to: DEFAULT_SHIFT_END,
      },
    };

    await EmployeeShift.updateMany(
      {
        employee: attendance.employee,
        isActive: true,
      },
      {
        $set: {
          isActive: false,
          effectiveTo: new Date(),
          updatedBy: req.user.id,
        },
      },
    );

    // Reset to default shift
    attendance.shift = null;
    attendance.assignedShiftStart = DEFAULT_SHIFT_START;
    attendance.assignedShiftEnd = DEFAULT_SHIFT_END;
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
