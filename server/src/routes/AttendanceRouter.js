import express from "express";
import {
  checkIn,
  checkOut,
  startBreak,
  endBreak,
  viewOwn,
  viewTeam,
  viewAll,
  monthlySummary,
  editAttendance,
  deleteAttendance,
  bulkUpload,
  exportAttendance,
  approveAttendance,
  rejectAttendance,
  assignShift,
  updateShift,
  deleteShift,
  createManualAttendance,
} from "../controllers/AttendanceController.js";
import { permissionGuard } from "../middleware/permissionGuard.js";
import authGuard from "../middleware/authGuard.js";

const router = express.Router();

// All routes require authentication
router.use(authGuard);

/**
 * Check-in/Check-out: Employee only (automatic)
 */
router.post("/check-in", checkIn);
router.post("/check-out", checkOut);
router.post("/checkin", checkIn);
router.post("/checkout", checkOut);

/**
 * Break tracking: Employee only
 */
router.post("/break/start", startBreak);
router.post("/break/end", endBreak);

/**
 * Manual Attendance Creation: Employee can add for themselves
 */
router.post("/manual", createManualAttendance);

/**
 * View Own: All roles
 */
router.get("/own", viewOwn);

/**
 * View Team: Manager, HR Admin, Super Admin
 */
router.get(
  "/team",
  permissionGuard("attendance", "view_team"),
  viewTeam
);

/**
 * View All: HR Admin, Super Admin
 */
router.get(
  "/all",
  permissionGuard("attendance", "view_all"),
  viewAll
);

router.get(
  "/monthly-summary",
  permissionGuard("attendance", "view_team"),
  monthlySummary
);

/**
 * Edit Attendance: HR Admin, Super Admin (limited)
 */
router.put(
  "/:attendanceId",
  permissionGuard("attendance", "edit"),
  editAttendance
);

/**
 * Delete Attendance: Super Admin only (soft delete)
 */
router.delete(
  "/:attendanceId",
  permissionGuard("attendance", "delete"),
  deleteAttendance
);

/**
 * Bulk Upload: HR Admin, Super Admin
 */
router.post(
  "/bulk/upload",
  permissionGuard("attendance", "bulk_upload"),
  bulkUpload
);

/**
 * Export: HR Admin, Super Admin
 */
router.get(
  "/export/download",
  permissionGuard("attendance", "export"),
  exportAttendance
);

/**
 * Approve Attendance: Manager, HR Admin, Super Admin
 */
router.post(
  "/:attendanceId/approve",
  permissionGuard("attendance", "approve"),
  approveAttendance
);

/**
 * Reject Attendance: Manager, HR Admin, Super Admin
 */
router.post(
  "/:attendanceId/reject",
  permissionGuard("attendance", "reject"),
  rejectAttendance
);

/**
 * Shift Management: HR Admin, Super Admin
 */
router.post(
  "/:attendanceId/shift/assign",
  permissionGuard("attendance", "shift_assign"),
  assignShift
);

router.put(
  "/:attendanceId/shift/update",
  permissionGuard("attendance", "shift_update"),
  updateShift
);

router.delete(
  "/:attendanceId/shift/delete",
  permissionGuard("attendance", "shift_delete"),
  deleteShift
);

export default router;
