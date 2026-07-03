import express from "express";
import adminController from "../controllers/AdminController.js";
import authGuard from "../middleware/authGuard.js";
import roleGuard from "../middleware/roleGuard.js";
import { permissionGuard } from "../middleware/permissionGuard.js";

const router = express.Router();
const superAdminOnly = [authGuard, roleGuard("SUPER_ADMIN")];

router.get(
	"/audit-logs",
	authGuard,
	permissionGuard("audit_logs", "view"),
	adminController.getAuditLogs,
);

router.get("/eligible-recipients", superAdminOnly, adminController.getEligibleRecipients);
router.post("/transfer-role", superAdminOnly, adminController.transferRole);
router.get("/transfer-history", superAdminOnly, adminController.getTransferHistory);

export default router;
