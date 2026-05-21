import mongoose from "mongoose";
import Employee from "../models/Employee.js";
import User from "../models/User.js";
import InsuranceCycle from "../models/InsuranceCycle.js";
import EmployeeInsuranceSubmission from "../models/EmployeeInsuranceSubmission.js";
import {
  INSURANCE_BASE_COVERAGE,
  INSURANCE_MAX_NOMINEES,
  INSURANCE_NOMINEE_RELATIONS,
  INSURANCE_RELATION_LABELS,
} from "../constants/insurance.js";
import {
  createNotification,
  createNotificationForRoles,
} from "../controllers/NotificationController.js";

const trim = (v) => (typeof v === "string" ? v.trim() : v);

export const getRelationOptions = () =>
  INSURANCE_NOMINEE_RELATIONS.map((value) => ({
    value,
    label: INSURANCE_RELATION_LABELS[value] || value,
  }));

const parseDateOfBirth = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const normalizeNominees = (nominees = []) => {
  if (!Array.isArray(nominees)) {
    const err = new Error("Nominees must be an array");
    err.statusCode = 400;
    throw err;
  }
  if (nominees.length > INSURANCE_MAX_NOMINEES) {
    const err = new Error(`You can nominate up to ${INSURANCE_MAX_NOMINEES} members`);
    err.statusCode = 400;
    throw err;
  }

  const seenRelations = new Set();
  const normalized = [];

  for (const raw of nominees) {
    const name = trim(raw?.name);
    const relation = trim(raw?.relation)?.toUpperCase();
    const dateOfBirth = parseDateOfBirth(raw?.dateOfBirth);

    if (!name) {
      const err = new Error("Each nominee must have a name");
      err.statusCode = 400;
      throw err;
    }
    if (!INSURANCE_NOMINEE_RELATIONS.includes(relation)) {
      const err = new Error(
        "Invalid relation. Allowed: parents, in-laws, spouse, child 1, child 2",
      );
      err.statusCode = 400;
      throw err;
    }
    if (!dateOfBirth) {
      const err = new Error("Each nominee must have a valid date of birth");
      err.statusCode = 400;
      throw err;
    }
    if (seenRelations.has(relation)) {
      const err = new Error(`Duplicate relation: ${INSURANCE_RELATION_LABELS[relation]}`);
      err.statusCode = 400;
      throw err;
    }
    seenRelations.add(relation);
    normalized.push({ name, relation, dateOfBirth });
  }

  return normalized;
};

export const getOpenInsuranceCycle = async () =>
  InsuranceCycle.findOne({ status: "OPEN" }).sort({ createdAt: -1 });

export const employeeHasApprovedInsurance = async (employeeId) => {
  const approved = await EmployeeInsuranceSubmission.findOne({
    employee: employeeId,
    status: "APPROVED",
  }).lean();
  return Boolean(approved);
};

export const canEmployeeEditInsurance = async ({ employeeId, cycle }) => {
  if (!cycle || cycle.status !== "OPEN") {
    return {
      canEdit: false,
      reason: "No open insurance enrollment window. Contact HR when a new cycle is announced.",
    };
  }

  const hasApproved = await employeeHasApprovedInsurance(employeeId);

  if (hasApproved && cycle.cycleType !== "UPDATE") {
    return {
      canEdit: false,
      reason:
        "Your insurance details are approved and locked. HR must open an update cycle before you can change them.",
    };
  }

  const pendingOtherCycle = await EmployeeInsuranceSubmission.findOne({
    employee: employeeId,
    status: "PENDING",
    cycle: { $ne: cycle._id },
  });
  if (pendingOtherCycle) {
    return {
      canEdit: false,
      reason: "You already have insurance details pending HR approval.",
    };
  }

  const current = await EmployeeInsuranceSubmission.findOne({
    employee: employeeId,
    cycle: cycle._id,
  });

  if (current?.status === "APPROVED") {
    return {
      canEdit: false,
      reason: "These details are already approved for this cycle and cannot be changed.",
    };
  }

  if (current?.status === "PENDING") {
    return {
      canEdit: false,
      reason: "Your submission is pending HR approval.",
    };
  }

  if (current?.status === "REJECTED") {
    return {
      canEdit: true,
      reason: null,
      submission: current,
      isResubmit: true,
    };
  }

  return { canEdit: true, reason: null, submission: current || null };
};

