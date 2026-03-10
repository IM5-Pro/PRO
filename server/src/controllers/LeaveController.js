import LeaveRequest from "../models/LeaveRequest.js";
import LeaveType from "../models/LeaveType.js";

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

    res.json({ success: true, data: request });
  } catch (err) {
    res.status(500).json(err);
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
    if (!request) return res.status(404).json({ message: "Request not found" });
    res.json({ success: true, data: request });
  } catch (err) {
    res.status(500).json(err);
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
    if (!request) return res.status(404).json({ message: "Request not found" });
    res.json({ success: true, data: request });
  } catch (err) {
    res.status(500).json(err);
  }
};

// view your own leave requests
const viewOwn = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const requests = await LeaveRequest.find({ employeeId });
    res.json({ success: true, data: requests });
  } catch (err) {
    res.status(500).json(err);
  }
};

// view team leave requests (for managers); basic implementation returns all pending for now
const viewTeam = async (req, res) => {
  try {
    // TODO: filter by manager's team members
    const requests = await LeaveRequest.find();
    res.json({ success: true, data: requests });
  } catch (err) {
    res.status(500).json(err);
  }
};

// view all leave requests (HR or superadmin)
const viewAll = async (req, res) => {
  try {
    const requests = await LeaveRequest.find();
    res.json({ success: true, data: requests });
  } catch (err) {
    res.status(500).json(err);
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
    if (!request) return res.status(404).json({ message: "Request not found" });
    res.json({ success: true, data: request });
  } catch (err) {
    res.status(500).json(err);
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
    if (!request) return res.status(404).json({ message: "Request not found" });
    res.json({ success: true, data: request });
  } catch (err) {
    res.status(500).json(err);
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
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json(err);
  }
};

// leave policy (type) operations
const createPolicy = async (req, res) => {
  try {
    const { name, totalDays } = req.body;
    const policy = await LeaveType.create({ name, totalDays });
    res.json({ success: true, data: policy });
  } catch (err) {
    res.status(500).json(err);
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
    if (!policy) return res.status(404).json({ message: "Policy not found" });
    res.json({ success: true, data: policy });
  } catch (err) {
    res.status(500).json(err);
  }
};

const deletePolicy = async (req, res) => {
  try {
    const policy = await LeaveType.findByIdAndDelete(req.params.id);
    if (!policy) return res.status(404).json({ message: "Policy not found" });
    res.json({ success: true, message: "Policy deleted" });
  } catch (err) {
    res.status(500).json(err);
  }
};

const viewPolicies = async (req, res) => {
  try {
    const policies = await LeaveType.find();
    res.json({ success: true, data: policies });
  } catch (err) {
    res.status(500).json(err);
  }
};

// leave balance operations - placeholder implementations
const viewBalance = async (req, res) => {
  // in a real app we'd calculate remaining days by employee & type
  res.json({
    success: true,
    data: { message: "balance endpoint not implemented" },
  });
};

const adjustBalance = async (req, res) => {
  // typically an HR operation that updates a user's balance record
  res.json({
    success: true,
    data: { message: "adjust balance not implemented" },
  });
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
