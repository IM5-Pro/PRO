import express from "express";
import authController from "../controllers/AuthController.js";
import Roles from "../constants/roles.js";
import authGuard from "../middleware/authGuard.js";
import roleGuard from "../middleware/roleGuard.js";
import { loginRateLimiter } from "../middleware/rateLimiters.js";

const router = express.Router();

router.post("/register-superadmin", authController.registerSuperAdmin);
router.post(
	"/register-hr-admin",
	authGuard,
	roleGuard(Roles.SUPER_ADMIN, Roles.HR_ADMIN),
	authController.registerHrAdmin,
);

router.post("/login", loginRateLimiter, authController.login);
router.post("/refresh-token", authController.refreshToken);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.post("/logout", authGuard, authController.logout);
router.post("/change-password", authGuard, authController.changePassword);
router.post("/mfa/enable", authGuard, authController.mfaEnable);
router.post("/mfa/disable", authGuard, authController.mfaDisable);
router.get("/sessions", authGuard, authController.sessionView);
router.post("/sessions/terminate", authGuard, authController.sessionTerminate);

export default router;