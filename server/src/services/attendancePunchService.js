import Attendance from "../models/Attendance.js";
import User from "../models/User.js";
import Shift from "../models/Shift.js";
import EmployeeShift from "../models/EmployeeShift.js";
import AuditLog from "../models/AuditLog.js";

const DEFAULT_SHIFT_START = "10:00";
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

const normalizePunchesForCalculation = (attendance) => {
  if (attendance.punches && attendance.punches.length > 0) {
    return attendance.punches;
  }

  if (!attendance.checkInTime) {
    return [];
  }

  return [
    {
      checkInTime: attendance.checkInTime,
      checkInLocation: attendance.checkInLocation,
      checkOutTime: attendance.checkOutTime,
      checkOutLocation: attendance.checkOutLocation,
      durationMinutes: 0,
    },
  ];
};

const calculatePunchSummary = (attendance, referenceTime = new Date(), includeOpenPunch = true) => {
  const punches = normalizePunchesForCalculation(attendance);
  let totalWorkingMinutes = 0;
  let firstPunch = null;
  let lastCompletedPunch = null;
  let hasOpenPunch = false;

  punches.forEach((punch) => {
    const checkInTime = punch?.checkInTime ? new Date(punch.checkInTime) : null;
    if (!checkInTime || Number.isNaN(checkInTime.getTime())) {
      return;
    }

    if (!firstPunch || checkInTime < new Date(firstPunch.checkInTime)) {
      firstPunch = punch;
    }

    const checkOutTime = punch?.checkOutTime ? new Date(punch.checkOutTime) : null;
    if (checkOutTime && !Number.isNaN(checkOutTime.getTime())) {
      const durationMinutes = Math.max(0, Math.round((checkOutTime - checkInTime) / (1000 * 60)));
      punch.durationMinutes = durationMinutes;
      totalWorkingMinutes += durationMinutes;

      if (!lastCompletedPunch || checkOutTime > new Date(lastCompletedPunch.checkOutTime)) {
        lastCompletedPunch = punch;
      }

      return;
    }

    hasOpenPunch = true;
    if (includeOpenPunch) {
      const durationMinutes = Math.max(0, Math.round((referenceTime - checkInTime) / (1000 * 60)));
      punch.durationMinutes = durationMinutes;
      totalWorkingMinutes += durationMinutes;
    }
  });

  return {
    firstPunch,
    lastCompletedPunch,
    hasOpenPunch,
    totalWorkingMinutes,
  };
};