const validateAddonSelection = (cycle, selectedAddonIds = []) => {
  if (!Array.isArray(selectedAddonIds)) {
    const err = new Error("selectedAddonIds must be an array");
    err.statusCode = 400;
    throw err;
  }
  const validIds = new Set((cycle.addons || []).map((a) => String(a._id)));
  for (const id of selectedAddonIds) {
    if (!validIds.has(String(id))) {
      const err = new Error("Invalid add-on selection");
      err.statusCode = 400;
      throw err;
    }
  }
  return selectedAddonIds.map((id) => new mongoose.Types.ObjectId(id));
};

export const getEmployeeInsuranceContext = async (employeeId) => {
  const cycle = await getOpenInsuranceCycle();
  const hasApprovedEver = await employeeHasApprovedInsurance(employeeId);
  const access = cycle
    ? await canEmployeeEditInsurance({ employeeId, cycle })
    : { canEdit: false, reason: "No open insurance enrollment window.", submission: null };

  let submission = null;
  if (cycle) {
    submission = await EmployeeInsuranceSubmission.findOne({
      employee: employeeId,
      cycle: cycle._id,
    }).lean();
  }

  const lastApproved = await EmployeeInsuranceSubmission.findOne({
    employee: employeeId,
    status: "APPROVED",
  })
    .sort({ reviewedAt: -1 })
    .populate("cycle", "title cycleType baseCoverageAmount addons closedAt");

  return {
    cycle,
    submission,
    lastApproved,
    hasApprovedEver,
    canEdit: access.canEdit,
    lockReason: access.reason,
    relationOptions: getRelationOptions(),
    baseCoverageDefault: INSURANCE_BASE_COVERAGE,
    maxNominees: INSURANCE_MAX_NOMINEES,
  };
};

export const saveEmployeeInsuranceSubmission = async ({
  employeeId,
  userId,
  nominees,
  selectedAddonIds,
  submitForApproval,
}) => {
  const cycle = await getOpenInsuranceCycle();
  if (!cycle) {
    const err = new Error("No open insurance enrollment cycle");
    err.statusCode = 409;
    throw err;
  }

  const access = await canEmployeeEditInsurance({ employeeId, cycle });
  if (!access.canEdit) {
    const err = new Error(access.reason || "Insurance details cannot be edited");
    err.statusCode = 403;
    throw err;
  }

  const normalizedNominees = normalizeNominees(nominees);
  if (submitForApproval && normalizedNominees.length === 0) {
    const err = new Error("Add at least one nominee before submitting");
    err.statusCode = 400;
    throw err;
  }

  const addonIds = validateAddonSelection(cycle, selectedAddonIds);

  let submission = access.submission;
  if (!submission) {
    submission = await EmployeeInsuranceSubmission.create({
      employee: employeeId,
      cycle: cycle._id,
      nominees: normalizedNominees,
      selectedAddonIds: addonIds,
      status: submitForApproval ? "PENDING" : "DRAFT",
      submittedBy: userId,
      submittedAt: submitForApproval ? new Date() : null,
    });
  } else {
    submission.nominees = normalizedNominees;
    submission.selectedAddonIds = addonIds;
    if (submitForApproval) {
      submission.status = "PENDING";
      submission.submittedAt = new Date();
      submission.reviewedBy = null;
      submission.reviewedAt = null;
      submission.reviewRemarks = "";
    }
    await submission.save();
  }

  if (submitForApproval) {
    try {
      const employee = await Employee.findById(employeeId).lean();
      await notifyHrInsuranceSubmitted({
        employee,
        submission,
        cycle,
        actor: { id: userId },
      });
    } catch (notifyErr) {
      console.error("Insurance HR notification failed (submission saved):", notifyErr);
    }
  }

  return { submission, cycle };
};

