import LeaveRequest from "../models/LeaveRequest.js";
import LeaveType from "../models/LeaveType.js";
import EmployeeLeaveBalance from "../models/EmployeeLeaveBalance.js";
import AuditLog from "../models/AuditLog.js";
import Employee from "../models/Employee.js";
import User from "../models/User.js";
import Roles from "../constants/roles.js";
import mongoose from "mongoose";
import { sendError, sendSuccess } from "../utils/response.js";

const ACTIVE_LEAVE_STATUSES = ["PENDING", "APPROVED"];

const DEFAULT_LEAVE_POLICIES = [
  {
    name: "Casual Leave",
    code: "CL",
    totalDays: 12,
    reasonRequired: false,
  },
  {
    name: "Sick Leave",
    code: "SL",
    totalDays: 8,
    reasonRequired: true,
  },
  {
    name: "Earned Leave",
    code: "EL",
    totalDays: 18,
    reasonRequired: false,
  },
];

const ensureDefaultLeavePolicies = async () => {
  const policyCount = await LeaveType.countDocuments();
  if (policyCount > 0) {
    return;
  }

  try {
    await LeaveType.insertMany(DEFAULT_LEAVE_POLICIES, { ordered: false });
  } catch (error) {
    // Safe to ignore duplicate-key race conditions from concurrent bootstraps.
    if (error?.code !== 11000) {
      throw error;
    }
  }
};

const getDayStart = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const getDayEnd = (value) => {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
};

const calculateLeaveDays = (startDate, endDate) => {
  const start = getDayStart(startDate);
  const end = getDayStart(endDate);
  return (end - start) / (1000 * 60 * 60 * 24) + 1;
};

const resolveEmployeeIdFromAuth = async (req) => {
  if (req.user?.employeeId) {
    return req.user.employeeId;
  }

  if (!req.user?.id) {
    return null;
  }

  const authUser = await User.findById(req.user.id).select("employeeId").lean();
  if (authUser?.employeeId) {
    req.user.employeeId = authUser.employeeId;
    return authUser.employeeId;
  }

  return null;
};

const getOrCreateBalance = async ({ employeeId, leaveType, actorId, session }) => {
  let balance = await EmployeeLeaveBalance.findOne({
    employeeId,
    leaveTypeId: leaveType._id,
  }).session(session);

  if (!balance) {
    balance = await EmployeeLeaveBalance.create(
      [
        {
          employeeId,
          leaveTypeId: leaveType._id,
          totalDays: leaveType.totalDays,
          usedDays: 0,
          remainingDays: leaveType.totalDays,
          updatedBy: actorId,
        },
      ],
      { session },
    ).then((docs) => docs[0]);
    return balance;
  }

  if (balance.totalDays !== leaveType.totalDays) {
    balance.totalDays = leaveType.totalDays;
    balance.remainingDays = Math.max(0, leaveType.totalDays - balance.usedDays);
    balance.updatedBy = actorId;
    await balance.save({ session });
  }

  return balance;
};

const validateLeaveWindow = (startDate, endDate) => {
  const start = getDayStart(startDate);
  const end = getDayEnd(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { isValid: false, error: "Invalid startDate or endDate" };
  }

  if (start > end) {
    return { isValid: false, error: "startDate must be before or equal to endDate" };
  }

  return {
    isValid: true,
    start,
    end,
    totalDays: calculateLeaveDays(start, end),
  };
};

const isManagerOfEmployee = async (managerEmployeeId, targetEmployeeId) => {
  const managedRecord = await Employee.findOne({
    _id: targetEmployeeId,
    $or: [
      { manager: managerEmployeeId },
      { managerId: managerEmployeeId },
      { managerID: managerEmployeeId },
    ],
  })
    .select("_id")
    .lean();

  return !!managedRecord;
};

const hasApprovalAccess = async (req, requestOwnerEmployeeId) => {
  const userRole = req.user.role;
  if (userRole === Roles.SUPER_ADMIN || userRole === Roles.HR_ADMIN) {
    return true;
  }

  if (userRole !== Roles.MANAGER) {
    return false;
  }

  const managerEmployeeId = await resolveEmployeeIdFromAuth(req);
  if (!managerEmployeeId) {
    return false;
  }

  return isManagerOfEmployee(managerEmployeeId, requestOwnerEmployeeId);
};

