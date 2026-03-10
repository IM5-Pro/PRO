import express from "express";
import authGuard from "../middleware/authGuard.js";
import roleGuard from "../middleware/roleGuard.js";
import * as roleController from "../controllers/RoleController.js";

const router = express.Router();

// All role management endpoints require Super Admin
const superAdminOnly = [authGuard, roleGuard("SUPER_ADMIN")];

/**
 * List all roles
 * GET /api/roles
 */
router.get("/", superAdminOnly, roleController.listRoles);

/**
 * Get single role by ID
 * GET /api/roles/:roleId
 */
router.get("/:roleId", superAdminOnly, roleController.readRole);

/**
 * Create a new role
 * POST /api/roles
 */
router.post("/", superAdminOnly, roleController.createRole);

/**
 * Update a role
 * PUT /api/roles/:roleId
 */
router.put("/:roleId", superAdminOnly, roleController.updateRole);

/**
 * Delete a role
 * DELETE /api/roles/:roleId
 */
router.delete("/:roleId", superAdminOnly, roleController.deleteRole);

/**
 * Assign permission to role
 * POST /api/roles/:roleId/assign-permission
 */
router.post(
  "/:roleId/assign-permission",
  superAdminOnly,
  roleController.assignPermission
);

/**
 * Remove permission from role
 * POST /api/roles/:roleId/remove-permission
 */
router.post(
  "/:roleId/remove-permission",
  superAdminOnly,
  roleController.removePermission
);

/**
 * View permissions of a role
 * GET /api/roles/:roleId/permissions
 */
router.get("/:roleId/permissions", superAdminOnly, roleController.viewPermissions);

export default router;
