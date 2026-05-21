import { sendError, sendSuccess } from "../utils/response.js";
import { resolveCurrentEmployeeId } from "../services/employeeContextService.js";
import {
  approveInsuranceSubmission,
  closeInsuranceCycle,
  createInsuranceCycle,
  buildInsuranceCycleExportCsv,
  getCycleSubmissionsSummary,
  getEmployeeInsuranceContext,
  listInsuranceCycles,
  listPendingInsuranceSubmissions,
  rejectInsuranceSubmission,
  saveEmployeeInsuranceSubmission,
  updateInsuranceSubmissionByHr,
  updateInsuranceCycle,
} from "../services/insuranceService.js";

export const getMyInsuranceContext = async (req, res) => {
  try {
    const employeeId = await resolveCurrentEmployeeId(req.user.id, req.user.employeeId);
    if (!employeeId) {
      return sendError(res, 403, "Employee profile not linked to this account");
    }
    const context = await getEmployeeInsuranceContext(employeeId);
    return sendSuccess(res, 200, "Insurance context retrieved", { context });
  } catch (err) {
    console.error("getMyInsuranceContext error:", err);
    return sendError(res, 500, "Failed to load insurance details", err.message);
  }
};

export const saveMyInsuranceSubmission = async (req, res) => {
  try {
    const employeeId = await resolveCurrentEmployeeId(req.user.id, req.user.employeeId);
    if (!employeeId) {
      return sendError(res, 403, "Employee profile not linked to this account");
    }

    const submitForApproval = Boolean(req.body?.submitForApproval);
    const { nominees, selectedAddonIds } = req.body || {};

    const { submission, cycle } = await saveEmployeeInsuranceSubmission({
      employeeId,
      userId: req.user.id,
      nominees,
      selectedAddonIds,
      submitForApproval,
    });

    const message = submitForApproval
      ? "Insurance details submitted for HR approval"
      : "Insurance draft saved";

    return sendSuccess(res, 200, message, { submission, cycle });
  } catch (err) {
    const status = err.statusCode || 500;
    if (status >= 500) console.error("saveMyInsuranceSubmission error:", err);
    return sendError(res, status, err.message || "Failed to save insurance details");
  }
};

export const listPendingSubmissions = async (req, res) => {
  try {
    const limit = Number.parseInt(req.query.limit, 10) || 50;
    const submissions = await listPendingInsuranceSubmissions({ limit });
    return sendSuccess(res, 200, "Pending insurance submissions retrieved", { submissions });
  } catch (err) {
    console.error("listPendingSubmissions error:", err);
    return sendError(res, 500, "Failed to list pending submissions", err.message);
  }
};

export const approveSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { remarks } = req.body || {};
    const submission = await approveInsuranceSubmission({
      submissionId,
      reviewerId: req.user.id,
      remarks,
    });
    return sendSuccess(res, 200, "Insurance submission approved", { submission });
  } catch (err) {
    const status = err.statusCode || 500;
    if (status >= 500) console.error("approveSubmission error:", err);
    return sendError(res, status, err.message || "Failed to approve submission");
  }
};

export const updateSubmissionByHr = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { nominees, selectedAddonIds } = req.body || {};
    const submission = await updateInsuranceSubmissionByHr({
      submissionId,
      reviewerId: req.user.id,
      nominees,
      selectedAddonIds,
    });
    return sendSuccess(res, 200, "Insurance submission updated", { submission });
  } catch (err) {
    const status = err.statusCode || 500;
    if (status >= 500) console.error("updateSubmissionByHr error:", err);
    return sendError(res, status, err.message || "Failed to update submission");
  }
};

export const rejectSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { remarks } = req.body || {};
    const submission = await rejectInsuranceSubmission({
      submissionId,
      reviewerId: req.user.id,
      remarks,
    });
    return sendSuccess(res, 200, "Insurance submission rejected", { submission });
  } catch (err) {
    const status = err.statusCode || 500;
    if (status >= 500) console.error("rejectSubmission error:", err);
    return sendError(res, status, err.message || "Failed to reject submission");
  }
};

export const listCycles = async (req, res) => {
  try {
    const limit = Number.parseInt(req.query.limit, 10) || 20;
    const cycles = await listInsuranceCycles({ limit });
    return sendSuccess(res, 200, "Insurance cycles retrieved", { cycles });
  } catch (err) {
    console.error("listCycles error:", err);
    return sendError(res, 500, "Failed to list insurance cycles", err.message);
  }
};

export const createCycle = async (req, res) => {
  try {
    const { title, description, cycleType, baseCoverageAmount, addons } = req.body || {};
    const cycle = await createInsuranceCycle({
      title,
      description,
      cycleType,
      baseCoverageAmount,
      addons,
      createdBy: req.user.id,
    });
    return sendSuccess(res, 201, "Insurance cycle created", { cycle });
  } catch (err) {
    const status = err.statusCode || 500;
    if (status >= 500) console.error("createCycle error:", err);
    return sendError(res, status, err.message || "Failed to create insurance cycle");
  }
};

export const updateCycle = async (req, res) => {
  try {
    const { cycleId } = req.params;
    const { title, description, baseCoverageAmount, addons } = req.body || {};
    const cycle = await updateInsuranceCycle({
      cycleId,
      title,
      description,
      baseCoverageAmount,
      addons,
    });
    return sendSuccess(res, 200, "Insurance cycle updated", { cycle });
  } catch (err) {
    const status = err.statusCode || 500;
    if (status >= 500) console.error("updateCycle error:", err);
    return sendError(res, status, err.message || "Failed to update insurance cycle");
  }
};

export const closeCycle = async (req, res) => {
  try {
    const { cycleId } = req.params;
    const cycle = await closeInsuranceCycle({ cycleId, closedBy: req.user.id });
    return sendSuccess(res, 200, "Insurance cycle closed", { cycle });
  } catch (err) {
    const status = err.statusCode || 500;
    if (status >= 500) console.error("closeCycle error:", err);
    return sendError(res, status, err.message || "Failed to close insurance cycle");
  }
};

export const getCycleSummary = async (req, res) => {
  try {
    const { cycleId } = req.params;
    const summary = await getCycleSubmissionsSummary(cycleId);
    return sendSuccess(res, 200, "Cycle summary retrieved", summary);
  } catch (err) {
    const status = err.statusCode || 500;
    if (status >= 500) console.error("getCycleSummary error:", err);
    return sendError(res, status, err.message || "Failed to load cycle summary");
  }
};

export const exportCycleCsv = async (req, res) => {
  try {
    const { cycleId } = req.params;
    const status = String(req.query.status || "APPROVED").toUpperCase();
    const scope = String(req.query.scope || "nominees").toLowerCase();
    const allowedStatus = new Set(["APPROVED", "ALL", "PENDING", "SUBMITTED"]);
    if (!allowedStatus.has(status)) {
      return sendError(res, 400, "Invalid status. Use APPROVED, PENDING, SUBMITTED, or ALL");
    }
    if (!["nominees", "employees"].includes(scope)) {
      return sendError(res, 400, "Invalid scope. Use nominees or employees");
    }

    const { csv, filename } = await buildInsuranceCycleExportCsv(cycleId, {
      statusFilter: status,
      scope,
    });

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.send(csv);
  } catch (err) {
    const status = err.statusCode || 500;
    if (status >= 500) console.error("exportCycleCsv error:", err);
    return sendError(res, status, err.message || "Failed to export insurance data");
  }
};