const notifyHrInsuranceSubmitted = async ({ employee, submission, cycle, actor }) => {
  const name = [employee?.firstName, employee?.lastName].filter(Boolean).join(" ").trim();
  await createNotificationForRoles(
    ["HR_ADMIN", "SUPER_ADMIN"],
    {
      type: "onboarding_task",
      title: "Insurance nominees pending approval",
      message: `${name || "An employee"} submitted insurance nominees for ${cycle.title}.`,
      priority: "high",
      category: "approval",
      referenceType: "document",
      referenceId: submission._id,
      actionUrl: "/?page=insurance-approvals",
      metadata: {
        cycleId: String(cycle._id),
        cycleType: cycle.cycleType,
        entity: "insurance_submission",
      },
      triggeredBy: actor?.id,
    },
    actor,
  );
};

const notifyEmployeeInsuranceDecision = async ({
  employee,
  submission,
  approved,
  remarks,
  actor,
}) => {
  const user = await User.findOne({ employeeId: employee._id }).select("_id").lean();
  if (!user) return;

  await createNotification(
    {
      userId: user._id,
      type: approved ? "document_approval" : "document_rejection",
      title: approved ? "Insurance details approved" : "Insurance details rejected",
      message: approved
        ? "HR approved your insurance nominee details. They are locked until HR opens an update cycle."
        : `HR rejected your insurance submission.${remarks ? ` Reason: ${remarks}` : ""}`,
      priority: "medium",
      category: "update",
      referenceType: "document",
      referenceId: submission._id,
      actionUrl: "/?page=insurance-details",
      metadata: { approved, remarks: remarks || "", entity: "insurance_submission" },
      triggeredBy: actor?.id,
    },
    actor,
  );
};

export const updateInsuranceSubmissionByHr = async ({
  submissionId,
  reviewerId,
  nominees,
  selectedAddonIds,
}) => {
  const submission = await EmployeeInsuranceSubmission.findById(submissionId).populate("cycle");
  if (!submission) {
    const err = new Error("Insurance submission not found");
    err.statusCode = 404;
    throw err;
  }
  if (!["PENDING", "APPROVED"].includes(submission.status)) {
    const err = new Error("Only pending or approved submissions can be edited by HR");
    err.statusCode = 400;
    throw err;
  }

  const cycle = submission.cycle;
  if (!cycle) {
    const err = new Error("Insurance cycle not found for this submission");
    err.statusCode = 404;
    throw err;
  }

  const normalizedNominees = normalizeNominees(nominees);
  if (normalizedNominees.length === 0) {
    const err = new Error("At least one nominee is required");
    err.statusCode = 400;
    throw err;
  }

  const addonIds = validateAddonSelection(cycle, selectedAddonIds);
  submission.nominees = normalizedNominees;
  submission.selectedAddonIds = addonIds;
  submission.reviewRemarks =
    submission.status === "APPROVED"
      ? `HR correction on ${new Date().toISOString().slice(0, 10)}`
      : submission.reviewRemarks;
  await submission.save();

  return submission;
};

export const approveInsuranceSubmission = async ({ submissionId, reviewerId, remarks }) => {
  const submission = await EmployeeInsuranceSubmission.findById(submissionId).populate(
    "cycle",
  );
  if (!submission) {
    const err = new Error("Insurance submission not found");
    err.statusCode = 404;
    throw err;
  }
  if (submission.status !== "PENDING") {
    const err = new Error("Only pending submissions can be approved");
    err.statusCode = 400;
    throw err;
  }

  submission.status = "APPROVED";
  submission.reviewedBy = reviewerId;
  submission.reviewedAt = new Date();
  submission.reviewRemarks = remarks || "";
  await submission.save();

  const employee = await Employee.findById(submission.employee).lean();
  try {
    await notifyEmployeeInsuranceDecision({
      employee,
      submission,
      approved: true,
      remarks,
      actor: { id: reviewerId },
    });
  } catch (notifyErr) {
    console.error("Insurance approval notification failed:", notifyErr);
  }

  return submission;
};

