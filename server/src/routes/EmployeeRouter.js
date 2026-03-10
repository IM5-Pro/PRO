import express from "express";
import authGuard from "../middleware/authGuard.js";
import roleGuard from "../middleware/roleGuard.js";
import * as employeeController from "../controllers/EmployeeController.js";

const router = express.Router();

/**
 * 📋 ADMIN OPERATIONS (SUPER_ADMIN, HR_ADMIN)
 */

/**
 * Create new employee
 * POST /api/employees
 */
router.post(
  "/",
  authGuard,
  roleGuard("SUPER_ADMIN", "HR_ADMIN"),
  employeeController.createEmployee
);

/**
 * List all employees (with pagination & filters)
 * GET /api/employees?page=1&limit=10&department=IT
 */
router.get(
  "/",
  authGuard,
  roleGuard("SUPER_ADMIN", "HR_ADMIN", "MANAGER"),
  employeeController.listEmployees
);

/**
 * Bulk import employees
 * POST /api/employees/bulk/import
 */
router.post(
  "/bulk/import",
  authGuard,
  roleGuard("SUPER_ADMIN", "HR_ADMIN"),
  employeeController.bulkImport
);

/**
 * Bulk update employees
 * POST /api/employees/bulk/update
 */
router.post(
  "/bulk/update",
  authGuard,
  roleGuard("SUPER_ADMIN", "HR_ADMIN"),
  employeeController.bulkUpdate
);

/**
 * Export employees (CSV/JSON)
 * GET /api/employees/export?format=csv
 */
router.get(
  "/export",
  authGuard,
  roleGuard("SUPER_ADMIN", "HR_ADMIN"),
  employeeController.exportEmployees
);

/**
 * 📝 EMPLOYEE OPERATIONS
 */

/**
 * Get employee details
 * GET /api/employees/:employeeId
 */
router.get(
  "/:employeeId",
  authGuard,
  roleGuard("SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"),
  employeeController.readEmployee
);

/**
 * Update employee (HR_ADMIN only)
 * PUT /api/employees/:employeeId
 */
router.put(
  "/:employeeId",
  authGuard,
  roleGuard("SUPER_ADMIN", "HR_ADMIN"),
  employeeController.updateEmployee
);

/**
 * 👤 PROFILE OPERATIONS
 */

/**
 * View employee profile
 * GET /api/employees/:employeeId/profile
 */
router.get(
  "/:employeeId/profile",
  authGuard,
  roleGuard("SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"),
  employeeController.viewProfile
);

/**
 * Update own profile (EMPLOYEE only)
 * PUT /api/employees/profile/update
 */
router.put(
  "/profile/update",
  authGuard,
  roleGuard("EMPLOYEE"),
  employeeController.updateProfile
);

/**
 * 📄 DOCUMENT OPERATIONS
 */

/**
 * Upload document
 * POST /api/employees/:employeeId/documents
 */
router.post(
  "/:employeeId/documents",
  authGuard,
  roleGuard("SUPER_ADMIN", "HR_ADMIN", "EMPLOYEE"),
  employeeController.uploadDocument
);

/**
 * Download document
 * GET /api/employees/:employeeId/documents/:documentId
 */
router.get(
  "/:employeeId/documents/:documentId",
  authGuard,
  roleGuard("SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"),
  employeeController.downloadDocument
);

/**
 * 💰 SALARY OPERATIONS
 */

/**
 * View salary
 * GET /api/employees/:employeeId/salary
 */
router.get(
  "/:employeeId/salary",
  authGuard,
  roleGuard("SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"),
  employeeController.viewSalary
);

/**
 * 📊 HISTORY OPERATIONS
 */

/**
 * View history
 * GET /api/employees/:employeeId/history
 */
router.get(
  "/:employeeId/history",
  authGuard,
  roleGuard("SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"),
  employeeController.viewHistory
);

/**
 * 🔄 ADMINISTRATIVE OPERATIONS
 */

/**
 * Transfer employee to department
 * PUT /api/employees/:employeeId/transfer-dept
 */
router.put(
  "/:employeeId/transfer-dept",
  authGuard,
  roleGuard("SUPER_ADMIN", "HR_ADMIN"),
  employeeController.transferDepartment
);

/**
 * Change designation
 * PUT /api/employees/:employeeId/change-designation
 */
router.put(
  "/:employeeId/change-designation",
  authGuard,
  roleGuard("SUPER_ADMIN", "HR_ADMIN"),
  employeeController.changeDesignation
);

/**
 * Change manager
 * PUT /api/employees/:employeeId/change-manager
 */
router.put(
  "/:employeeId/change-manager",
  authGuard,
  roleGuard("SUPER_ADMIN", "HR_ADMIN"),
  employeeController.changeManager
);

/**
 * Deactivate employee
 * PUT /api/employees/:employeeId/deactivate
 */
router.put(
  "/:employeeId/deactivate",
  authGuard,
  roleGuard("SUPER_ADMIN", "HR_ADMIN"),
  employeeController.deactivateEmployee
);

/**
 * Activate employee
 * PUT /api/employees/:employeeId/activate
 */
router.put(
  "/:employeeId/activate",
  authGuard,
  roleGuard("SUPER_ADMIN", "HR_ADMIN"),
  employeeController.activateEmployee
);

export default router;
