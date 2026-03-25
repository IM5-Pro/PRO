// PayrollController manages payroll runs, details, and related operations

import mongoose from "mongoose";
import PDFDocument from "pdfkit";
import PayrollRun from "../models/PayrollRun.js";
import PayrollDetail from "../models/PayrollDetail.js";
import SalaryTemplate from "../models/SalaryTemplate.js";
import Employee from "../models/Employee.js";
import AuditLog from "../models/AuditLog.js";
import User from "../models/User.js";
import Roles from "../constants/roles.js";
import { sendError, sendSuccess } from "../utils/response.js";
import {
  validatePayrollRun,
  validatePayrollDetail,
  validateSalaryStructure,
} from "../utils/payrollValidators.js";
import {
  recalculatePayroll,
  buildTemplateEarnings,
  buildSalarySnapshot,
  toAmount,
} from "../services/payrollCalculationService.js";
import { calculateTaxBySlabs } from "../services/taxService.js";

const ROLE = {
  SUPER_ADMIN: Roles.SUPER_ADMIN,
  HR_ADMIN: Roles.HR_ADMIN,
  MANAGER: Roles.MANAGER,
  EMPLOYEE: Roles.EMPLOYEE,
  FINANCE: "FINANCE",
};

const ROLE_SETS = {
  HR_FULL: [ROLE.SUPER_ADMIN, ROLE.HR_ADMIN],
  HR_OR_FINANCE: [ROLE.SUPER_ADMIN, ROLE.HR_ADMIN, ROLE.FINANCE],
};

const resolveIdentifier = (...values) => {
  return (
    values.find((value) => typeof value === "string" && value.trim().length > 0)?.trim() ||
    null
  );
};

const getRunId = (req) => {
  return resolveIdentifier(req.params?.runId, req.params?.id, req.body?.runId, req.query?.runId);
};

const getDetailId = (req) => {
  return resolveIdentifier(
    req.params?.detailId,
    req.params?.id,
    req.body?.detailId,
    req.query?.detailId,
  );
};

const getTemplateId = (req) => {
  return resolveIdentifier(req.params?.templateId, req.params?.id, req.body?.templateId);
};

const authorizeRoles = (req, res, allowedRoles) => {
  if (!req.user?.role || !allowedRoles.includes(req.user.role)) {
    sendError(res, 403, "Unauthorized");
    return false;
  }
  return true;
};

const canViewPayrollDetail = (req, detailEmployeeId) => {
  const role = req.user?.role;
  if (role === ROLE.SUPER_ADMIN || role === ROLE.HR_ADMIN || role === ROLE.FINANCE) {
    return true;
  }

  if (role !== ROLE.EMPLOYEE) {
    return false;
  }

  const userEmployeeId = req.user?.employeeId;
  return userEmployeeId && String(userEmployeeId) === String(detailEmployeeId);
};

const createAuditLog = async (payload, session) => {
  await AuditLog.create([
    {
      entity: payload.entity || payload.entityType,
      entityType: payload.entityType || payload.entity,
      ...payload,
    },
  ], { session });
};

const resolveEmployeeIdFromAuth = async (req, session = null) => {
  if (req.user?.employeeId) {
    return req.user.employeeId;
  }

  if (!req.user?.id) {
    return null;
  }

  const authUser = await User.findById(req.user.id).select("employeeId").session(session);
  if (authUser?.employeeId) {
    req.user.employeeId = authUser.employeeId;
    return authUser.employeeId;
  }

  return null;
};

