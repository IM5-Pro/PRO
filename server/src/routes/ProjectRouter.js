import express from "express";
import authGuard from "../middleware/authGuard.js";
import roleGuard from "../middleware/roleGuard.js";
import * as projectController from "../controllers/ProjectController.js";

const router = express.Router();

router.get(
  "/",
  authGuard,
  roleGuard("SUPER_ADMIN", "HR_ADMIN", "DEPT_ADMIN", "MANAGER"),
  projectController.listProjects,
);

router.get(
  "/:projectId",
  authGuard,
  roleGuard("SUPER_ADMIN", "HR_ADMIN", "DEPT_ADMIN", "MANAGER"),
  projectController.getProject,
);

router.post(
  "/",
  authGuard,
  roleGuard("SUPER_ADMIN", "HR_ADMIN"),
  projectController.createProject,
);

router.put(
  "/:projectId",
  authGuard,
  roleGuard("SUPER_ADMIN", "HR_ADMIN"),
  projectController.updateProject,
);

export default router;