const releaseBalanceDays = async ({ request, actorId, session }) => {
  const balance = await EmployeeLeaveBalance.findOne({
    employeeId: request.employeeId,
    leaveTypeId: request.leaveTypeId,
  }).session(session);

  if (!balance) {
    return;
  }

  const reservedDays =
    typeof request.totalDays === "number"
      ? request.totalDays
      : calculateLeaveDays(request.startDate, request.endDate);

  balance.usedDays = Math.max(0, balance.usedDays - reservedDays);
  balance.remainingDays = Math.max(0, balance.totalDays - balance.usedDays);
  balance.updatedBy = actorId;
  await balance.save({ session });
};

// apply for a leave (create request)
const applyLeave = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { leaveTypeId, startDate, endDate, reason } = req.body;
    const employeeId = await resolveEmployeeIdFromAuth(req);
    if (!employeeId) {
      await session.abortTransaction();
      return sendError(res, 403, "Employee mapping missing for authenticated user");
    }

    const leaveType = await LeaveType.findById(leaveTypeId).session(session);
    if (!leaveType) {
      await session.abortTransaction();
      return sendError(res, 404, "Leave policy not found");
    }

    const normalizedCode = (leaveType.code || "").trim().toUpperCase();
    const normalizedName = (leaveType.name || "").trim().toUpperCase();
    if ((leaveType.reasonRequired || normalizedCode === "SL" || normalizedName === "SL") && !reason?.trim()) {
      await session.abortTransaction();
      return sendError(res, 400, "Reason is required for this leave type");
    }

    const leaveWindow = validateLeaveWindow(startDate, endDate);
    if (!leaveWindow.isValid) {
      await session.abortTransaction();
      return sendError(res, 400, leaveWindow.error);
    }

    const overlap = await LeaveRequest.findOne({
      employeeId,
      status: { $in: ACTIVE_LEAVE_STATUSES },
      startDate: { $lte: leaveWindow.end },
      endDate: { $gte: leaveWindow.start },
    }).session(session);

    if (overlap) {
      await session.abortTransaction();
      return sendError(res, 409, "Requested leave overlaps with an existing request");
    }

    const balance = await getOrCreateBalance({
      employeeId,
      leaveType,
      actorId: req.user.id,
      session,
    });

    if (balance.remainingDays < leaveWindow.totalDays) {
      await session.abortTransaction();
      return sendError(res, 400, "Insufficient leave balance", {
        availableDays: balance.remainingDays,
        requestedDays: leaveWindow.totalDays,
      });
    }

    const request = await LeaveRequest.create(
      [
        {
          employeeId,
          leaveTypeId,
          startDate: leaveWindow.start,
          endDate: leaveWindow.end,
          totalDays: leaveWindow.totalDays,
          reason,
        },
      ],
      { session },
    ).then((docs) => docs[0]);

    balance.usedDays += leaveWindow.totalDays;
    balance.remainingDays = Math.max(0, balance.totalDays - balance.usedDays);
    balance.updatedBy = req.user.id;
    await balance.save({ session });

    await AuditLog.create(
      [
        {
          userId: req.user.id,
          action: "LEAVE_APPLY",
          entityType: "LeaveRequest",
          entityId: request._id.toString(),
          description: `Applied ${leaveWindow.totalDays} day(s) leave`,
        },
      ],
      { session },
    );

    await session.commitTransaction();

    return sendSuccess(res, 200, "Leave applied successfully", { data: request });
  } catch (err) {
    await session.abortTransaction();
    return sendError(res, 500, "Internal server error", { error: err.message });
  } finally {
    session.endSession();
  }
};

