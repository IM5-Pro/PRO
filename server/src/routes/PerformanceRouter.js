import express from "express";
import performanceController from "../controllers/PerformanceController.js";
import authGuard from "../middleware/authGuard.js";
import {permissionGuard} from "../middleware/permissionGuard.js";

const router = express.Router();

router.get(
  "/reviews",
  authGuard,
  permissionGuard("performance.view_review"),
  performanceController.listReviews,
);

router.get(
  "/goals",
  authGuard,
  permissionGuard("performance.goal_view"),
  performanceController.listGoals,
);

// review endpoints
router.post(
  "/review",
  authGuard,
  permissionGuard("performance.create_review"),
  performanceController.createReview,
);

router.put(
  "/review/:id",
  authGuard,
  permissionGuard("performance.update_review"),
  performanceController.updateReview,
);

router.delete(
  "/review/:id",
  authGuard,
  permissionGuard("performance.delete_review"),
  performanceController.deleteReview,
);

router.get(
  "/review/:id",
  authGuard,
  permissionGuard("performance.view_review"),
  performanceController.viewReview,
);

router.post(
  "/review/:id/submit",
  authGuard,
  permissionGuard("performance.submit_review"),
  performanceController.submitReview,
);

router.patch(
  "/review/:id/approve",
  authGuard,
  permissionGuard("performance.approve_review"),
  performanceController.approveReview,
);

router.patch(
  "/review/:id/reject",
  authGuard,
  permissionGuard("performance.reject_review"),
  performanceController.rejectReview,
);

// goals
router.post(
  "/goal",
  authGuard,
  permissionGuard("performance.goal_create"),
  performanceController.goalCreate,
);

router.put(
  "/goal/:id",
  authGuard,
  permissionGuard("performance.goal_update"),
  performanceController.goalUpdate,
);

router.delete(
  "/goal/:id",
  authGuard,
  permissionGuard("performance.goal_delete"),
  performanceController.goalDelete,
);

router.patch(
  "/goal/:id/assign",
  authGuard,
  permissionGuard("performance.goal_assign"),
  performanceController.goalAssign,
);

router.get(
  "/goal/:id",
  authGuard,
  permissionGuard("performance.goal_view"),
  performanceController.goalView,
);

export default router;