const formatCurrency = (value) => {
  const amount = toAmount(value);
  return amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const generatePayslipPdf = (detail) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const employeeName = [detail.employeeId?.firstName, detail.employeeId?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();

    doc.fontSize(18).text("Payslip", { align: "center" });
    doc.moveDown(1);
    doc.fontSize(11);
    doc.text(`Month: ${detail.payrollRunId?.month || "N/A"}`);
    doc.text(`Employee: ${employeeName || "N/A"}`);
    doc.text(`Email: ${detail.employeeId?.email || "N/A"}`);
    doc.text(`Generated On: ${new Date().toISOString().slice(0, 10)}`);

    doc.moveDown(1);
    doc.fontSize(12).text("Earnings", { underline: true });
    doc.fontSize(11).text(`Basic Salary: INR ${formatCurrency(detail.basicSalary)}`);
    (detail.earnings || []).forEach((item) => {
      doc.text(`${item.type}: INR ${formatCurrency(item.amount)}`);
    });
    (detail.bonuses || []).forEach((item) => {
      doc.text(`Bonus (${item.type}): INR ${formatCurrency(item.amount)}`);
    });
    doc.text(`Gross Salary: INR ${formatCurrency(detail.grossSalary)}`);

    doc.moveDown(1);
    doc.fontSize(12).text("Deductions", { underline: true });
    (detail.deductions || []).forEach((item) => {
      doc.fontSize(11).text(`${item.type}: INR ${formatCurrency(item.amount)}`);
    });
    doc.fontSize(11).text(`Tax: INR ${formatCurrency(detail.tax)}`);
    doc.text(`PF: INR ${formatCurrency(detail.pf)}`);
    doc.text(`ESI: INR ${formatCurrency(detail.esi)}`);
    doc.text(`Total Deductions: INR ${formatCurrency(detail.totalDeductions)}`);

    doc.moveDown(1);
    doc.fontSize(12).text(`Net Salary: INR ${formatCurrency(detail.netSalary)}`, { underline: true });

    doc.end();
  });
};

const ensurePayrollEditable = (run, res) => {
  if (!run) {
    sendError(res, 404, "Payroll run not found");
    return false;
  }

  if (run.status === "LOCKED") {
    sendError(res, 409, "Payroll run is locked");
    return false;
  }

  if (run.status === "PAID") {
    sendError(res, 409, "Paid payroll run cannot be modified");
    return false;
  }

  return true;
};

const recomputeDetailAndAssign = ({ detailRecord, patch = {} }) => {
  const nextState = {
    basicSalary: patch.basicSalary ?? detailRecord.basicSalary,
    earnings: patch.earnings ?? detailRecord.earnings,
    bonuses: patch.bonuses ?? detailRecord.bonuses,
    deductions: patch.deductions ?? detailRecord.deductions,
    tax: patch.tax ?? detailRecord.tax,
    pf: patch.pf ?? detailRecord.pf,
    esi: patch.esi ?? detailRecord.esi,
  };

  const recomputed = recalculatePayroll(nextState);

  detailRecord.basicSalary = recomputed.basicSalary;
  detailRecord.earnings = recomputed.earnings;
  detailRecord.bonuses = recomputed.bonuses;
  detailRecord.deductions = recomputed.deductions;
  detailRecord.tax = recomputed.tax;
  detailRecord.pf = recomputed.pf;
  detailRecord.esi = recomputed.esi;
  detailRecord.grossSalary = recomputed.grossSalary;
  detailRecord.totalDeductions = recomputed.totalDeductions;
  detailRecord.netSalary = recomputed.netSalary;
};

const refreshRunTotal = async (runId, session) => {
  const totals = await PayrollDetail.aggregate([
    { $match: { payrollRunId: new mongoose.Types.ObjectId(runId) } },
    { $group: { _id: "$payrollRunId", totalNet: { $sum: "$netSalary" } } },
  ]).session(session);

  const totalPayout = totals[0]?.totalNet || 0;
  const run = await PayrollRun.findByIdAndUpdate(runId, { totalPayout }, { new: true, session });
  return run;
};

const createPayroll = async (req, res) => {
  if (!authorizeRoles(req, res, ROLE_SETS.HR_FULL)) {
    return;
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const validation = validatePayrollRun(req.body);
    if (!validation.isValid) {
      await session.abortTransaction();
      return sendError(res, 400, "Validation failed", validation.errors);
    }

    const { month } = req.body;
    const exists = await PayrollRun.findOne({ month }).session(session);
    if (exists) {
      await session.abortTransaction();
      return sendError(res, 409, "Payroll run already exists for this month");
    }

    const run = await PayrollRun.create([{ month, totalPayout: 0 }], { session }).then((docs) => docs[0]);

    await createAuditLog(
      {
        userId: req.user.id,
        action: "PAYROLL_RUN_CREATED",
        entity: "PayrollRun",
        entityId: run._id.toString(),
        description: `Payroll run created for ${month}`,
      },
      session,
    );

    await session.commitTransaction();

    sendSuccess(res, 201, "Payroll run created", { run });
  } catch (err) {
    await session.abortTransaction();
    console.error("Create payroll error:", err);
    sendError(res, 500, "Internal server error", err.message);
  } finally {
    session.endSession();
  }
};

