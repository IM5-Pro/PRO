import express from "express";
import leaveController from "../controllers/LeaveController.js";
import authGuard from "../middleware/authGuard.js";
import {permissionGuard} from "../middleware/permissionGuard.js";

const router = express.Router();

// leave requests
router.post(
  "/",
  authGuard,
  permissionGuard("leaves", "create"),
  leaveController.applyLeave,
);

router.post(
  "/cancel/:id",
  authGuard,
  permissionGuard("leaves", "cancel"),
  leaveController.cancelLeave,
);

router.put(
  "/:id",
  authGuard,
  permissionGuard("leaves", "update"),
  leaveController.updateLeave,
);

router.get(
  "/own",
  authGuard,
  permissionGuard("leaves", "read"),
  leaveController.viewOwn,
);

router.get(
  "/team",
  authGuard,
  permissionGuard("leaves", "list"),
  leaveController.viewTeam,
);

router.get(
  "/all",
  authGuard,
  permissionGuard("leaves", "list"),
  leaveController.viewAll,
);

router.patch(
  "/:id/approve",
  authGuard,
  permissionGuard("leaves", "approve"),
  leaveController.approveLeave,
);

router.patch(
  "/:id/reject",
  authGuard,
  permissionGuard("leaves", "reject"),
  leaveController.rejectLeave,
);

router.post(
  "/bulk-approve",
  authGuard,
  permissionGuard("leaves", "approve"),
  leaveController.bulkApprove,
);

// leave policy endpoints
router.post(
  "/policy",
  authGuard,
  permissionGuard("leaves", "create"),
  leaveController.createPolicy,
);

router.put(
  "/policy/:id",
  authGuard,
  permissionGuard("leaves", "update"),
  leaveController.updatePolicy,
);

router.delete(
  "/policy/:id",
  authGuard,
  permissionGuard("leaves", "delete"),
  leaveController.deletePolicy,
);

router.get(
  "/policy",
  authGuard,
  permissionGuard("leaves", "read"),
  leaveController.viewPolicies,
);

// balance endpoints
router.get(
  "/balance",
  authGuard,
  permissionGuard("leaves", "read"),
  leaveController.viewBalance,
);

router.patch(
  "/balance",
  authGuard,
  permissionGuard("leaves", "update"),
  leaveController.adjustBalance,
);

export default router;
