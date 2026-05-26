import express from "express";
import authGuard from "../middleware/authGuard.js";
import roleGuard from "../middleware/roleGuard.js";
import Roles from "../constants/roles.js";
import * as ticketController from "../controllers/ToolProvisioningTicketController.js";

const APPROVER_ROLES = [Roles.MANAGER, Roles.HR_ADMIN, Roles.DEPT_ADMIN];

const router = express.Router();

router.get(
  "/",
  authGuard,
  roleGuard(Roles.SUPER_ADMIN, Roles.HR_ADMIN, Roles.DEPT_ADMIN, Roles.MANAGER),
  ticketController.listToolProvisioningTickets,
);

router.get(
  "/pending-approval",
  authGuard,
  roleGuard("MANAGER"),
  ticketController.listPendingApprovalsForManager,
);

router.get(
  "/:ticketId",
  authGuard,
  ticketController.getTicket,
);

router.post(
  "/:ticketId/approve",
  authGuard,
  roleGuard(...APPROVER_ROLES),
  ticketController.approveTicket,
);

router.post(
  "/:ticketId/reject",
  authGuard,
  roleGuard(...APPROVER_ROLES),
  ticketController.rejectTicket,
);

export default router;
