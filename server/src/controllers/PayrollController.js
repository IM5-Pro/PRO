// PayrollController manages payroll runs, details, and related operations

import PayrollRun from "../models/PayrollRun.js";
import PayrollDetail from "../models/PayrollDetail.js";
import SalaryTemplate from "../models/SalaryTemplate.js";
import Employee from "../models/Employee.js";
import { sendError, sendSuccess } from "../utils/response.js";
import {
  validatePayrollRun,
  validatePayrollDetail,
  validateSalaryStructure,
} from "../utils/payrollValidators.js";

const createPayroll = async (req, res) => {
  try {
    const validation = validatePayrollRun(req.body);
    if (!validation.isValid) {
      return sendError(res, 400, "Validation failed", validation.errors);
    }

    const { month } = req.body;
    const exists = await PayrollRun.findOne({ month });
    if (exists) {
      return sendError(res, 409, "Payroll run already exists for this month");
    }

    const run = await PayrollRun.create({ month, totalPayout: 0 });
    sendSuccess(res, 201, "Payroll run created", run);
  } catch (err) {
    console.error("Create payroll error:", err);
    sendError(res, 500, "Internal server error", err.message);
  }
};

const processPayroll = async (req, res) => {
  try {
    const { runId } = req.params;
    if (!runId || runId.trim().length === 0) {
      return sendError(res, 400, "Validation failed", { runId: "Run ID is required" });
    }

    const run = await PayrollRun.findById(runId);
    if (!run) {
      return sendError(res, 404, "Payroll run not found");
    }

    if (run.status !== "DRAFT") {
      return sendError(res, 400, "Only draft runs can be processed");
    }

    // calculate total payout from details
    const details = await PayrollDetail.find({ payrollRunId: runId });
    const total = details.reduce((sum, d) => sum + d.netSalary, 0);
    run.totalPayout = total;
    run.status = "PROCESSED";
    await run.save();

    sendSuccess(res, 200, "Payroll processed", run);
  } catch (err) {
    console.error("Process payroll error:", err);
    sendError(res, 500, "Internal server error", err.message);
  }
};

const approvePayroll = async (req, res) => {
  try {
    const { runId } = req.params;
    if (!runId || runId.trim().length === 0) {
      return sendError(res, 400, "Validation failed", { runId: "Run ID is required" });
    }

    const run = await PayrollRun.findById(runId);
    if (!run) {
      return sendError(res, 404, "Payroll run not found");
    }

    if (run.status !== "PROCESSED") {
      return sendError(res, 400, "Only processed runs can be approved");
    }

    run.status = "PAID";
    await run.save();

    sendSuccess(res, 200, "Payroll approved", run);
  } catch (err) {
    console.error("Approve payroll error:", err);
    sendError(res, 500, "Internal server error", err.message);
  }
};

const rejectPayroll = async (req, res) => {
  try {
    const { runId } = req.params;
    const { reason } = req.body;
    if (!runId || runId.trim().length === 0) {
      return sendError(res, 400, "Validation failed", { runId: "Run ID is required" });
    }

    const run = await PayrollRun.findById(runId);
    if (!run) {
      return sendError(res, 404, "Payroll run not found");
    }

    run.status = "DRAFT";
    run.rejectionReason = reason || "";
    await run.save();

    sendSuccess(res, 200, "Payroll run reverted to draft", run);
  } catch (err) {
    console.error("Reject payroll error:", err);
    sendError(res, 500, "Internal server error", err.message);
  }
};

const generateSlips = async (req, res) => {
  try {
    const { runId } = req.params;
    if (!runId || runId.trim().length === 0) {
      return sendError(res, 400, "Validation failed", { runId: "Run ID is required" });
    }

    const slips = await PayrollDetail.find({ payrollRunId: runId }).populate("employeeId");
    sendSuccess(res, 200, "Payslips retrieved", slips);
  } catch (err) {
    console.error("Generate slips error:", err);
    sendError(res, 500, "Internal server error", err.message);
  }
};

const viewOwn = async (req, res) => {
  try {
    const employeeId = req.user.employeeId || req.user._id;
    const details = await PayrollDetail.find({ employeeId }).populate("payrollRunId");
    sendSuccess(res, 200, "Own payroll details", details);
  } catch (err) {
    console.error("View own payroll error:", err);
    sendError(res, 500, "Internal server error", err.message);
  }
};

const viewAll = async (req, res) => {
  try {
    const runs = await PayrollRun.find({}).sort({ createdAt: -1 });
    sendSuccess(res, 200, "Payroll runs retrieved", runs);
  } catch (err) {
    console.error("View all payroll error:", err);
    sendError(res, 500, "Internal server error", err.message);
  }
};

const downloadSlip = async (req, res) => {
  try {
    const { detailId } = req.params;
    if (!detailId || detailId.trim().length === 0) {
      return sendError(res, 400, "Validation failed", { detailId: "Detail ID is required" });
    }

    const detail = await PayrollDetail.findById(detailId).populate("employeeId payrollRunId");
    if (!detail) {
      return sendError(res, 404, "Payroll detail not found");
    }

    sendSuccess(res, 200, "Payroll detail retrieved", detail);
  } catch (err) {
    console.error("Download slip error:", err);
    sendError(res, 500, "Internal server error", err.message);
  }
};

