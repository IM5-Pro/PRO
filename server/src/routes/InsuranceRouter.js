import express from "express";
import authGuard from "../middleware/authGuard.js";
import roleGuard from "../middleware/roleGuard.js";
import * as insuranceController from "../controllers/InsuranceController.js";

const router = express.Router();

router.get(
  "/me/context",
  authGuard,
  roleGuard("EMPLOYEE", "MANAGER", "DEPT_ADMIN", "HR_ADMIN", "SUPER_ADMIN"),
  insuranceController.getMyInsuranceContext,
);

router.put(
  "/me/submission",
  authGuard,
  roleGuard("EMPLOYEE", "MANAGER", "DEPT_ADMIN", "HR_ADMIN"),
  insuranceController.saveMyInsuranceSubmission,
);

router.get(
  "/submissions/pending",
  authGuard,
  roleGuard("SUPER_ADMIN", "HR_ADMIN"),
  insuranceController.listPendingSubmissions,
);

router.put(
  "/submissions/:submissionId",
  authGuard,
  roleGuard("SUPER_ADMIN", "HR_ADMIN"),
  insuranceController.updateSubmissionByHr,
);

router.post(
  "/submissions/:submissionId/approve",
  authGuard,
  roleGuard("SUPER_ADMIN", "HR_ADMIN"),
  insuranceController.approveSubmission,
);

router.post(
  "/submissions/:submissionId/reject",
  authGuard,
  roleGuard("SUPER_ADMIN", "HR_ADMIN"),
  insuranceController.rejectSubmission,
);

router.get(
  "/cycles",
  authGuard,
  roleGuard("SUPER_ADMIN", "HR_ADMIN"),
  insuranceController.listCycles,
);

router.post(
  "/cycles",
  authGuard,
  roleGuard("SUPER_ADMIN", "HR_ADMIN"),
  insuranceController.createCycle,
);

router.put(
  "/cycles/:cycleId",
  authGuard,
  roleGuard("SUPER_ADMIN", "HR_ADMIN"),
  insuranceController.updateCycle,
);

router.post(
  "/cycles/:cycleId/close",
  authGuard,
  roleGuard("SUPER_ADMIN", "HR_ADMIN"),
  insuranceController.closeCycle,
);

router.get(
  "/cycles/:cycleId/summary",
  authGuard,
  roleGuard("SUPER_ADMIN", "HR_ADMIN"),
  insuranceController.getCycleSummary,
);

router.get(
  "/cycles/:cycleId/export",
  authGuard,
  roleGuard("SUPER_ADMIN", "HR_ADMIN"),
  insuranceController.exportCycleCsv,
);

export default router;