// cancel a leave (delete or set status)
const cancelLeave = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const request = await LeaveRequest.findById(req.params.id).session(session);
    if (!request) {
      await session.abortTransaction();
      return sendError(res, 404, "Request not found");
    }

    const employeeId = await resolveEmployeeIdFromAuth(req);
    const canManageAll = req.user.role === Roles.SUPER_ADMIN || req.user.role === Roles.HR_ADMIN;
    if (!canManageAll && String(request.employeeId) !== String(employeeId)) {
      await session.abortTransaction();
      return sendError(res, 403, "You can cancel only your own leave request");
    }

    if (request.status === "CANCELLED") {
      await session.abortTransaction();
      return sendError(res, 400, "Request is already cancelled");
    }

    if (request.status === "REJECTED") {
      await session.abortTransaction();
      return sendError(res, 400, "Rejected request cannot be cancelled");
    }

    request.status = "CANCELLED";
    request.approvedBy = req.user.id;
    request.approvalDate = new Date();
    await request.save({ session });

    await releaseBalanceDays({ request, actorId: req.user.id, session });

    await AuditLog.create(
      [
        {
          userId: req.user.id,
          action: "LEAVE_CANCEL",
          entityType: "LeaveRequest",
          entityId: request._id.toString(),
          description: "Cancelled leave request",
        },
      ],
      { session },
    );

    await session.commitTransaction();
    return sendSuccess(res, 200, "Leave cancelled successfully", { data: request });
  } catch (err) {
    await session.abortTransaction();
    return sendError(res, 500, "Internal server error", { error: err.message });
  } finally {
    session.endSession();
  }
};

// update a leave request (before approval)
const updateLeave = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { startDate, endDate, reason, leaveTypeId } = req.body;
    const request = await LeaveRequest.findById(req.params.id).session(session);
    if (!request) {
      await session.abortTransaction();
      return sendError(res, 404, "Request not found");
    }

    const employeeId = await resolveEmployeeIdFromAuth(req);
    const canManageAll = req.user.role === Roles.SUPER_ADMIN || req.user.role === Roles.HR_ADMIN;
    if (!canManageAll && String(request.employeeId) !== String(employeeId)) {
      await session.abortTransaction();
      return sendError(res, 403, "You can update only your own leave request");
    }

    if (request.status !== "PENDING") {
      await session.abortTransaction();
      return sendError(res, 400, "Only pending leave requests can be updated");
    }

    const leaveType = await LeaveType.findById(leaveTypeId || request.leaveTypeId).session(session);
    if (!leaveType) {
      await session.abortTransaction();
      return sendError(res, 404, "Leave policy not found");
    }

    const normalizedCode = (leaveType.code || "").trim().toUpperCase();
    const normalizedName = (leaveType.name || "").trim().toUpperCase();
    const finalReason = reason !== undefined ? reason : request.reason;
    if ((leaveType.reasonRequired || normalizedCode === "SL" || normalizedName === "SL") && !finalReason?.trim()) {
      await session.abortTransaction();
      return sendError(res, 400, "Reason is required for this leave type");
    }

    const finalStartDate = startDate || request.startDate;
    const finalEndDate = endDate || request.endDate;
    const leaveWindow = validateLeaveWindow(finalStartDate, finalEndDate);
    if (!leaveWindow.isValid) {
      await session.abortTransaction();
      return sendError(res, 400, leaveWindow.error);
    }

    const overlap = await LeaveRequest.findOne({
      _id: { $ne: request._id },
      employeeId: request.employeeId,
      status: { $in: ACTIVE_LEAVE_STATUSES },
      startDate: { $lte: leaveWindow.end },
      endDate: { $gte: leaveWindow.start },
    }).session(session);

    if (overlap) {
      await session.abortTransaction();
      return sendError(res, 409, "Updated leave overlaps with an existing request");
    }

    const previousDays =
      typeof request.totalDays === "number"
        ? request.totalDays
        : calculateLeaveDays(request.startDate, request.endDate);
    const newDays = leaveWindow.totalDays;

    const isLeaveTypeChanged = String(request.leaveTypeId) !== String(leaveType._id);
    if (!isLeaveTypeChanged) {
      const dayDelta = newDays - previousDays;

      const balance = await getOrCreateBalance({
        employeeId: request.employeeId,
        leaveType,
        actorId: req.user.id,
        session,
      });

      if (dayDelta > 0 && balance.remainingDays < dayDelta) {
        await session.abortTransaction();
        return sendError(res, 400, "Insufficient leave balance for update", {
          availableDays: balance.remainingDays,
          additionalDaysRequired: dayDelta,
        });
      }

      balance.usedDays = Math.max(0, balance.usedDays + dayDelta);
      balance.remainingDays = Math.max(0, balance.totalDays - balance.usedDays);
      balance.updatedBy = req.user.id;
      await balance.save({ session });
    } else {
      const oldLeaveType = await LeaveType.findById(request.leaveTypeId).session(session);

      if (oldLeaveType) {
        const oldBalance = await getOrCreateBalance({
          employeeId: request.employeeId,
          leaveType: oldLeaveType,
          actorId: req.user.id,
          session,
        });

        oldBalance.usedDays = Math.max(0, oldBalance.usedDays - previousDays);
        oldBalance.remainingDays = Math.max(0, oldBalance.totalDays - oldBalance.usedDays);
        oldBalance.updatedBy = req.user.id;
        await oldBalance.save({ session });
      }

      const newBalance = await getOrCreateBalance({
        employeeId: request.employeeId,
        leaveType,
        actorId: req.user.id,
        session,
      });

      if (newBalance.remainingDays < newDays) {
        await session.abortTransaction();
        return sendError(res, 400, "Insufficient leave balance for updated leave type", {
          availableDays: newBalance.remainingDays,
          requestedDays: newDays,
        });
      }

      newBalance.usedDays += newDays;
      newBalance.remainingDays = Math.max(0, newBalance.totalDays - newBalance.usedDays);
      newBalance.updatedBy = req.user.id;
      await newBalance.save({ session });
    }

    request.startDate = leaveWindow.start;
    request.endDate = leaveWindow.end;
    request.totalDays = newDays;
    request.reason = finalReason;
    request.leaveTypeId = leaveType._id;
    await request.save({ session });

    await AuditLog.create(
      [
        {
          userId: req.user.id,
          action: "LEAVE_UPDATE",
          entityType: "LeaveRequest",
          entityId: request._id.toString(),
          description: "Updated leave request",
        },
      ],
      { session },
    );

    await session.commitTransaction();
    return sendSuccess(res, 200, "Leave updated successfully", { data: request });
  } catch (err) {
    await session.abortTransaction();
    return sendError(res, 500, "Internal server error", { error: err.message });
  } finally {
    session.endSession();
  }
};

