import express from "express";
import userController from "../controllers/UserController.js";
import authGuard from "../middleware/authGuard.js";
import roleGuard from "../middleware/roleGuard.js";
import permissionGuard from "../middleware/permissionGuard.js";

const router = express.Router();

router.post(
  "/create",
  authGuard,
  // either role-based or permission-based check can be used
  // roleGuard("SUPER_ADMIN", "HR_ADMIN"),
  permissionGuard("user.create"),
  userController.createUser,
);

router.get(
  "/employees",
  authGuard,
  roleGuard("SUPER_ADMIN", "HR_ADMIN", "MANAGER"),
  userController.getEmployees,
);

export default router;
