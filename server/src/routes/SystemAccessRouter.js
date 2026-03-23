import express from "express";
import authGuard from "../middleware/authGuard.js";
import roleGuard from "../middleware/roleGuard.js";
import * as systemAccessController from "../controllers/SystemAccessController.js";

const router = express.Router();

router.get("/:employeeId", authGuard, roleGuard("SUPER_ADMIN", "HR_ADMIN", "DEPT_ADMIN", "MANAGER", "EMPLOYEE"), systemAccessController.getSystemAccess);
router.put("/:employeeId", authGuard, roleGuard("SUPER_ADMIN", "HR_ADMIN"), systemAccessController.updateSystemAccess);

export default router;
