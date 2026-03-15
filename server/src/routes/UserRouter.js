import express from "express";
import userController from "../controllers/UserController.js";
import authGuard from "../middleware/authGuard.js";
import roleGuard from "../middleware/roleGuard.js";

const router = express.Router();

// Create user - accessible by SUPER_ADMIN and HR_ADMIN
// The userService will enforce role creation permissions
router.post(
  "/create-user",
  authGuard,
  roleGuard("SUPER_ADMIN", "HR_ADMIN"),
  userController.createUser,
);

router.get(
  "/employees",
  authGuard,
  roleGuard("SUPER_ADMIN", "HR_ADMIN", "MANAGER"),
  userController.getEmployees,
);

// Admin reset employee login password
router.post(
  "/:employeeId/reset-password",
  authGuard,
  roleGuard("SUPER_ADMIN", "HR_ADMIN"),
  userController.adminResetPassword,
);

export default router;