const processPayroll = async (req, res) => {
  if (!authorizeRoles(req, res, ROLE_SETS.HR_FULL)) {
    return;
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const runId = getRunId(req);
    if (!runId) {
      await session.abortTransaction();
      return sendError(res, 400, "Validation failed", { runId: "Run ID is required" });
    }

    const run = await PayrollRun.findById(runId).session(session);
    if (!run) {
      await session.abortTransaction();
      return sendError(res, 404, "Payroll run not found");
    }

    if (run.status !== "DRAFT") {
      await session.abortTransaction();
      return sendError(res, 400, "Only draft runs can be processed");
    }

    const employees = await Employee.find({ isActive: true })
      .populate("salaryTemplateId")
      .session(session)
      .lean();

    if (employees.length === 0) {
      await session.abortTransaction();
      return sendError(res, 400, "No active employees found for payroll processing");
    }

    const existingDetails = await PayrollDetail.find({ payrollRunId: runId }).session(session);
    const detailsByEmployee = new Map(
      existingDetails.map((detail) => [String(detail.employeeId), detail]),
    );

    for (const employee of employees) {
      const existing = detailsByEmployee.get(String(employee._id));
      const salarySnapshot = buildSalarySnapshot(employee);
      const templateEarnings = buildTemplateEarnings(employee.salaryTemplateId);
      const manualEarnings = (existing?.earnings || []).filter((entry) => entry.source !== "TEMPLATE");
      const mergedEarnings = [...templateEarnings, ...manualEarnings];

      const baseSalary =
        salarySnapshot.employeeSalary > 0
          ? salarySnapshot.employeeSalary
          : salarySnapshot.templateBasic;

      const preTaxComputation = recalculatePayroll({
        basicSalary: baseSalary,
        earnings: mergedEarnings,
        bonuses: existing?.bonuses || [],
        deductions: existing?.deductions || [],
        tax: 0,
        pf: existing?.pf ?? baseSalary * 0.12,
        esi:
          existing?.esi ??
          (baseSalary <= 21000 ? baseSalary * 0.0075 : 0),
      });

      const slabTax = calculateTaxBySlabs(preTaxComputation.grossSalary * 12);

      const recomputed = recalculatePayroll({
        basicSalary: baseSalary,
        earnings: mergedEarnings,
        bonuses: existing?.bonuses || [],
        deductions: existing?.deductions || [],
        tax: existing?.tax ?? slabTax.monthlyTax,
        pf: existing?.pf ?? baseSalary * 0.12,
        esi:
          existing?.esi ??
          (preTaxComputation.grossSalary <= 21000 ? preTaxComputation.grossSalary * 0.0075 : 0),
      });

      await PayrollDetail.findOneAndUpdate(
        {
          payrollRunId: runId,
          employeeId: employee._id,
        },
        {
          payrollRunId: runId,
          employeeId: employee._id,
          ...recomputed,
          salarySnapshot,
        },
        {
          upsert: true,
          returnDocument: 'after',
          setDefaultsOnInsert: true,
          session,
        },
      );
    }

    const refreshedRun = await refreshRunTotal(runId, session);
    refreshedRun.status = "PROCESSED";
    refreshedRun.processedAt = new Date();
    refreshedRun.rejectionReason = "";
    await refreshedRun.save({ session });

    await createAuditLog(
      {
        userId: req.user.id,
        action: "PAYROLL_PROCESSED",
        entity: "PayrollRun",
        entityId: refreshedRun._id.toString(),
        description: `Payroll processed for ${refreshedRun.month}`,
      },
      session,
    );

    await session.commitTransaction();

    sendSuccess(res, 200, "Payroll processed", { run: refreshedRun });
  } catch (err) {
    await session.abortTransaction();
    console.error("Process payroll error:", err);
    sendError(res, 500, "Internal server error", err.message);
  } finally {
    session.endSession();
  }
};