export const rejectInsuranceSubmission = async ({ submissionId, reviewerId, remarks }) => {
  const submission = await EmployeeInsuranceSubmission.findById(submissionId);
  if (!submission) {
    const err = new Error("Insurance submission not found");
    err.statusCode = 404;
    throw err;
  }
  if (submission.status !== "PENDING") {
    const err = new Error("Only pending submissions can be rejected");
    err.statusCode = 400;
    throw err;
  }

  submission.status = "REJECTED";
  submission.reviewedBy = reviewerId;
  submission.reviewedAt = new Date();
  submission.reviewRemarks = remarks || "";
  await submission.save();

  const employee = await Employee.findById(submission.employee).lean();
  try {
    await notifyEmployeeInsuranceDecision({
      employee,
      submission,
      approved: false,
      remarks,
      actor: { id: reviewerId },
    });
  } catch (notifyErr) {
    console.error("Insurance rejection notification failed:", notifyErr);
  }

  return submission;
};

export const listPendingInsuranceSubmissions = async ({ limit = 50 }) => {
  const rows = await EmployeeInsuranceSubmission.find({ status: "PENDING" })
    .sort({ submittedAt: -1 })
    .limit(limit)
    .populate("employee", "firstName middleName lastName email department employeeCode")
    .populate("cycle", "title cycleType baseCoverageAmount addons")
    .lean();
  return rows;
};

const normalizeCycleAddons = (addons = [], existingAddons = []) => {
  const oldByKey = new Map((existingAddons || []).map((a) => [a.key, a]));
  const oldById = new Map((existingAddons || []).map((a) => [String(a._id), a]));

  return (addons || [])
    .filter((a) => trim(a?.label))
    .map((a, index) => {
      const key =
        trim(a.key) ||
        trim(a.label)
          ?.toLowerCase()
          .replace(/[^\w-]+/g, "-")
          .replace(/^-|-$/g, "") ||
        `addon-${index + 1}`;
      const prev = a._id ? oldById.get(String(a._id)) : oldByKey.get(key);
      const doc = {
        key,
        label: trim(a.label) || `Add-on ${index + 1}`,
        amount: Number(a.amount) || 0,
        description: trim(a.description) || "",
      };
      if (prev?._id) {
        doc._id = prev._id;
      }
      return doc;
    });
};

export const updateInsuranceCycle = async ({
  cycleId,
  title,
  description,
  baseCoverageAmount,
  addons,
}) => {
  const cycle = await InsuranceCycle.findById(cycleId);
  if (!cycle) {
    const err = new Error("Insurance cycle not found");
    err.statusCode = 404;
    throw err;
  }

  if (title !== undefined) {
    cycle.title = trim(title) || cycle.title;
  }
  if (description !== undefined) {
    cycle.description = trim(description) || "";
  }
  if (baseCoverageAmount !== undefined) {
    cycle.baseCoverageAmount = Number(baseCoverageAmount) || INSURANCE_BASE_COVERAGE;
  }
  if (addons !== undefined) {
    cycle.addons = normalizeCycleAddons(addons, cycle.addons);
    cycle.markModified("addons");
  }

  await cycle.save();
  return cycle;
};

export const createInsuranceCycle = async ({
  title,
  description,
  cycleType,
  baseCoverageAmount,
  addons,
  createdBy,
}) => {
  const existingOpen = await getOpenInsuranceCycle();
  if (existingOpen) {
    const err = new Error("Close the current open cycle before starting a new one");
    err.statusCode = 409;
    throw err;
  }

  const normalizedAddons = normalizeCycleAddons(addons);

  const cycle = await InsuranceCycle.create({
    title: trim(title) || "Insurance enrollment",
    description: trim(description) || "",
    cycleType: cycleType === "UPDATE" ? "UPDATE" : "INITIAL",
    baseCoverageAmount: Number(baseCoverageAmount) || INSURANCE_BASE_COVERAGE,
    addons: normalizedAddons,
    createdBy,
    status: "OPEN",
  });

  await createNotificationForRoles(
    ["EMPLOYEE", "MANAGER", "DEPT_ADMIN", "HR_ADMIN"],
    {
      type: "announcement",
      title: "Insurance enrollment open",
      message: `${cycle.title} is now open. Submit up to 5 nominees before HR closes the window.`,
      priority: "high",
      category: "administrative",
      referenceType: "announcement",
      referenceId: cycle._id,
      actionUrl: "/?page=insurance-details",
      metadata: { cycleType: cycle.cycleType, entity: "insurance_cycle" },
    },
    { id: createdBy },
  );

  return cycle;
};

