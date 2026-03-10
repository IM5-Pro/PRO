import express from "express";
import recruitmentController from "../controllers/RecruitmentController.js";
import authGuard from "../middleware/authGuard.js";
import permissionGuard from "../middleware/permissionGuard.js";

const router = express.Router();

// job postings
router.post(
  "/job",
  authGuard,
  permissionGuard("recruitment.create_job"),
  recruitmentController.createJob,
);

router.put(
  "/job/:id",
  authGuard,
  permissionGuard("recruitment.update_job"),
  recruitmentController.updateJob,
);

router.delete(
  "/job/:id",
  authGuard,
  permissionGuard("recruitment.delete_job"),
  recruitmentController.deleteJob,
);

router.get(
  "/job",
  authGuard,
  permissionGuard("recruitment.view_jobs"),
  recruitmentController.viewJobs,
);

// candidate actions
router.post(
  "/candidate/apply",
  authGuard,
  permissionGuard("recruitment.apply_candidate"),
  recruitmentController.applyCandidate,
);

router.put(
  "/candidate/:id",
  authGuard,
  permissionGuard("recruitment.update_candidate"),
  recruitmentController.updateCandidate,
);

router.delete(
  "/candidate/:id",
  authGuard,
  permissionGuard("recruitment.delete_candidate"),
  recruitmentController.deleteCandidate,
);

// interviews
router.post(
  "/interview",
  authGuard,
  permissionGuard("recruitment.schedule_interview"),
  recruitmentController.scheduleInterview,
);

router.put(
  "/interview/:id",
  authGuard,
  permissionGuard("recruitment.update_interview"),
  recruitmentController.updateInterview,
);

// candidate decision
router.patch(
  "/candidate/:id/reject",
  authGuard,
  permissionGuard("recruitment.reject_candidate"),
  recruitmentController.rejectCandidate,
);

router.patch(
  "/candidate/:id/hire",
  authGuard,
  permissionGuard("recruitment.hire_candidate"),
  recruitmentController.hireCandidate,
);

export default router;
