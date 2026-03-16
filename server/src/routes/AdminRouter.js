import express from "express";
import adminController from "../controllers/AdminController.js";
import authGuard from "../middleware/authGuard.js";
import { permissionGuard } from "../middleware/permissionGuard.js";

const router = express.Router();

router.get(
	"/audit-logs",
	authGuard,
	permissionGuard("audit_logs", "view"),
	adminController.getAuditLogs,
);

export default router;
