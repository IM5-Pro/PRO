import express from "express";
import leaveController from "../controllers/LeaveController.js";
import authGuard from "../middleware/authGuard.js";
import permissionGuard from "../middleware/permissionGuard.js";

const router = express.Router();

// leave requests
router.post(
  "/",
  authGuard,
  permissionGuard("leave.apply"),
  leaveController.applyLeave,
);

router.post(
  "/cancel/:id",
  authGuard,
  permissionGuard("leave.cancel"),
  leaveController.cancelLeave,
);

router.put(
  "/:id",
  authGuard,
  permissionGuard("leave.update"),
  leaveController.updateLeave,
);

router.get(
  "/own",
  authGuard,
  permissionGuard("leave.view_own"),
  leaveController.viewOwn,
);

router.get(
  "/team",
  authGuard,
  permissionGuard("leave.view_team"),
  leaveController.viewTeam,
);

router.get(
  "/all",
  authGuard,
  permissionGuard("leave.view_all"),
  leaveController.viewAll,
);

router.patch(
  "/:id/approve",
  authGuard,
  permissionGuard("leave.approve"),
  leaveController.approveLeave,
);

router.patch(
  "/:id/reject",
  authGuard,
  permissionGuard("leave.reject"),
  leaveController.rejectLeave,
);

router.post(
  "/bulk-approve",
  authGuard,
  permissionGuard("leave.bulk_approve"),
  leaveController.bulkApprove,
);

// leave policy endpoints
router.post(
  "/policy",
  authGuard,
  permissionGuard("leave.policy_create"),
  leaveController.createPolicy,
);

router.put(
  "/policy/:id",
  authGuard,
  permissionGuard("leave.policy_update"),
  leaveController.updatePolicy,
);

router.delete(
  "/policy/:id",
  authGuard,
  permissionGuard("leave.policy_delete"),
  leaveController.deletePolicy,
);

router.get(
  "/policy",
  authGuard,
  permissionGuard("leave.policy_view"),
  leaveController.viewPolicies,
);

// balance endpoints
router.get(
  "/balance",
  authGuard,
  permissionGuard("leave.balance_view"),
  leaveController.viewBalance,
);

router.patch(
  "/balance",
  authGuard,
  permissionGuard("leave.balance_adjust"),
  leaveController.adjustBalance,
);

export default router;
