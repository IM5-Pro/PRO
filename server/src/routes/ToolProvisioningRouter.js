import express from "express";
import authGuard from "../middleware/authGuard.js";
import roleGuard from "../middleware/roleGuard.js";
import * as ticketController from "../controllers/ToolProvisioningTicketController.js";

const router = express.Router();

router.get(
  "/",
  authGuard,
  roleGuard("SUPER_ADMIN", "HR_ADMIN", "MANAGER"),
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
  roleGuard("MANAGER"),
  ticketController.approveTicket,
);

router.post(
  "/:ticketId/reject",
  authGuard,
  roleGuard("MANAGER"),
  ticketController.rejectTicket,
);

export default router;