const approvePayroll = async (req, res) => {
  if (!authorizeRoles(req, res, ROLE_SETS.HR_OR_FINANCE)) {
    return;
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const runId = getRunId(req);
    if (!runId) {
      await session.abortTransaction();
      return sendError(res, 400, "Validation failed", { runId: "Run ID is required" });
    }

    const run = await PayrollRun.findById(runId).session(session);
    if (!run) {
      await session.abortTransaction();
      return sendError(res, 404, "Payroll run not found");
    }

    if (run.status !== "PROCESSED") {
      await session.abortTransaction();
      return sendError(res, 400, "Only processed runs can be approved");
    }

    run.status = "PAID";
    run.approvedAt = new Date();
    await run.save({ session });

    await createAuditLog(
      {
        userId: req.user.id,
        action: "PAYROLL_APPROVED",
        entity: "PayrollRun",
        entityId: run._id.toString(),
        description: `Payroll approved for ${run.month}`,
      },
      session,
    );

    await session.commitTransaction();

    sendSuccess(res, 200, "Payroll approved", { run });
  } catch (err) {
    await session.abortTransaction();
    console.error("Approve payroll error:", err);
    sendError(res, 500, "Internal server error", err.message);
  } finally {
    session.endSession();
  }
};

const rejectPayroll = async (req, res) => {
  if (!authorizeRoles(req, res, ROLE_SETS.HR_OR_FINANCE)) {
    return;
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const runId = getRunId(req);
    const { reason } = req.body;
    if (!runId) {
      await session.abortTransaction();
      return sendError(res, 400, "Validation failed", { runId: "Run ID is required" });
    }

    const run = await PayrollRun.findById(runId).session(session);
    if (!run) {
      await session.abortTransaction();
      return sendError(res, 404, "Payroll run not found");
    }

    if (run.status === "LOCKED") {
      await session.abortTransaction();
      return sendError(res, 409, "Locked payroll run cannot be rejected");
    }

    run.status = "DRAFT";
    run.rejectionReason = reason || "";
    run.processedAt = null;
    run.approvedAt = null;
    await run.save({ session });

    await createAuditLog(
      {
        userId: req.user.id,
        action: "PAYROLL_REJECTED",
        entity: "PayrollRun",
        entityId: run._id.toString(),
        description: `Payroll reverted to draft for ${run.month}`,
      },
      session,
    );

    await session.commitTransaction();

    sendSuccess(res, 200, "Payroll run reverted to draft", { run });
  } catch (err) {
    await session.abortTransaction();
    console.error("Reject payroll error:", err);
    sendError(res, 500, "Internal server error", err.message);
  } finally {
    session.endSession();
  }
};

const generateSlips = async (req, res) => {
  if (!authorizeRoles(req, res, ROLE_SETS.HR_OR_FINANCE)) {
    return;
  }

  try {
    const runId = getRunId(req);
    if (!runId) {
      return sendError(res, 400, "Validation failed", { runId: "Run ID is required" });
    }

    const slips = await PayrollDetail.find({ payrollRunId: runId }).populate("employeeId");
    sendSuccess(res, 200, "Payslips retrieved", { slips });
  } catch (err) {
    console.error("Generate slips error:", err);
    sendError(res, 500, "Internal server error", err.message);
  }
};

const viewOwn = async (req, res) => {
  try {
    // Check permission for MANAGER role using permissions.js
    if (req.user?.role === ROLE.MANAGER) {
      const permissions = req.user?.permissions || {};
      if (!permissions?.payroll?.view_own) {
        return sendError(res, 403, "Unauthorized");
      }
    }

    const employeeId = await resolveEmployeeIdFromAuth(req);
    if (!employeeId) {
      return sendError(res, 403, "Employee mapping missing for authenticated user");
    }

    const details = await PayrollDetail.find({ employeeId }).populate("payrollRunId");
    sendSuccess(res, 200, "Own payroll details", { details });
  } catch (err) {
    console.error("View own payroll error:", err);
    sendError(res, 500, "Internal server error", err.message);
  }
};

const viewAll = async (req, res) => {
  if (!authorizeRoles(req, res, ROLE_SETS.HR_OR_FINANCE)) {
    return;
  }

  try {
    const runs = await PayrollRun.find({}).sort({ createdAt: -1 });
    sendSuccess(res, 200, "Payroll runs retrieved", { runs });
  } catch (err) {
    console.error("View all payroll error:", err);
    sendError(res, 500, "Internal server error", err.message);
  }
};

