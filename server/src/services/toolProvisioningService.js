import mongoose from "mongoose";
import Employee from "../models/Employee.js";
import Project from "../models/Project.js";
import ToolProvisioningTicket from "../models/ToolProvisioningTicket.js";
import User from "../models/User.js";
import {
  createNotification,
  createBulkNotifications,
} from "../controllers/NotificationController.js";

export const parseItNotificationRoles = () => {
  const raw = process.env.IT_NOTIFICATION_ROLES || "SUPER_ADMIN";
  return raw
    .split(",")
    .map((role) => role.trim().toUpperCase())
    .filter(Boolean);
};

const parseItRoles = () => parseItNotificationRoles();

const findUserIdForEmployee = async (employeeId) => {
  if (!employeeId) {
    return null;
  }
  const user = await User.findOne({ employeeId }).select("_id").lean();
  return user?._id || null;
};

const notifyItUsers = async (notificationsData, triggeredByUserId) => {
  const roles = parseItRoles();
  const itUsers = await User.find({ role: { $in: roles }, isActive: true }).select("_id").lean();
  if (itUsers.length === 0) {
    return [];
  }
  const actor = triggeredByUserId ? { id: triggeredByUserId } : null;
  const rows = itUsers.map((u) => ({
    ...notificationsData,
    userId: u._id,
  }));
  return createBulkNotifications(rows, actor);
};

const employeeDisplayName = (emp) => {
  if (!emp) {
    return "Employee";
  }
  const parts = [emp.firstName, emp.middleName, emp.lastName].filter(Boolean);
  return parts.join(" ").trim() || emp.email || "Employee";
};

/**
 * After a new hire is committed, optionally create a tool provisioning ticket when assigned to a project.
 */
export const maybeProvisionToolsAfterHire = async ({
  employeeId,
  assignedProjectId,
  triggeredByUserId,
  context = "hire",
}) => {
  if (!assignedProjectId || !mongoose.Types.ObjectId.isValid(String(assignedProjectId))) {
    return null;
  }

  const project = await Project.findOne({
    _id: assignedProjectId,
    isActive: true,
  }).lean();

  if (!project || !Array.isArray(project.requiredTools) || project.requiredTools.length === 0) {
    return null;
  }

  const employee = await Employee.findById(employeeId).lean();
  if (!employee) {
    return null;
  }

  const existingTicket = await ToolProvisioningTicket.findOne({
    employeeId: employee._id,
    projectId: project._id,
    status: { $nin: ["CANCELLED", "COMPLETED"] },
  }).lean();

  if (existingTicket) {
    return existingTicket;
  }

  const isAssignment = context === "assignment";

  const reportingManagerEmployeeId = employee.managerID || employee.managerId || null;
  const toolsSnapshot = project.requiredTools.map((t) => ({
    name: String(t.name || "").trim(),
    notes: String(t.notes || "").trim(),
  })).filter((t) => t.name);

  if (toolsSnapshot.length === 0) {
    return null;
  }

  const hasManager = Boolean(reportingManagerEmployeeId);
  const initialStatus = hasManager ? "PENDING_MANAGER_APPROVAL" : "APPROVED";

  const ticket = await ToolProvisioningTicket.create({
    employeeId: employee._id,
    projectId: project._id,
    reportingManagerEmployeeId,
    requiredToolsSnapshot: toolsSnapshot,
    status: initialStatus,
    ...(hasManager
      ? {}
      : {
          approvedAt: new Date(),
          approvedByUserId: null,
        }),
  });

  const empName = employeeDisplayName(employee);
  const projectName = project.name || "Project";
  const toolList = toolsSnapshot.map((t) => t.name).join(", ");
  const actor = triggeredByUserId ? { id: triggeredByUserId } : null;

  if (hasManager) {
    const managerUserId = await findUserIdForEmployee(reportingManagerEmployeeId);
    if (managerUserId) {
      await createNotification(
        {
          userId: managerUserId,
          type: "tool_provisioning_manager_review",
          title: isAssignment
            ? "Approve project tools after reassignment"
            : "Approve project tools for new hire",
          message: isAssignment
            ? `${empName} was reassigned to "${projectName}". Please approve the IT tooling ticket so required tools can be installed (${toolList}).`
            : `${empName} was assigned to "${projectName}". Please approve the IT tooling ticket so required tools can be installed (${toolList}).`,
          priority: "high",
          category: "approval",
          referenceType: "provisioning_ticket",
          referenceId: ticket._id,
          actionUrl: `/manager/tool-provisioning/${ticket._id}`,
          metadata: {
            employeeId: String(employee._id),
            projectId: String(project._id),
            ticketId: String(ticket._id),
          },
          triggeredBy: triggeredByUserId || undefined,
        },
        actor,
      );
    }

    await notifyItUsers(
      {
        type: "tool_provisioning_it_awareness",
        title: isAssignment
          ? "Employee reassignment tooling ticket (awaiting manager)"
          : "New hire tooling ticket (awaiting manager)",
        message: `${empName} — project "${projectName}". Tools: ${toolList}. Awaiting reporting manager approval before installation.`,
        priority: "medium",
        category: "administrative",
        referenceType: "provisioning_ticket",
        referenceId: ticket._id,
        actionUrl: `/it/tool-provisioning/${ticket._id}`,
        metadata: {
          employeeId: String(employee._id),
          projectId: String(project._id),
          ticketId: String(ticket._id),
        },
        triggeredBy: triggeredByUserId || undefined,
      },
      triggeredByUserId,
    );
  } else {
    await notifyItUsers(
      {
        type: "tool_provisioning_it_install",
        title: isAssignment
          ? "Install approved tools after reassignment"
          : "Install approved tools for new hire",
        message: `${empName} has no reporting manager on file; ticket auto-approved. Project "${projectName}". Install: ${toolList}.`,
        priority: "high",
        category: "administrative",
        referenceType: "provisioning_ticket",
        referenceId: ticket._id,
        actionUrl: `/it/tool-provisioning/${ticket._id}`,
        metadata: {
          employeeId: String(employee._id),
          projectId: String(project._id),
          ticketId: String(ticket._id),
        },
        triggeredBy: triggeredByUserId || undefined,
      },
      triggeredByUserId,
    );
  }

  return ticket;
};