// view your own leave requests
const viewOwn = async (req, res) => {
  try {
    const employeeId = await resolveEmployeeIdFromAuth(req);
    if (!employeeId) {
      return sendError(res, 403, "Employee mapping missing for authenticated user");
    }

    const requests = await LeaveRequest.find({ employeeId })
      .populate("leaveTypeId", "name code totalDays reasonRequired")
      .populate("approvedBy", "firstName lastName email")
      .sort({ createdAt: -1 });
    return sendSuccess(res, 200, "Leave requests retrieved successfully", { data: requests });
  } catch (err) {
    return sendError(res, 500, "Internal server error", { error: err.message });
  }
};

// view team leave requests (for managers); basic implementation returns all pending for now
const viewTeam = async (req, res) => {
  try {
    if (req.user.role === Roles.SUPER_ADMIN || req.user.role === Roles.HR_ADMIN) {
      const requests = await LeaveRequest.find()
        .populate("employeeId", "firstName lastName email")
        .populate("leaveTypeId", "name code")
        .sort({ createdAt: -1 });
      return sendSuccess(res, 200, "Team leave requests retrieved successfully", { data: requests });
    }

    const managerEmployeeId = await resolveEmployeeIdFromAuth(req);
    if (!managerEmployeeId) {
      return sendError(res, 403, "Manager account is not linked to an employee");
    }

    const team = await Employee.find(
      {
        $or: [
          { manager: managerEmployeeId },
          { managerId: managerEmployeeId },
          { managerID: managerEmployeeId },
        ],
      },
      { _id: 1 },
    ).lean();

    const teamIds = team.map((employee) => employee._id);

    const requests = await LeaveRequest.find({ employeeId: { $in: teamIds } })
      .populate("employeeId", "firstName lastName email")
      .populate("leaveTypeId", "name code")
      .populate("approvedBy", "firstName lastName email")
      .sort({ createdAt: -1 });
    return sendSuccess(res, 200, "Team leave requests retrieved successfully", { data: requests });
  } catch (err) {
    return sendError(res, 500, "Internal server error", { error: err.message });
  }
};

