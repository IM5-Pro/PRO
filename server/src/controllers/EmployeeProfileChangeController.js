import { sendError, sendSuccess } from "../utils/response.js";
import { resolveCurrentEmployeeId } from "../services/employeeContextService.js";
import {
  approveProfileChangeRequest,
  getActiveProfileChangeRequest,
  listPendingProfileChangeRequests,
  rejectProfileChangeRequest,
  saveEmployeeProfileChangeRequest,
} from "../services/employeeProfileChangeService.js";

export const listPendingForHr = async (req, res) => {
  try {
    const limit = Number.parseInt(req.query.limit, 10) || 50;
    const rows = await listPendingProfileChangeRequests({ limit });
    return sendSuccess(res, 200, "Pending profile changes retrieved", { requests: rows });
  } catch (err) {
    console.error("listPendingForHr error:", err);
    return sendError(res, 500, "Failed to list profile change requests", err.message);
  }
};

export const getMyPendingProfileChange = async (req, res) => {
  try {
    const employeeId = await resolveCurrentEmployeeId(req.user.id, req.user.employeeId);
    if (!employeeId) {
      return sendError(res, 403, "Employee profile not linked to this account");
    }
    const request = await getActiveProfileChangeRequest(employeeId);
    return sendSuccess(res, 200, "Profile change status retrieved", { request: request || null });
  } catch (err) {
    console.error("getMyPendingProfileChange error:", err);
    return sendError(res, 500, "Failed to load profile change status", err.message);
  }
};

export const approveRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { remarks } = req.body || {};
    const result = await approveProfileChangeRequest({
      requestId,
      reviewerId: req.user.id,
      remarks,
    });
    return sendSuccess(res, 200, "Profile changes approved", result);
  } catch (err) {
    const status = err.statusCode || 500;
    if (status >= 500) console.error("approveRequest error:", err);
    return sendError(res, status, err.message || "Failed to approve profile changes");
  }
};

export const rejectRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { remarks } = req.body || {};
    const result = await rejectProfileChangeRequest({
      requestId,
      reviewerId: req.user.id,
      remarks,
    });
    return sendSuccess(res, 200, "Profile changes rejected", result);
  } catch (err) {
    const status = err.statusCode || 500;
    if (status >= 500) console.error("rejectRequest error:", err);
    return sendError(res, status, err.message || "Failed to reject profile changes");
  }
};

export const submitProfileUpdateForEmployee = async (req, res) => {
  try {
    const employeeId = await resolveCurrentEmployeeId(req.user.id, req.user.employeeId);
    if (!employeeId) {
      return sendError(res, 403, "Employee profile not linked to this account");
    }

    const submitForApproval = Boolean(req.body?.submitForApproval);
    const { submitForApproval: _omit, ...body } = req.body || {};

    const { request, employee } = await saveEmployeeProfileChangeRequest({
      employeeId,
      userId: req.user.id,
      body,
      submitForApproval,
    });

    const message = submitForApproval
      ? "Profile submitted for HR approval"
      : "Profile draft saved";

    return res.status(200).json({
      success: true,
      message,
      data: employee,
      profileChangeRequest: request,
    });
  } catch (err) {
    if (err.code === 11000) {
      return sendError(res, 409, "A profile change request is already in progress");
    }
    const status = err.statusCode || 500;
    if (status >= 500) console.error("submitProfileUpdateForEmployee error:", err);
    return sendError(res, status, err.message || "Failed to save profile changes");
  }
};