const ELEVATED_APPROVER_ROLES = new Set(["SUPER_ADMIN", "HR_ADMIN", "DEPT_ADMIN"]);

const assertApproverCanActOnTicket = (ticket, { approverEmployeeId, approverRole }) => {
  const role = String(approverRole || "").toUpperCase();

  if (ELEVATED_APPROVER_ROLES.has(role)) {
    return;
  }

  if (role !== "MANAGER") {
    const error = new Error("You do not have permission to act on this ticket");
    error.statusCode = 403;
    throw error;
  }

  if (!ticket.reportingManagerEmployeeId) {
    const error = new Error("This ticket has no reporting manager step");
    error.statusCode = 400;
    throw error;
  }

  if (!approverEmployeeId) {
    const error = new Error(
      "Your account must be linked to an employee profile to approve as reporting manager",
    );
    error.statusCode = 403;
    throw error;
  }

  if (String(ticket.reportingManagerEmployeeId) !== String(approverEmployeeId)) {
    const error = new Error(
      "Only the employee's reporting manager can approve this ticket",
    );
    error.statusCode = 403;
    throw error;
  }
};

export const approveToolProvisioningTicket = async ({
  ticketId,
  approverUserId,
  approverEmployeeId,
  approverRole,
}) => {
  const ticket = await ToolProvisioningTicket.findById(ticketId)
    .populate("employeeId", "firstName middleName lastName email")
    .populate("projectId", "name")
    .lean();

  if (!ticket) {
    const error = new Error("Ticket not found");
    error.statusCode = 404;
    throw error;
  }

  if (ticket.status !== "PENDING_MANAGER_APPROVAL") {
    const error = new Error("Ticket is not awaiting manager approval");
    error.statusCode = 400;
    throw error;
  }

  assertApproverCanActOnTicket(ticket, { approverEmployeeId, approverRole });

  await ToolProvisioningTicket.updateOne(
    { _id: ticketId },
    {
      $set: {
        status: "APPROVED",
        approvedByUserId: approverUserId,
        approvedAt: new Date(),
      },
    },
  );

  const emp = ticket.employeeId;
  const empName = employeeDisplayName(emp);
  const projectName = ticket.projectId?.name || "Project";
  const toolList = (ticket.requiredToolsSnapshot || []).map((t) => t.name).join(", ");

  await notifyItUsers(
    {
      type: "tool_provisioning_it_install",
      title: "Install approved tools for employee",
      message: `Manager approved tooling for ${empName} on "${projectName}". Install: ${toolList}.`,
      priority: "high",
      category: "administrative",
      referenceType: "provisioning_ticket",
      referenceId: ticket._id,
      actionUrl: `/it/tool-provisioning/${ticket._id}`,
      metadata: {
        employeeId: String(ticket.employeeId?._id || ticket.employeeId),
        ticketId: String(ticket._id),
      },
      triggeredBy: approverUserId,
    },
    approverUserId,
  );

  return ToolProvisioningTicket.findById(ticketId).lean();
};

export const rejectToolProvisioningTicket = async ({
  ticketId,
  approverUserId,
  approverEmployeeId,
  approverRole,
  reason,
}) => {
  const ticket = await ToolProvisioningTicket.findById(ticketId).lean();

  if (!ticket) {
    const error = new Error("Ticket not found");
    error.statusCode = 404;
    throw error;
  }

  if (ticket.status !== "PENDING_MANAGER_APPROVAL") {
    const error = new Error("Ticket is not awaiting manager approval");
    error.statusCode = 400;
    throw error;
  }

  assertApproverCanActOnTicket(ticket, { approverEmployeeId, approverRole });

  await ToolProvisioningTicket.updateOne(
    { _id: ticketId },
    {
      $set: {
        status: "REJECTED",
        rejectedByUserId: approverUserId,
        rejectedAt: new Date(),
        rejectionReason: String(reason || "").trim(),
      },
    },
  );

  return ToolProvisioningTicket.findById(ticketId).lean();
};
