import express from "express";
import authGuard from "../middleware/authGuard.js";
import roleGuard from "../middleware/roleGuard.js";
import * as permissionController from "../controllers/PermissionController.js";

const router = express.Router();

// All permission management endpoints require Super Admin
const superAdminOnly = [authGuard, roleGuard("SUPER_ADMIN")];

/**
 * List all permissions
 * GET /api/permissions
 */
router.get("/", superAdminOnly, permissionController.listPermissions);

/**
 * Get single permission by ID
 * GET /api/permissions/:permissionId
 */
router.get("/:permissionId", superAdminOnly, permissionController.readPermission);

/**
 * Create a new permission
 * POST /api/permissions
 */
router.post("/", superAdminOnly, permissionController.createPermission);

/**
 * Update a permission
 * PUT /api/permissions/:permissionId
 */
router.put("/:permissionId", superAdminOnly, permissionController.updatePermission);

/**
 * Delete a permission
 * DELETE /api/permissions/:permissionId
 */
router.delete("/:permissionId", superAdminOnly, permissionController.deletePermission);

/**
 * Assign permission to role
 * POST /api/permissions/:permissionId/assign-role
 */
router.post(
  "/:permissionId/assign-role",
  superAdminOnly,
  permissionController.assignRole
);

/**
 * Remove permission from role
 * POST /api/permissions/:permissionId/remove-role
 */
router.post(
  "/:permissionId/remove-role",
  superAdminOnly,
  permissionController.removeRole
);

export default router;