// view all leave requests (HR or superadmin)
const viewAll = async (req, res) => {
  try {
    if (req.user.role !== Roles.SUPER_ADMIN && req.user.role !== Roles.HR_ADMIN) {
      return sendError(res, 403, "Only HR Admin and Super Admin can view all leave requests");
    }

    const requests = await LeaveRequest.find()
      .populate("employeeId", "firstName lastName email")
      .populate("leaveTypeId", "name code")
      .populate("approvedBy", "firstName lastName email")
      .sort({ createdAt: -1 });
    return sendSuccess(res, 200, "All leave requests retrieved successfully", { data: requests });
  } catch (err) {
    return sendError(res, 500, "Internal server error", { error: err.message });
  }
};

// approve a leave request
const approveLeave = async (req, res) => {
  try {
    const request = await LeaveRequest.findById(req.params.id);
    if (!request) {
      return sendError(res, 404, "Request not found");
    }

    const canApprove = await hasApprovalAccess(req, request.employeeId);
    if (!canApprove) {
      return sendError(res, 403, "You are not allowed to approve this leave request");
    }

    if (request.status !== "PENDING") {
      return sendError(res, 400, "Only pending requests can be approved");
    }

    request.status = "APPROVED";
    request.approvedBy = req.user.id;
    request.approvalDate = new Date();
    await request.save();

    await AuditLog.create({
      userId: req.user.id,
      action: "LEAVE_APPROVE",
      entityType: "LeaveRequest",
      entityId: request._id.toString(),
      description: "Approved leave request",
    });

    return sendSuccess(res, 200, "Leave approved successfully", { data: request });
  } catch (err) {
    return sendError(res, 500, "Internal server error", { error: err.message });
  }
};

// reject a leave request
const rejectLeave = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const request = await LeaveRequest.findById(req.params.id).session(session);
    if (!request) {
      await session.abortTransaction();
      return sendError(res, 404, "Request not found");
    }

    const canReject = await hasApprovalAccess(req, request.employeeId);
    if (!canReject) {
      await session.abortTransaction();
      return sendError(res, 403, "You are not allowed to reject this leave request");
    }

    if (request.status !== "PENDING") {
      await session.abortTransaction();
      return sendError(res, 400, "Only pending requests can be rejected");
    }

    request.status = "REJECTED";
    request.approvedBy = req.user.id;
    request.approvalDate = new Date();
    await request.save({ session });

    await releaseBalanceDays({ request, actorId: req.user.id, session });

    await AuditLog.create(
      [
        {
          userId: req.user.id,
          action: "LEAVE_REJECT",
          entityType: "LeaveRequest",
          entityId: request._id.toString(),
          description: "Rejected leave request",
        },
      ],
      { session },
    );

    await session.commitTransaction();
    return sendSuccess(res, 200, "Leave rejected successfully", { data: request });
  } catch (err) {
    await session.abortTransaction();
    return sendError(res, 500, "Internal server error", { error: err.message });
  } finally {
    session.endSession();
  }
};

// bulk approve requests by ids array
const bulkApprove = async (req, res) => {
  try {
    const { ids } = req.body; // expect array of request ids
    if (!Array.isArray(ids) || ids.length === 0) {
      return sendError(res, 400, "ids must be a non-empty array");
    }

    const pendingRequests = await LeaveRequest.find({
      _id: { $in: ids },
      status: "PENDING",
    }).select("_id employeeId");

    let allowedIds = pendingRequests.map((request) => request._id);

    if (req.user.role === Roles.MANAGER) {
      const managerEmployeeId = await resolveEmployeeIdFromAuth(req);
      if (!managerEmployeeId) {
        return sendError(res, 403, "Manager account is not linked to an employee");
      }

      const allowed = [];
      for (const request of pendingRequests) {
        const isTeamMember = await isManagerOfEmployee(managerEmployeeId, request.employeeId);
        if (isTeamMember) {
          allowed.push(request._id);
        }
      }
      allowedIds = allowed;
    }

    const result = await LeaveRequest.updateMany(
      { _id: { $in: allowedIds }, status: "PENDING" },
      { $set: { status: "APPROVED", approvedBy: req.user.id, approvalDate: new Date() } },
    );

    await AuditLog.create({
      userId: req.user.id,
      action: "LEAVE_BULK_APPROVE",
      entityType: "LeaveRequest",
      entityId: "bulk",
      description: `Bulk approved ${result.modifiedCount || 0} leave requests`,
    });

    return sendSuccess(res, 200, "Bulk approval completed", { data: result });
  } catch (err) {
    return sendError(res, 500, "Internal server error", { error: err.message });
  }
};