const downloadSlip = async (req, res) => {
  try {
    const detailId = getDetailId(req);
    if (!detailId) {
      return sendError(res, 400, "Validation failed", { detailId: "Detail ID is required" });
    }

    const detail = await PayrollDetail.findById(detailId).populate("employeeId payrollRunId");
    if (!detail) {
      return sendError(res, 404, "Payroll detail not found");
    }

    if (req.user?.role === ROLE.EMPLOYEE && !req.user?.employeeId) {
      await resolveEmployeeIdFromAuth(req);
    }

    if (!canViewPayrollDetail(req, detail.employeeId?._id || detail.employeeId)) {
      return sendError(res, 403, "Unauthorized");
    }

    if (req.query?.format === "json") {
      return sendSuccess(res, 200, "Payroll detail retrieved", { detail });
    }

    const pdfBuffer = await generatePayslipPdf(detail);
    const safeMonth = (detail.payrollRunId?.month || "payslip").replace(/[^a-zA-Z0-9_-]/g, "_");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${safeMonth}-${detail._id}.pdf"`);
    return res.send(pdfBuffer);
  } catch (err) {
    console.error("Download slip error:", err);
    sendError(res, 500, "Internal server error", err.message);
  }
};

const exportPayroll = async (req, res) => {
  if (!authorizeRoles(req, res, ROLE_SETS.HR_OR_FINANCE)) {
    return;
  }

  try {
    const runId = getRunId(req);
    if (!runId) {
      return sendError(res, 400, "Validation failed", { runId: "Run ID is required" });
    }

    const slips = await PayrollDetail.find({ payrollRunId: runId }).populate("employeeId");
    if (slips.length === 0) {
      return sendError(res, 404, "No payroll details found for the run");
    }

    const csv = slips
      .map(
        (d) =>
          `${d.employeeId?.email || ""},${d.grossSalary},${d.totalDeductions},${d.netSalary}`,
      )
      .join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="payroll-${runId}.csv"`);
    res.send(csv);
  } catch (err) {
    console.error("Export payroll error:", err);
    sendError(res, 500, "Internal server error", err.message);
  }
};

const updateSalary = async (req, res) => {
  if (!authorizeRoles(req, res, ROLE_SETS.HR_FULL)) {
    return;
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const detailId = getDetailId(req);
    if (!detailId) {
      await session.abortTransaction();
      return sendError(res, 400, "Validation failed", { detailId: "Detail ID is required" });
    }

    const validation = validatePayrollDetail(req.body);
    if (!validation.isValid) {
      await session.abortTransaction();
      return sendError(res, 400, "Validation failed", validation.errors);
    }

    const detail = await PayrollDetail.findById(detailId).session(session);
    if (!detail) {
      await session.abortTransaction();
      return sendError(res, 404, "Payroll detail not found");
    }

    const run = await PayrollRun.findById(detail.payrollRunId).session(session);
    if (!ensurePayrollEditable(run, res)) {
      await session.abortTransaction();
      return;
    }

    recomputeDetailAndAssign({ detailRecord: detail, patch: req.body });
    await detail.save({ session });

    await refreshRunTotal(run._id, session);

    await createAuditLog(
      {
        userId: req.user.id,
        action: "PAYROLL_DETAIL_UPDATED",
        entity: "PayrollDetail",
        entityId: detail._id.toString(),
        description: "Payroll detail updated",
        changes: {
          detailId: detail._id,
        },
      },
      session,
    );

    await session.commitTransaction();

    sendSuccess(res, 200, "Payroll detail updated", { detail });
  } catch (err) {
    await session.abortTransaction();
    console.error("Update salary error:", err);
    sendError(res, 500, "Internal server error", err.message);
  } finally {
    session.endSession();
  }
};

const viewSalaryStructure = async (req, res) => {
  if (!authorizeRoles(req, res, ROLE_SETS.HR_FULL)) {
    return;
  }

  try {
    const templates = await SalaryTemplate.find({});
    sendSuccess(res, 200, "Salary templates retrieved", { templates });
  } catch (err) {
    console.error("View salary structure error:", err);
    sendError(res, 500, "Internal server error", err.message);
  }
};

const updateSalaryStructure = async (req, res) => {
  if (!authorizeRoles(req, res, ROLE_SETS.HR_FULL)) {
    return;
  }

  try {
    const templateId = getTemplateId(req);
    if (!templateId) {
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

    sendSuccess(res, 200, "Salary template updated", { template });
  } catch (err) {
    console.error("Update salary structure error:", err);
    sendError(res, 500, "Internal server error", err.message);
  }
};

const taxCalculate = async (req, res) => {
  if (!authorizeRoles(req, res, ROLE_SETS.HR_OR_FINANCE)) {
    return;
  }

  try {
    const { amount } = req.body;
    if (amount === undefined) {
      return sendError(res, 400, "Validation failed", { amount: "Amount is required" });
    }

    const taxSummary = calculateTaxBySlabs(amount);
    sendSuccess(res, 200, "Tax calculated", { taxSummary });
  } catch (err) {
    console.error("Tax calculate error:", err);
    sendError(res, 500, "Internal server error", err.message);
  }
};

const taxUpdate = async (req, res) => {
  if (!authorizeRoles(req, res, ROLE_SETS.HR_FULL)) {
    return;
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const detailId = getDetailId(req);
    const { tax } = req.body;

    if (!detailId || tax === undefined || tax < 0) {
      await session.abortTransaction();
      return sendError(res, 400, "Validation failed", {
        detailId: "Detail ID required",
        tax: "Tax must be a non-negative number",
      });
    }

    const detail = await PayrollDetail.findById(detailId).session(session);
    if (!detail) {
      await session.abortTransaction();
      return sendError(res, 404, "Payroll detail not found");
    }

    const run = await PayrollRun.findById(detail.payrollRunId).session(session);
    if (!ensurePayrollEditable(run, res)) {
      await session.abortTransaction();
      return;
    }

    recomputeDetailAndAssign({ detailRecord: detail, patch: { tax } });
    await detail.save({ session });
    await refreshRunTotal(run._id, session);

    await createAuditLog(
      {
        userId: req.user.id,
        action: "PAYROLL_TAX_UPDATED",
        entity: "PayrollDetail",
        entityId: detail._id.toString(),
        description: "Tax component updated",
      },
      session,
    );

    await session.commitTransaction();

    sendSuccess(res, 200, "Tax updated", { detail });
  } catch (err) {
    await session.abortTransaction();
    console.error("Tax update error:", err);
    sendError(res, 500, "Internal server error", err.message);
  } finally {
    session.endSession();
  }
};

const bonusAdd = async (req, res) => {
  if (!authorizeRoles(req, res, ROLE_SETS.HR_FULL)) {
    return;
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const detailId = getDetailId(req);
    const { bonus, reason } = req.body;
    if (!detailId || bonus === undefined || bonus < 0) {
      await session.abortTransaction();
      return sendError(res, 400, "Validation failed", {
        detailId: "Detail ID required",
        bonus: "Bonus amount must be a non-negative number",
      });
    }

    const detail = await PayrollDetail.findById(detailId).session(session);
    if (!detail) {
      await session.abortTransaction();
      return sendError(res, 404, "Payroll detail not found");
    }

    const run = await PayrollRun.findById(detail.payrollRunId).session(session);
    if (!ensurePayrollEditable(run, res)) {
      await session.abortTransaction();
      return;
    }

    const nextBonuses = [
      ...(detail.bonuses || []),
      {
        type: "Bonus",
        amount: toAmount(bonus),
        reason: reason || "",
        source: "MANUAL",
        addedBy: req.user.id,
        addedAt: new Date(),
      },
    ];

    recomputeDetailAndAssign({ detailRecord: detail, patch: { bonuses: nextBonuses } });
    await detail.save({ session });
    await refreshRunTotal(run._id, session);

    await createAuditLog(
      {
        userId: req.user.id,
        action: "BONUS_ADDED",
        entity: "PayrollDetail",
        entityId: detail._id.toString(),
        description: `Bonus added to payroll detail`,
        changes: {
          amount: toAmount(bonus),
          reason: reason || "",
        },
      },
      session,
    );

    await session.commitTransaction();
    sendSuccess(res, 200, "Bonus added", { detail });
  } catch (err) {
    await session.abortTransaction();
    console.error("Bonus add error:", err);
    sendError(res, 500, "Internal server error", err.message);
  } finally {
    session.endSession();
  }
};

const deductionAdd = async (req, res) => {
  if (!authorizeRoles(req, res, ROLE_SETS.HR_FULL)) {
    return;
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const detailId = getDetailId(req);
    const { deduction, reason } = req.body;
    if (!detailId || deduction === undefined || deduction < 0) {
      await session.abortTransaction();
      return sendError(res, 400, "Validation failed", {
        detailId: "Detail ID required",
        deduction: "Deduction amount must be a non-negative number",
      });
    }

    const detail = await PayrollDetail.findById(detailId).session(session);
    if (!detail) {
      await session.abortTransaction();
      return sendError(res, 404, "Payroll detail not found");
    }

    const run = await PayrollRun.findById(detail.payrollRunId).session(session);
    if (!ensurePayrollEditable(run, res)) {
      await session.abortTransaction();
      return;
    }

    const nextDeductions = [
      ...(detail.deductions || []),
      {
        type: "Deduction",
        amount: toAmount(deduction),
        reason: reason || "",
        source: "MANUAL",
        addedBy: req.user.id,
        addedAt: new Date(),
      },
    ];

    recomputeDetailAndAssign({ detailRecord: detail, patch: { deductions: nextDeductions } });
    await detail.save({ session });
    await refreshRunTotal(run._id, session);

    await createAuditLog(
      {
        userId: req.user.id,
        action: "DEDUCTION_ADDED",
        entity: "PayrollDetail",
        entityId: detail._id.toString(),
        description: "Deduction added to payroll detail",
        changes: {
          amount: toAmount(deduction),
          reason: reason || "",
        },
      },
      session,
    );

    await session.commitTransaction();
    sendSuccess(res, 200, "Deduction added", { detail });
  } catch (err) {
    await session.abortTransaction();
    console.error("Deduction add error:", err);
    sendError(res, 500, "Internal server error", err.message);
  } finally {
    session.endSession();
  }
};

const lockPayroll = async (req, res) => {
  if (!authorizeRoles(req, res, ROLE_SETS.HR_FULL)) {
    return;
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const runId = getRunId(req);
    if (!runId) {
      await session.abortTransaction();
      return sendError(res, 400, "Validation failed", { runId: "Run ID is required" });
    }

    const run = await PayrollRun.findById(runId).session(session);
    if (!run) {
      await session.abortTransaction();
      return sendError(res, 404, "Payroll run not found");
    }

    if (run.status === "PAID") {
      await session.abortTransaction();
      return sendError(res, 409, "Paid payroll run cannot be locked");
    }

    run.status = "LOCKED";
    run.lockedAt = new Date();
    await run.save({ session });

    await createAuditLog(
      {
        userId: req.user.id,
        action: "PAYROLL_LOCKED",
        entity: "PayrollRun",
        entityId: run._id.toString(),
        description: `Payroll run locked for ${run.month}`,
      },
      session,
    );

    await session.commitTransaction();
    sendSuccess(res, 200, "Payroll locked", { run });
  } catch (err) {
    await session.abortTransaction();
    console.error("Lock payroll error:", err);
    sendError(res, 500, "Internal server error", err.message);
  } finally {
    session.endSession();
  }
};

const unlockPayroll = async (req, res) => {
  if (!authorizeRoles(req, res, ROLE_SETS.HR_FULL)) {
    return;
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const runId = getRunId(req);
    if (!runId) {
      await session.abortTransaction();
      return sendError(res, 400, "Validation failed", { runId: "Run ID is required" });
    }

    const run = await PayrollRun.findById(runId).session(session);
    if (!run) {
      await session.abortTransaction();
      return sendError(res, 404, "Payroll run not found");
    }

    if (run.status !== "LOCKED") {
      await session.abortTransaction();
      return sendError(res, 400, "Only locked payroll runs can be unlocked");
    }

    run.status = "DRAFT";
    run.lockedAt = null;
    await run.save({ session });

    await createAuditLog(
      {
        userId: req.user.id,
        action: "PAYROLL_UNLOCKED",
        entity: "PayrollRun",
        entityId: run._id.toString(),
        description: `Payroll run unlocked for ${run.month}`,
      },
      session,
    );

    await session.commitTransaction();
    sendSuccess(res, 200, "Payroll unlocked", { run });
  } catch (err) {
    await session.abortTransaction();
    console.error("Unlock payroll error:", err);
    sendError(res, 500, "Internal server error", err.message);
  } finally {
    session.endSession();
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
