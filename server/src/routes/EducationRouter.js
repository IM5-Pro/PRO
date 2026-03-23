import express from "express";
import authGuard from "../middleware/authGuard.js";
import roleGuard from "../middleware/roleGuard.js";
import * as educationController from "../controllers/EducationController.js";

const router = express.Router();

router.get("/:employeeId", authGuard, roleGuard("SUPER_ADMIN", "HR_ADMIN", "DEPT_ADMIN", "MANAGER", "EMPLOYEE"), educationController.getEducation);
router.post("/:employeeId", authGuard, roleGuard("SUPER_ADMIN", "HR_ADMIN", "EMPLOYEE"), educationController.addEducation);
router.put("/:id", authGuard, roleGuard("SUPER_ADMIN", "HR_ADMIN", "EMPLOYEE"), educationController.updateEducation);
router.delete("/:id", authGuard, roleGuard("SUPER_ADMIN", "HR_ADMIN"), educationController.deleteEducation);

export default router;
