import express from "express";
import authGuard from "../middleware/authGuard.js";
import roleGuard from "../middleware/roleGuard.js";
import * as experienceController from "../controllers/ExperienceController.js";

const router = express.Router();

router.get("/:employeeId", authGuard, roleGuard("SUPER_ADMIN", "HR_ADMIN", "DEPT_ADMIN", "MANAGER", "EMPLOYEE"), experienceController.getExperience);
router.post("/:employeeId", authGuard, roleGuard("SUPER_ADMIN", "HR_ADMIN", "EMPLOYEE"), experienceController.addExperience);
router.put("/:id", authGuard, roleGuard("SUPER_ADMIN", "HR_ADMIN", "EMPLOYEE"), experienceController.updateExperience);
router.delete("/:id", authGuard, roleGuard("SUPER_ADMIN", "HR_ADMIN"), experienceController.deleteExperience);

export default router;