// leave policy (type) operations
const createPolicy = async (req, res) => {
  try {
    if (req.user.role !== Roles.SUPER_ADMIN && req.user.role !== Roles.HR_ADMIN) {
      return sendError(res, 403, "Only HR Admin and Super Admin can manage policies");
    }

    const { name, totalDays, code = "", reasonRequired = false } = req.body;

    if (!name || typeof name !== "string") {
      return sendError(res, 400, "name is required");
    }
    if (typeof totalDays !== "number" || totalDays < 0) {
      return sendError(res, 400, "totalDays must be a non-negative number");
    }

    const policy = await LeaveType.create({
      name: name.trim(),
      totalDays,
      code: code ? String(code).trim().toUpperCase() : "",
      reasonRequired,
    });
    return sendSuccess(res, 201, "Leave policy created successfully", { data: policy });
  } catch (err) {
    if (err?.code === 11000) {
      return sendError(res, 409, "Policy with same name or code already exists");
    }
    return sendError(res, 500, "Internal server error", { error: err.message });
  }
};

const updatePolicy = async (req, res) => {
  try {
    if (req.user.role !== Roles.SUPER_ADMIN && req.user.role !== Roles.HR_ADMIN) {
      return sendError(res, 403, "Only HR Admin and Super Admin can manage policies");
    }

    const { name, totalDays, code, reasonRequired } = req.body;
    const update = {};

    if (name !== undefined) {
      if (!name || typeof name !== "string") {
        return sendError(res, 400, "name must be a non-empty string");
      }
      update.name = name.trim();
    }

    if (totalDays !== undefined) {
      if (typeof totalDays !== "number" || totalDays < 0) {
        return sendError(res, 400, "totalDays must be a non-negative number");
      }
      update.totalDays = totalDays;
    }

    if (code !== undefined) {
      update.code = code ? String(code).trim().toUpperCase() : "";
    }

    if (reasonRequired !== undefined) {
      update.reasonRequired = !!reasonRequired;
    }

    const policy = await LeaveType.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true },
    );
    if (!policy) return sendError(res, 404, "Policy not found");
    return sendSuccess(res, 200, "Leave policy updated successfully", { data: policy });
  } catch (err) {
    if (err?.code === 11000) {
      return sendError(res, 409, "Policy with same name or code already exists");
    }
    return sendError(res, 500, "Internal server error", { error: err.message });
  }
};

const deletePolicy = async (req, res) => {
  try {
    if (req.user.role !== Roles.SUPER_ADMIN && req.user.role !== Roles.HR_ADMIN) {
      return sendError(res, 403, "Only HR Admin and Super Admin can manage policies");
    }

    const policy = await LeaveType.findByIdAndDelete(req.params.id);
    if (!policy) return sendError(res, 404, "Policy not found");
    return sendSuccess(res, 200, "Policy deleted");
  } catch (err) {
    return sendError(res, 500, "Internal server error", { error: err.message });
  }
};

const viewPolicies = async (req, res) => {
  try {
    await ensureDefaultLeavePolicies();
    const policies = await LeaveType.find().sort({ name: 1 });
    return sendSuccess(res, 200, "Leave policies retrieved successfully", { data: policies });
  } catch (err) {
    return sendError(res, 500, "Internal server error", { error: err.message });
  }
};

