import express from "express";
import authController from "../controllers/AuthController.js";

const router = express.Router();

router.post("/register-superadmin", authController.registerSuperAdmin);

router.post("/login-superadmin", authController.login);
router.post("/login", authController.login);

export default router;