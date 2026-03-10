import LeaveRequest from "../models/LeaveRequest.js";
import LeaveType from "../models/LeaveType.js";
import { sendError, sendSuccess } from "../utils/response.js";

// apply for a leave (create request)
const applyLeave = async (req, res) => {
  try {
    const { leaveTypeId, startDate, endDate, reason } = req.body;
    const employeeId = req.user.id;

    const request = await LeaveRequest.create({
      employeeId,
      leaveTypeId,
      startDate,
      endDate,
      reason,
    });

    return sendSuccess(res, 200, "Leave applied successfully", { data: request });
  } catch (err) {
    return sendError(res, 500, "Internal server error", err);
  }
};

// cancel a leave (delete or set status)
const cancelLeave = async (req, res) => {
  try {
    const request = await LeaveRequest.findByIdAndUpdate(
      req.params.id,
      { $set: { status: "CANCELLED" } },
      { new: true },
    );
    if (!request) return sendError(res, 404, "Request not found");
    return sendSuccess(res, 200, "Leave cancelled successfully", { data: request });
  } catch (err) {
    return sendError(res, 500, "Internal server error", err);
  }
};

// update a leave request (before approval)
const updateLeave = async (req, res) => {
  try {
    const { startDate, endDate, reason, leaveTypeId } = req.body;
    const request = await LeaveRequest.findByIdAndUpdate(
      req.params.id,
      { $set: { startDate, endDate, reason, leaveTypeId } },
      { new: true },
    );
    if (!request) return sendError(res, 404, "Request not found");
    return sendSuccess(res, 200, "Leave updated successfully", { data: request });
  } catch (err) {
    return sendError(res, 500, "Internal server error", err);
  }
};

// view your own leave requests
const viewOwn = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const requests = await LeaveRequest.find({ employeeId });
    return sendSuccess(res, 200, "Leave requests retrieved successfully", { data: requests });
  } catch (err) {
    return sendError(res, 500, "Internal server error", err);
  }
};

// view team leave requests (for managers); basic implementation returns all pending for now
const viewTeam = async (req, res) => {
  try {
    // TODO: filter by manager's team members
    const requests = await LeaveRequest.find();
    return sendSuccess(res, 200, "Team leave requests retrieved successfully", { data: requests });
  } catch (err) {
    return sendError(res, 500, "Internal server error", err);
  }
};

// view all leave requests (HR or superadmin)
const viewAll = async (req, res) => {
  try {
    const requests = await LeaveRequest.find();
    return sendSuccess(res, 200, "All leave requests retrieved successfully", { data: requests });
  } catch (err) {
    return sendError(res, 500, "Internal server error", err);
  }
};

// approve a leave request
const approveLeave = async (req, res) => {
  try {
    const request = await LeaveRequest.findByIdAndUpdate(
      req.params.id,
      { $set: { status: "APPROVED" } },
      { new: true },
    );
    if (!request) return sendError(res, 404, "Request not found");
    return sendSuccess(res, 200, "Leave approved successfully", { data: request });
  } catch (err) {
    return sendError(res, 500, "Internal server error", err);
  }
};

// reject a leave request
const rejectLeave = async (req, res) => {
  try {
    const request = await LeaveRequest.findByIdAndUpdate(
      req.params.id,
      { $set: { status: "REJECTED" } },
      { new: true },
    );
    if (!request) return sendError(res, 404, "Request not found");
    return sendSuccess(res, 200, "Leave rejected successfully", { data: request });
  } catch (err) {
    return sendError(res, 500, "Internal server error", err);
  }
};

// bulk approve requests by ids array
const bulkApprove = async (req, res) => {
  try {
    const { ids } = req.body; // expect array of request ids
    const result = await LeaveRequest.updateMany(
      { _id: { $in: ids } },
      { $set: { status: "APPROVED" } },
    );
    return sendSuccess(res, 200, "Bulk approval completed", { data: result });
  } catch (err) {
    return sendError(res, 500, "Internal server error", err);
  }
};

// leave policy (type) operations
const createPolicy = async (req, res) => {
  try {
    const { name, totalDays } = req.body;
    const policy = await LeaveType.create({ name, totalDays });
    return sendSuccess(res, 201, "Leave policy created successfully", { data: policy });
  } catch (err) {
    return sendError(res, 500, "Internal server error", err);
  }
};

const updatePolicy = async (req, res) => {
  try {
    const { name, totalDays } = req.body;
    const policy = await LeaveType.findByIdAndUpdate(
      req.params.id,
      { $set: { name, totalDays } },
      { new: true },
    );
    if (!policy) return sendError(res, 404, "Policy not found");
    return sendSuccess(res, 200, "Leave policy updated successfully", { data: policy });
  } catch (err) {
    return sendError(res, 500, "Internal server error", err);
  }
};

const deletePolicy = async (req, res) => {
  try {
    const policy = await LeaveType.findByIdAndDelete(req.params.id);
    if (!policy) return sendError(res, 404, "Policy not found");
    return sendSuccess(res, 200, "Policy deleted");
  } catch (err) {
    return sendError(res, 500, "Internal server error", err);
  }
};

const viewPolicies = async (req, res) => {
  try {
    const policies = await LeaveType.find();
    return sendSuccess(res, 200, "Leave policies retrieved successfully", { data: policies });
  } catch (err) {
    return sendError(res, 500, "Internal server error", err);
  }
};

// leave balance operations - placeholder implementations
const viewBalance = async (req, res) => {
  // in a real app we'd calculate remaining days by employee & type
  return sendSuccess(res, 200, "Balance retrieved", { data: { message: "balance endpoint not implemented" } });
};

const adjustBalance = async (req, res) => {
  // typically an HR operation that updates a user's balance record
  return sendSuccess(res, 200, "Balance adjusted", { data: { message: "adjust balance not implemented" } });
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