// leave balance operations
const viewBalance = async (req, res) => {
  try {
    const requestedEmployeeId = req.query.employeeId || null;
    const requesterEmployeeId = await resolveEmployeeIdFromAuth(req);
    const userRole = req.user.role;

    if (!requestedEmployeeId && (userRole === Roles.SUPER_ADMIN || userRole === Roles.HR_ADMIN)) {
      const balances = await EmployeeLeaveBalance.find()
        .populate("employeeId", "firstName lastName email")
        .populate("leaveTypeId", "name code totalDays")
        .sort({ updatedAt: -1 });

      return sendSuccess(res, 200, "Balance retrieved", { data: balances });
    }

    let employeeId = requesterEmployeeId;

    if (requestedEmployeeId) {
      if (userRole === Roles.SUPER_ADMIN || userRole === Roles.HR_ADMIN) {
        employeeId = requestedEmployeeId;
      } else if (userRole === Roles.MANAGER) {
        if (!requesterEmployeeId) {
          return sendError(res, 403, "Manager account is not linked to an employee");
        }

        const isTeamMember = await isManagerOfEmployee(requesterEmployeeId, requestedEmployeeId);
        if (!isTeamMember) {
          return sendError(res, 403, "Requested employee is not part of your team");
        }

        employeeId = requestedEmployeeId;
      } else {
        if (!requesterEmployeeId) {
          return sendError(res, 403, "Employee mapping missing for authenticated user");
        }

        if (String(requestedEmployeeId) !== String(requesterEmployeeId)) {
          return sendError(res, 403, "You are not allowed to view this balance");
        }

        employeeId = requesterEmployeeId;
      }
    }

    if (!employeeId) {
      return sendError(res, 403, "Employee mapping missing for authenticated user");
    }

    const balances = await EmployeeLeaveBalance.find({ employeeId })
      .populate("leaveTypeId", "name code totalDays")
      .sort({ updatedAt: -1 });

    return sendSuccess(res, 200, "Balance retrieved", { data: balances });
  } catch (err) {
    return sendError(res, 500, "Internal server error", { error: err.message });
  }
};

const adjustBalance = async (req, res) => {
  try {
    if (req.user.role !== Roles.SUPER_ADMIN && req.user.role !== Roles.HR_ADMIN) {
      return sendError(res, 403, "Only HR Admin and Super Admin can adjust balances");
    }

    const { employeeId, leaveTypeId, totalDays, usedDays } = req.body;

    if (!employeeId || !leaveTypeId) {
      return sendError(res, 400, "employeeId and leaveTypeId are required");
    }

    const leaveType = await LeaveType.findById(leaveTypeId);
    if (!leaveType) {
      return sendError(res, 404, "Leave policy not found");
    }

    let balance = await EmployeeLeaveBalance.findOne({ employeeId, leaveTypeId });
    if (!balance) {
      balance = await EmployeeLeaveBalance.create({
        employeeId,
        leaveTypeId,
        totalDays: typeof totalDays === "number" ? totalDays : leaveType.totalDays,
        usedDays: typeof usedDays === "number" ? usedDays : 0,
        remainingDays: 0,
        updatedBy: req.user.id,
      });
    } else {
      if (typeof totalDays === "number") {
        balance.totalDays = totalDays;
      }
      if (typeof usedDays === "number") {
        balance.usedDays = Math.max(0, usedDays);
      }
      balance.updatedBy = req.user.id;
    }

    balance.remainingDays = Math.max(0, balance.totalDays - balance.usedDays);
    await balance.save();

    await AuditLog.create({
      userId: req.user.id,
      action: "LEAVE_BALANCE_ADJUST",
      entityType: "EmployeeLeaveBalance",
      entityId: balance._id.toString(),
      description: "Adjusted leave balance",
    });

    return sendSuccess(res, 200, "Balance adjusted", { data: balance });
  } catch (err) {
    return sendError(res, 500, "Internal server error", { error: err.message });
  }
};

export default {
  applyLeave,
  cancelLeave,
  updateLeave,
  viewOwn,
  viewTeam,
  viewAll,
  approveLeave,
  rejectLeave,
  bulkApprove,
  createPolicy,
  updatePolicy,
  deletePolicy,
  viewPolicies,
  viewBalance,
  adjustBalance,
};
