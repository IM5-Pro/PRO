import express from "express";
import {
  checkIn,
  checkOut,
  syncAttendance,
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
import { permissionGuard, multiPermissionGuard } from "../middleware/permissionGuard.js";
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
router.post("/sync", syncAttendance);

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
  multiPermissionGuard([
    { resource: "attendance", action: "view_team" },
    { resource: "attendance", action: "view_own" },
  ]),
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

/**
 * Pending Approvals: Manager, HR Admin, Super Admin
 * GET /api/attendance/pending/approvals
 */
router.get(
  "/pending/approvals",
  permissionGuard("attendance", "view_team"),
  async (req, res) => {
    try {
      const { getPendingApprovals } = await import("../services/attendanceAutoMarkService.js");
      const { getResolvedEmployeeIdFromAuth } = await import(
        "../services/attendancePunchService.js"
      );
      const managerEmployeeId = await getResolvedEmployeeIdFromAuth(req);
      const pendingRecords = await getPendingApprovals({
        userRole: req.user?.role,
        managerEmployeeId,
      });
      res.json({ success: true, data: pendingRecords });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

/**
 * LOP Status: Employee can view, HR can see all
 * GET /api/attendance/lop/status
 */
router.get(
  "/lop/status",
  authGuard,
  async (req, res) => {
    try {
      const Attendance = (await import("../models/Attendance.js")).default;
      const query = {
        isLossOfPay: true,
        isArchived: false,
      };

      // Non-HR users can only see their own LOP records
      if (!["SUPER_ADMIN", "HR_ADMIN"].includes(req.user.role)) {
        const Employee = (await import("../models/Employee.js")).default;
        const employee = await Employee.findOne({ userId: req.user.id });
        if (!employee) {
          return res.status(404).json({ success: false, message: "Employee not found" });
        }
        query.employee = employee._id;
      }

      const { page = 1, limit = 10 } = req.query;
      const skip = (page - 1) * limit;

      const lopRecords = await Attendance.find(query)
        .populate("employee", "firstName lastName email")
        .sort({ attendanceDate: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Attendance.countDocuments(query);

      res.json({
        success: true,
        data: {
          lopRecords,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

/**
 * Trigger Auto-mark (Manual - for testing/admin)
 * POST /api/attendance/auto-mark/trigger
 */
router.post(
  "/auto-mark/trigger",
  authGuard,
  permissionGuard("attendance", "shift_assign"),
  async (req, res) => {
    try {
      const { triggerAutoMark } = await import("../services/schedulerService.js");
      const result = await triggerAutoMark();
      res.json({ success: true, message: result.message });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

export default router;
