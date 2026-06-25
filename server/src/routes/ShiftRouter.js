import express from "express";
import authGuard from "../middleware/authGuard.js";
import roleGuard from "../middleware/roleGuard.js";
import * as shiftController from "../controllers/ShiftController.js";

const router = express.Router();

// All routes require authentication
router.use(authGuard);

/**
 * Create new shift
 * POST /api/shifts
 * Permission: SUPER_ADMIN, HR_ADMIN only
 */
router.post(
  "/",
  roleGuard("SUPER_ADMIN", "HR_ADMIN"),
  shiftController.createShift
);

/**
 * List all shifts with pagination
 * GET /api/shifts
 * Permission: All authenticated users
 */
router.get("/", shiftController.listShifts);

/**
 * Get shift by ID
 * GET /api/shifts/:shiftId
 * Permission: All authenticated users
 */
router.get("/:shiftId", shiftController.getShift);

/**
 * Update shift
 * PUT /api/shifts/:shiftId
 * Permission: SUPER_ADMIN, HR_ADMIN only
 */
router.put(
  "/:shiftId",
  roleGuard("SUPER_ADMIN", "HR_ADMIN"),
  shiftController.updateShift
);

/**
 * Delete shift (soft delete)
 * DELETE /api/shifts/:shiftId
 * Permission: SUPER_ADMIN only
 */
router.delete(
  "/:shiftId",
  roleGuard("SUPER_ADMIN"),
  shiftController.deleteShift
);

/**
 * Assign shift to employee
 * POST /api/shifts/assign
 * Permission: SUPER_ADMIN, HR_ADMIN only
 */
router.post(
  "/assign",
  roleGuard("SUPER_ADMIN", "HR_ADMIN"),
  shiftController.assignShiftToEmployee
);

/**
 * Get employee's current shift
 * GET /api/shifts/employee/:employeeId
 * Permission: All authenticated users
 */
router.get(
  "/employee/:employeeId",
  roleGuard("SUPER_ADMIN", "HR_ADMIN", "DEPT_ADMIN", "MANAGER", "EMPLOYEE"),
  shiftController.getEmployeeCurrentShift
);

/**
 * Get shift assignment history for employee
 * GET /api/shifts/employee/:employeeId/history
 * Permission: SUPER_ADMIN, HR_ADMIN, MANAGER, own employee
 */
router.get(
  "/employee/:employeeId/history",
  roleGuard("SUPER_ADMIN", "HR_ADMIN", "DEPT_ADMIN", "MANAGER", "EMPLOYEE"),
  shiftController.getEmployeeShiftHistory
);

/**
 * Get all employees assigned to a shift
 * GET /api/shifts/:shiftId/employees
 * Permission: SUPER_ADMIN, HR_ADMIN, MANAGER
 */
router.get(
  "/:shiftId/employees",
  roleGuard("SUPER_ADMIN", "HR_ADMIN", "MANAGER"),
  shiftController.getShiftEmployees
);

export default router;
