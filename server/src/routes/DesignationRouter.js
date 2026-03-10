import express from "express";
import {
  createDesignation,
  listDesignations,
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

// List designations (All authenticated users)
router.get("/", listDesignations);

// Read single designation (All authenticated users)
router.get("/:designationId", readDesignation);

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