const syncAttendanceTotalsFromPunches = async ({
  attendance,
  employeeId,
  actorId = null,
  referenceTime = new Date(),
}) => {
  const punchSummary = calculatePunchSummary(attendance, referenceTime, true);
  if (!punchSummary.firstPunch) {
    return attendance;
  }

  const breakSummary = computeBreakDuration(attendance.breaks || [], referenceTime);
  const grossWorkingHours = punchSummary.totalWorkingMinutes / 60;
  const netWorkingHours = Math.max(0, grossWorkingHours - breakSummary.totalMinutes / 60);
  const attendanceDate = attendance.attendanceDate || getDayStart(referenceTime);
  const firstCheckInTime = new Date(punchSummary.firstPunch.checkInTime);
  const lastCheckOutTime = punchSummary.lastCompletedPunch?.checkOutTime
    ? new Date(punchSummary.lastCompletedPunch.checkOutTime)
    : null;

  const shiftConfig = await resolveShiftConfigForAttendance({
    employeeId,
    attendanceDate,
    attendance,
  });

  const derivedStatus = deriveStatus({
    checkInTime: firstCheckInTime,
    checkOutTime: punchSummary.hasOpenPunch ? null : lastCheckOutTime,
    attendanceDate,
    workingHours: punchSummary.hasOpenPunch ? null : netWorkingHours,
    shiftConfig,
  });

  attendance.checkInTime = firstCheckInTime;
  attendance.checkInLocation = punchSummary.firstPunch.checkInLocation || attendance.checkInLocation;
  attendance.checkOutTime = punchSummary.hasOpenPunch ? null : lastCheckOutTime;
  attendance.checkOutLocation = punchSummary.hasOpenPunch
    ? undefined
    : punchSummary.lastCompletedPunch?.checkOutLocation || attendance.checkOutLocation;
  attendance.breaks = breakSummary.normalizedBreaks;
  attendance.breakDurationMinutes = breakSummary.totalMinutes;
  attendance.workingHours = Math.round(netWorkingHours * 100) / 100;
  attendance.status = derivedStatus.status;
  attendance.remarks = [
    derivedStatus.isLate ? "Late check-in" : "",
    derivedStatus.isEarlyCheckout ? "Early checkout" : "",
    !punchSummary.hasOpenPunch && attendance.workingHours < 4 ? "Half-day due to low working hours" : "",
    attendance.punches && attendance.punches.length > 1 ? `Multiple punch cycles (${attendance.punches.length})` : "",
    punchSummary.hasOpenPunch ? "Attendance synced while punch is active" : "",
  ]
    .filter(Boolean)
    .join(" | ");
  attendance.updatedBy = actorId;

  if (!attendance.requiresManagerApproval && !attendance.manuallyAddedBy) {
    attendance.approvalStatus = "Approved";
  }

  await attendance.save();
  return attendance;
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
  
  // Update the latest punch with checkOutTime
  if (attendance.punches && attendance.punches.length > 0) {
    const latestPunch = attendance.punches[attendance.punches.length - 1];
    latestPunch.checkOutTime = checkOutTime;
    latestPunch.checkOutLocation = checkOutLocation;
    
    // Calculate duration for this punch
    if (latestPunch.checkInTime) {
      latestPunch.durationMinutes = Math.round((checkOutTime - latestPunch.checkInTime) / (1000 * 60));
    }
  }

  // Calculate total working hours from all punches
  const punchSummary = calculatePunchSummary(attendance, checkOutTime, false);
  const totalWorkingMinutes = punchSummary.totalWorkingMinutes;

  const grossWorkingHours = totalWorkingMinutes / 60;
  const netWorkingHours = Math.max(0, grossWorkingHours - breakSummary.totalMinutes / 60);
  const attendanceDate = attendance.attendanceDate || getDayStart(checkOutTime);
  
  const shiftConfig = await resolveShiftConfigForAttendance({
    employeeId,
    attendanceDate,
    attendance,
  });
  
  // Use first punch-in time for status calculation
  const firstCheckInTime = punchSummary.firstPunch?.checkInTime || attendance.checkInTime;
    
  const derivedStatus = deriveStatus({
    checkInTime: firstCheckInTime,
    checkOutTime,
    attendanceDate,
    workingHours: netWorkingHours,
    shiftConfig,
  });

  attendance.checkInTime = firstCheckInTime;
  attendance.checkInLocation = punchSummary.firstPunch?.checkInLocation || attendance.checkInLocation;
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
    attendance.punches && attendance.punches.length > 1 ? `Multiple punch cycles (${attendance.punches.length})` : "",
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

export {
  DEFAULT_SHIFT_START,
  DEFAULT_SHIFT_END,
  DEFAULT_GRACE_PERIOD_MINUTES,
  DEFAULT_EARLY_CHECKOUT_THRESHOLD_MINUTES,
  MAX_PUNCH_WINDOW_HOURS,
  MAX_PUNCH_WINDOW_MS,
  getDayStart,
  parseTime,
  getDateTimeForShift,
  normalizeLocationPayload,
  getResolvedEmployeeIdFromAuth,
  resolveShiftConfigForAttendance,
  computeBreakDuration,
  deriveStatus,
  getMaxCheckoutTime,
  hasExceededPunchWindow,
  findLatestOpenAttendance,
  normalizePunchesForCalculation,
  calculatePunchSummary,
  syncAttendanceTotalsFromPunches,
  finalizeAttendanceCheckout,
  syncOpenAttendanceWindow,
};