const exportPayroll = async (req, res) => {
  try {
    const { runId } = req.params;
    const slips = await PayrollDetail.find({ payrollRunId: runId }).populate("employeeId");
    // simple CSV conversion
    const csv = slips
      .map(d => `${d.employeeId.email},${d.grossSalary},${d.deductions},${d.netSalary}`)
      .join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.send(csv);
  } catch (err) {
    console.error("Export payroll error:", err);
    sendError(res, 500, "Internal server error", err.message);
  }
};

const updateSalary = async (req, res) => {
  try {
    const { detailId } = req.params;
    if (!detailId || detailId.trim().length === 0) {
      return sendError(res, 400, "Validation failed", { detailId: "Detail ID is required" });
    }

    const validation = validatePayrollDetail(req.body);
    if (!validation.isValid) {
      return sendError(res, 400, "Validation failed", validation.errors);
    }

    const detail = await PayrollDetail.findByIdAndUpdate(detailId, req.body, { new: true });
    if (!detail) {
      return sendError(res, 404, "Payroll detail not found");
    }

    sendSuccess(res, 200, "Payroll detail updated", detail);
  } catch (err) {
    console.error("Update salary error:", err);
    sendError(res, 500, "Internal server error", err.message);
  }
};

const viewSalaryStructure = async (req, res) => {
  try {
    const templates = await SalaryTemplate.find({});
    sendSuccess(res, 200, "Salary templates retrieved", templates);
  } catch (err) {
    console.error("View salary structure error:", err);
    sendError(res, 500, "Internal server error", err.message);
  }
};

const updateSalaryStructure = async (req, res) => {
  try {
    const { templateId } = req.params;
    if (!templateId || templateId.trim().length === 0) {
      return sendError(res, 400, "Validation failed", { templateId: "Template ID is required" });
    }

    const validation = validateSalaryStructure(req.body);
    if (!validation.isValid) {
      return sendError(res, 400, "Validation failed", validation.errors);
    }

    const template = await SalaryTemplate.findByIdAndUpdate(templateId, req.body, { new: true });
    if (!template) {
      return sendError(res, 404, "Salary template not found");
    }

    sendSuccess(res, 200, "Salary template updated", template);
  } catch (err) {
    console.error("Update salary structure error:", err);
    sendError(res, 500, "Internal server error", err.message);
  }
};

const taxCalculate = async (req, res) => {
  try {
    const { amount } = req.body;
    if (amount === undefined) {
      return sendError(res, 400, "Validation failed", { amount: "Amount is required" });
    }

    // simple flat 10% tax
    const tax = amount * 0.1;
    sendSuccess(res, 200, "Tax calculated", { amount, tax });
  } catch (err) {
    console.error("Tax calculate error:", err);
    sendError(res, 500, "Internal server error", err.message);
  }
};

const taxUpdate = async (req, res) => {
  try {
    // stub: real update would modify payroll detail
    sendSuccess(res, 200, "Tax updated", req.body);
  } catch (err) {
    console.error("Tax update error:", err);
    sendError(res, 500, "Internal server error", err.message);
  }
};

const bonusAdd = async (req, res) => {
  try {
    const { detailId, bonus } = req.body;
    if (!detailId || bonus === undefined) {
      return sendError(res, 400, "Validation failed", { detailId: "Detail ID required", bonus: "Bonus amount required" });
    }

    const detail = await PayrollDetail.findById(detailId);
    if (!detail) {
      return sendError(res, 404, "Payroll detail not found");
    }

    detail.netSalary += bonus;
    await detail.save();
    sendSuccess(res, 200, "Bonus added", detail);
  } catch (err) {
    console.error("Bonus add error:", err);
    sendError(res, 500, "Internal server error", err.message);
  }
};

const deductionAdd = async (req, res) => {
  try {
    const { detailId, deduction } = req.body;
    if (!detailId || deduction === undefined) {
      return sendError(res, 400, "Validation failed", { detailId: "Detail ID required", deduction: "Deduction amount required" });
    }

    const detail = await PayrollDetail.findById(detailId);
    if (!detail) {
      return sendError(res, 404, "Payroll detail not found");
    }

    detail.netSalary -= deduction;
    await detail.save();
    sendSuccess(res, 200, "Deduction added", detail);
  } catch (err) {
    console.error("Deduction add error:", err);
    sendError(res, 500, "Internal server error", err.message);
  }
};

const lockPayroll = async (req, res) => {
  try {
    const { runId } = req.params;
    const run = await PayrollRun.findById(runId);
    if (!run) return sendError(res, 404, "Payroll run not found");
    run.status = "LOCKED";
    await run.save();
    sendSuccess(res, 200, "Payroll locked", run);
  } catch (err) {
    console.error("Lock payroll error:", err);
    sendError(res, 500, "Internal server error", err.message);
  }
};

const unlockPayroll = async (req, res) => {
  try {
    const { runId } = req.params;
    const run = await PayrollRun.findById(runId);
    if (!run) return sendError(res, 404, "Payroll run not found");
    run.status = "DRAFT";
    await run.save();
    sendSuccess(res, 200, "Payroll unlocked", run);
  } catch (err) {
    console.error("Unlock payroll error:", err);
    sendError(res, 500, "Internal server error", err.message);
  }
};
export default {
  createPayroll,
  processPayroll,
  approvePayroll,
  rejectPayroll,
  generateSlips,
  viewOwn,
  viewAll,
  downloadSlip,
  exportPayroll,
  updateSalary,
  viewSalaryStructure,
  updateSalaryStructure,
  taxCalculate,
  taxUpdate,
  bonusAdd,
  deductionAdd,
  lockPayroll,
  unlockPayroll,
};
