import express from "express";
import {
  createResignation,
  getMyResignation,
  getTeamResignations,
  getResignationById,
  getAllResignations,
  updateResignation,
  approveResignation,
  rejectResignation,
  cancelResignation,
  getResignationStats,
} from "../controllers/ResignationController.js";
import authGuard from "../middleware/authGuard.js";
import { permissionGuard } from "../middleware/permissionGuard.js";

const router = express.Router();

/**
 * Resignation Routes
 * 
 * POST   /resignations              - Create resignation request
 * GET    /resignations/my           - Get employee's own resignations
 * GET    /resignations/team         - Get team resignations (manager)
 * GET    /resignations/all          - Get all resignations (HR/Admin)
 * GET    /resignations/stats        - Get resignation statistics
 * GET    /resignations/:id          - Get specific resignation
 * POST   /resignations/:id/approve  - Approve resignation
 * POST   /resignations/:id/reject   - Reject resignation
 * POST   /resignations/:id/cancel   - Cancel resignation
 */

// Create resignation request
router.post(
  "/",
  authGuard,
  permissionGuard("resignations", "create"),
  createResignation
);

// Get employee's own resignations (specific route before generic :id)
router.get(
  "/my",
  authGuard,
  permissionGuard("resignations", "read"),
  getMyResignation
);

// Get resignation statistics (specific route before generic :id)
router.get(
  "/stats",
  authGuard,
  permissionGuard("resignations", "list"),
  getResignationStats
);

// Get team resignations (manager)
router.get(
  "/team",
  authGuard,
  permissionGuard("resignations", "list"),
  getTeamResignations
);

// Get all resignations (HR/Admin)
router.get(
  "/all",
  authGuard,
  permissionGuard("resignations", "list"),
  getAllResignations
);

// Get specific resignation by ID (generic route after specific routes)
router.get(
  "/:id",
  authGuard,
  permissionGuard("resignations", "read"),
  getResignationById
);

// Update resignation (only owner can edit DRAFT/SUBMITTED status)
router.put(
  "/:id",
  authGuard,
  permissionGuard("resignations", "update"),
  updateResignation
);

// Approve resignation
router.post(
  "/:id/approve",
  authGuard,
  permissionGuard("resignations", "approve"),
  approveResignation
);

// Reject resignation
router.post(
  "/:id/reject",
  authGuard,
  permissionGuard("resignations", "approve"),
  rejectResignation
);

// Cancel resignation
router.post(
  "/:id/cancel",
  authGuard,
  permissionGuard("resignations", "update"),
  cancelResignation
);

export default router;