export const closeInsuranceCycle = async ({ cycleId, closedBy }) => {
  const cycle = await InsuranceCycle.findById(cycleId);
  if (!cycle) {
    const err = new Error("Insurance cycle not found");
    err.statusCode = 404;
    throw err;
  }
  if (cycle.status !== "OPEN") {
    const err = new Error("Cycle is already closed");
    err.statusCode = 400;
    throw err;
  }

  cycle.status = "CLOSED";
  cycle.closedBy = closedBy;
  cycle.closedAt = new Date();
  await cycle.save();
  return cycle;
};

export const listInsuranceCycles = async ({ limit = 20 }) =>
  InsuranceCycle.find().sort({ createdAt: -1 }).limit(limit).lean();

const formatEmployeeName = (emp) =>
  [emp?.firstName, emp?.middleName, emp?.lastName].filter(Boolean).join(" ").trim();

const formatDateCsv = (value) => {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
};

const escapeCsvCell = (value) => {
  const s = String(value ?? "");
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

const csvRow = (cells) => cells.map(escapeCsvCell).join(",");

const resolveSelectedAddonLabels = (cycle, selectedAddonIds = []) => {
  const addons = cycle?.addons || [];
  const idSet = new Set((selectedAddonIds || []).map(String));
  return addons
    .filter((a) => idSet.has(String(a._id)))
    .map((a) => `${a.label} (${Number(a.amount) || 0})`);
};

export const getCycleEnrollmentReport = async (cycleId) => {
  const cycle = await InsuranceCycle.findById(cycleId).lean();
  if (!cycle) {
    const err = new Error("Insurance cycle not found");
    err.statusCode = 404;
    throw err;
  }

  const submissions = await EmployeeInsuranceSubmission.find({ cycle: cycleId })
    .populate(
      "employee",
      "firstName middleName lastName email department employeeCode joinDate designation",
    )
    .sort({ updatedAt: -1 })
    .lean();

  const submissionByEmployee = new Map(
    submissions.map((s) => [String(s.employee?._id || s.employee), s]),
  );

  const activeEmployees = await Employee.find({ isActive: true })
    .select(
      "firstName middleName lastName email department employeeCode joinDate designation",
    )
    .sort({ firstName: 1, lastName: 1 })
    .lean();

  const roster = activeEmployees.map((emp) => {
    const submission = submissionByEmployee.get(String(emp._id)) || null;
    const status = submission?.status || "NOT_STARTED";
    return {
      employee: emp,
      submission,
      submissionStatus: status,
      nomineeCount: submission?.nominees?.length || 0,
      submittedAt: submission?.submittedAt || null,
      reviewedAt: submission?.reviewedAt || null,
    };
  });

  const total = activeEmployees.length;
  const countBy = (status) => roster.filter((r) => r.submissionStatus === status).length;
  const submitted = roster.filter((r) => r.submissionStatus !== "NOT_STARTED").length;
  const approved = countBy("APPROVED");

  const stats = {
    totalActiveEmployees: total,
    submitted,
    approved,
    pending: countBy("PENDING"),
    draft: countBy("DRAFT"),
    rejected: countBy("REJECTED"),
    notStarted: countBy("NOT_STARTED"),
    participationPercent: total > 0 ? Math.round((submitted / total) * 100) : 0,
    approvalPercent: total > 0 ? Math.round((approved / total) * 100) : 0,
    readyForInsurerPercent: total > 0 ? Math.round((approved / total) * 100) : 0,
  };

  return { cycle, roster, submissions, stats };
};

export const getCycleSubmissionsSummary = async (cycleId) => {
  const report = await getCycleEnrollmentReport(cycleId);
  return {
    cycle: report.cycle,
    submissions: report.submissions,
    roster: report.roster,
    stats: report.stats,
  };
};

/**
 * @param {"APPROVED"|"ALL"|"PENDING"} statusFilter
 * @param {"nominees"|"employees"} scope - flat nominee rows vs one row per employee
 */
export const buildInsuranceCycleExportCsv = async (
  cycleId,
  { statusFilter = "APPROVED", scope = "nominees" } = {},
) => {
  const { cycle, roster } = await getCycleEnrollmentReport(cycleId);
  const lines = [];

  if (scope === "employees") {
    lines.push(
      csvRow([
        "Employee Code",
        "Employee Name",
        "Email",
        "Department",
        "Designation",
        "Submission Status",
        "Nominee Count",
        "Base Coverage (INR)",
        "Selected Add-ons",
        "Total Coverage (INR)",
        "Submitted At",
        "Approved At",
        "Nominees Summary",
      ]),
    );

    for (const row of roster) {
      if (statusFilter === "APPROVED" && row.submissionStatus !== "APPROVED") continue;
      if (statusFilter === "PENDING" && row.submissionStatus !== "PENDING") continue;
      if (statusFilter === "SUBMITTED" && row.submissionStatus === "NOT_STARTED") continue;

      const emp = row.employee;
      const sub = row.submission;
      const addonLabels = sub ? resolveSelectedAddonLabels(cycle, sub.selectedAddonIds) : [];
      const addonSum = (cycle.addons || [])
        .filter((a) => (sub?.selectedAddonIds || []).map(String).includes(String(a._id)))
        .reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
      const base = Number(cycle.baseCoverageAmount) || INSURANCE_BASE_COVERAGE;
      const nomineeSummary = (sub?.nominees || [])
        .map(
          (n) =>
            `${n.name} (${INSURANCE_RELATION_LABELS[n.relation] || n.relation}, DOB ${formatDateCsv(n.dateOfBirth)})`,
        )
        .join("; ");

      lines.push(
        csvRow([
          emp.employeeCode,
          formatEmployeeName(emp),
          emp.email,
          emp.department,
          emp.designation,
          row.submissionStatus,
          row.nomineeCount,
          base,
          addonLabels.join("; "),
          base + addonSum,
          formatDateCsv(row.submittedAt),
          formatDateCsv(row.reviewedAt),
          nomineeSummary,
        ]),
      );
    }
  } else {
    lines.push(
      csvRow([
        "Cycle",
        "Employee Code",
        "Employee Name",
        "Email",
        "Department",
        "Submission Status",
        "Base Coverage (INR)",
        "Selected Add-ons",
        "Total Coverage (INR)",
        "Nominee Name",
        "Nominee DOB",
        "Nominee Relation",
        "Submitted At",
        "Approved At",
      ]),
    );

    for (const row of roster) {
      if (statusFilter === "APPROVED" && row.submissionStatus !== "APPROVED") continue;
      if (statusFilter === "PENDING" && row.submissionStatus !== "PENDING") continue;
      if (statusFilter === "SUBMITTED" && row.submissionStatus === "NOT_STARTED") continue;

      const emp = row.employee;
      const sub = row.submission;
      const addonLabels = sub ? resolveSelectedAddonLabels(cycle, sub.selectedAddonIds) : [];
      const addonSum = (cycle.addons || [])
        .filter((a) => (sub?.selectedAddonIds || []).map(String).includes(String(a._id)))
        .reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
      const base = Number(cycle.baseCoverageAmount) || INSURANCE_BASE_COVERAGE;

      if (!sub?.nominees?.length) {
        lines.push(
          csvRow([
            cycle.title,
            emp.employeeCode,
            formatEmployeeName(emp),
            emp.email,
            emp.department,
            row.submissionStatus,
            base,
            addonLabels.join("; "),
            base + addonSum,
            "",
            "",
            "",
            formatDateCsv(row.submittedAt),
            formatDateCsv(row.reviewedAt),
          ]),
        );
        continue;
      }

      for (const nominee of sub.nominees) {
        lines.push(
          csvRow([
            cycle.title,
            emp.employeeCode,
            formatEmployeeName(emp),
            emp.email,
            emp.department,
            row.submissionStatus,
            base,
            addonLabels.join("; "),
            base + addonSum,
            nominee.name,
            formatDateCsv(nominee.dateOfBirth),
            INSURANCE_RELATION_LABELS[nominee.relation] || nominee.relation,
            formatDateCsv(row.submittedAt),
            formatDateCsv(row.reviewedAt),
          ]),
        );
      }
    }
  }

  return {
    csv: `${lines.join("\r\n")}\r\n`,
    filename: `insurance-${cycle.title.replace(/[^\w-]+/g, "-").slice(0, 40)}-${statusFilter.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`,
  };
};
