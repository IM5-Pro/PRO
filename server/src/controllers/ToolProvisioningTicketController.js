import User from "../models/User.js";
import ToolProvisioningTicket from "../models/ToolProvisioningTicket.js";
import { sendError, sendSuccess } from "../utils/response.js";
import {
  approveToolProvisioningTicket,
  rejectToolProvisioningTicket,
  parseItNotificationRoles,
} from "../services/toolProvisioningService.js";

const resolveAuthEmployeeId = async (userId) => {
  const user = await User.findById(userId).select("employeeId role").lean();
  return user?.employeeId || null;
};

const userCanViewTicket = async (req, ticket) => {
  const role = req.user.role;
  if (role === "SUPER_ADMIN" || role === "HR_ADMIN") {
    return true;
  }
  const itRoles = parseItNotificationRoles();
  if (itRoles.includes(String(role || "").toUpperCase())) {
    return true;
  }
  if (role === "MANAGER") {
    const empId = await resolveAuthEmployeeId(req.user.id);
    if (empId && ticket.reportingManagerEmployeeId) {
      return String(ticket.reportingManagerEmployeeId) === String(empId);
    }
  }
  return false;
};

export const listToolProvisioningTickets = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    const role = String(req.user.role || "").toUpperCase();
    if (role === "MANAGER") {
      const empId = await resolveAuthEmployeeId(req.user.id);
      if (!empId) {
        return sendError(res, 403, "Manager employee profile is required");
      }
      filter.reportingManagerEmployeeId = empId;
    }
    const tickets = await ToolProvisioningTicket.find(filter)
      .populate("employeeId", "firstName middleName lastName email employeeCode department")
      .populate("projectId", "name code requiredTools")
      .sort({ createdAt: -1 })
      .lean();
    return sendSuccess(res, 200, "Tickets retrieved", { data: tickets });
  } catch (err) {
    return sendError(res, 500, "Failed to list tickets", { error: err.message });
  }
};

export const listPendingApprovalsForManager = async (req, res) => {
  try {
    const empId = await resolveAuthEmployeeId(req.user.id);
    if (!empId) {
      return sendError(res, 403, "Manager employee profile is required");
    }
    const tickets = await ToolProvisioningTicket.find({
      reportingManagerEmployeeId: empId,
      status: "PENDING_MANAGER_APPROVAL",
    })
      .populate("employeeId", "firstName middleName lastName email employeeCode")
      .populate("projectId", "name code")
      .sort({ createdAt: -1 })
      .lean();
    return sendSuccess(res, 200, "Pending tickets", { data: tickets });
  } catch (err) {
    return sendError(res, 500, "Failed to list tickets", { error: err.message });
  }
};

export const getTicket = async (req, res) => {
  try {
    const ticket = await ToolProvisioningTicket.findById(req.params.ticketId)
      .populate("employeeId", "firstName middleName lastName email employeeCode department")
      .populate("projectId", "name code requiredTools")
      .lean();
    if (!ticket) {
      return sendError(res, 404, "Ticket not found");
    }
    const allowed = await userCanViewTicket(req, ticket);
    if (!allowed) {
      return sendError(res, 403, "Access denied");
    }
    return sendSuccess(res, 200, "Ticket retrieved", { data: ticket });
  } catch (err) {
    return sendError(res, 500, "Failed to get ticket", { error: err.message });
  }
};

export const approveTicket = async (req, res) => {
  try {
    const approverEmployeeId = await resolveAuthEmployeeId(req.user.id);
    const updated = await approveToolProvisioningTicket({
      ticketId: req.params.ticketId,
      approverUserId: req.user.id,
      approverEmployeeId,
    });
    return sendSuccess(res, 200, "Ticket approved", { data: updated });
  } catch (err) {
    const status = err.statusCode || 500;
    return sendError(res, status, err.message || "Approval failed");
  }
};

export const rejectTicket = async (req, res) => {
  try {
    const approverEmployeeId = await resolveAuthEmployeeId(req.user.id);
    const updated = await rejectToolProvisioningTicket({
      ticketId: req.params.ticketId,
      approverUserId: req.user.id,
      approverEmployeeId,
      reason: req.body?.reason,
    });
    return sendSuccess(res, 200, "Ticket rejected", { data: updated });
  } catch (err) {
    const status = err.statusCode || 500;
    return sendError(res, status, err.message || "Rejection failed");
  }
};
