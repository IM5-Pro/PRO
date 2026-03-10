import express from "express";
import userController from "../controllers/UserController.js";
import authGuard from "../middleware/authGuard.js";
import roleGuard from "../middleware/roleGuard.js";

const router = express.Router();

// Super Admin: Create any user (HR_ADMIN, MANAGER, EMPLOYEE)
router.post(
  "/admin/create-user",
  authGuard,
  roleGuard("SUPER_ADMIN"),
  userController.createUser,
);

// HR Admin: Create MANAGER or EMPLOYEE only
router.post(
  "/hr/create-user",
  authGuard,
  roleGuard("HR_ADMIN"),
  userController.createUser,
);

// Generic create (kept for backward compatibility)
router.post(
  "/create",
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

export default router;
