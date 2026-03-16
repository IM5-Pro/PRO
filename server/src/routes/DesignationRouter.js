import express from "express";
import {
  createDesignation,
  listDesignations,
  listDesignationHierarchy,
  getOrgChart,
  readDesignation,
  updateDesignation,
  deleteDesignation,
  assignToEmployee,
} from "../controllers/DesignationController.js";
import { permissionGuard } from "../middleware/permissionGuard.js";
import authGuard from "../middleware/authGuard.js";

const router = express.Router();

// All routes require authentication
router.use(authGuard);

// Create designation (Super Admin, HR Admin)
router.post(
  "/",
  permissionGuard("designation", "create"),
  createDesignation
);

// Hierarchy and org-chart views
router.get(
  "/hierarchy",
  permissionGuard("designation", "read"),
  listDesignationHierarchy
);

router.get(
  "/org-chart",
  permissionGuard("designation", "read"),
  getOrgChart
);

// List designations (based on designation list permission)
router.get(
  "/",
  permissionGuard("designation", "list"),
  listDesignations
);

// Read single designation (based on designation read permission)
router.get(
  "/:designationId",
  permissionGuard("designation", "read"),
  readDesignation
);

// Update designation (Super Admin, HR Admin)
router.put(
  "/:designationId",
  permissionGuard("designation", "update"),
  updateDesignation
);

// Delete designation (Super Admin only)
router.delete(
  "/:designationId",
  permissionGuard("designation", "delete"),
  deleteDesignation
);

// Assign designation to employee (Super Admin, HR Admin)
router.post(
  "/:designationId/assign",
  permissionGuard("designation", "assign"),
  assignToEmployee
);

export default router;
