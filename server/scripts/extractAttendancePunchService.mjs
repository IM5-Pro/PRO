import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const controllerPath = path.resolve(__dirname, "../src/controllers/AttendanceController.js");
const servicePath = path.resolve(__dirname, "../src/services/attendancePunchService.js");

const lines = fs.readFileSync(controllerPath, "utf8").split(/\r?\n/);
const helperLines = lines.slice(17, 468);

const header = `import Attendance from "../models/Attendance.js";
import User from "../models/User.js";
import Shift from "../models/Shift.js";
import EmployeeShift from "../models/EmployeeShift.js";
import AuditLog from "../models/AuditLog.js";

`;

const exportsBlock = `
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
`;

fs.writeFileSync(servicePath, header + helperLines.join("\n") + exportsBlock);

const importBlock = `import {
  MAX_PUNCH_WINDOW_HOURS,
  MAX_PUNCH_WINDOW_MS,
  getDayStart,
  normalizeLocationPayload,
  getResolvedEmployeeIdFromAuth,
  resolveShiftConfigForAttendance,
  computeBreakDuration,
  deriveStatus,
  findLatestOpenAttendance,
  syncAttendanceTotalsFromPunches,
  finalizeAttendanceCheckout,
  syncOpenAttendanceWindow,
} from "../services/attendancePunchService.js";
`;

const kept = [
  ...lines.slice(0, 17),
  importBlock,
  ...lines.slice(468),
].join("\n");

fs.writeFileSync(controllerPath, kept);
console.log("attendancePunchService extracted");
