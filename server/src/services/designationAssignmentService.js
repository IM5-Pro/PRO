import mongoose from "mongoose";
import Department from "../models/Department.js";
import Designation from "../models/Designation.js";
import Employee from "../models/Employee.js";
import EmployeeDesignationHistory from "../models/EmployeeDesignationHistory.js";

const toObjectId = (value) => {
  if (!value) {
    return null;
  }

  if (value instanceof mongoose.Types.ObjectId) {
    return value;
  }

  return mongoose.Types.ObjectId.isValid(value)
    ? new mongoose.Types.ObjectId(value)
    : null;
};

const escapeRegex = (value) => String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeReason = (value) => String(value || "").trim() || "ASSIGNMENT";

const createServiceError = (statusCode, message, details = {}) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.details = details;
  return error;
};

const withSession = (query, session) => (session ? query.session(session) : query);

const buildEmployeeDesignationFilter = (designation) => ({
  $or: [{ designation: String(designation._id) }, { designation: designation.name }],
});

const resolveDesignation = async (designationRef, { session = null } = {}) => {
  if (!designationRef) {
    return null;
  }

  if (designationRef?._id && designationRef?.name) {
    return designationRef;
  }

  const designationId = toObjectId(designationRef);
  if (designationId) {
    return withSession(Designation.findById(designationId), session);
  }

  const normalizedRef = String(designationRef || "").trim();
  if (!normalizedRef) {
    return null;
  }

  const safeRef = escapeRegex(normalizedRef);
  return withSession(
    Designation.findOne({
      $or: [
        { name: { $regex: `^${safeRef}$`, $options: "i" } },
        { code: { $regex: `^${safeRef}$`, $options: "i" } },
      ],
    }),
    session,
  );
};

const resolveDesignationDepartment = async (designation, session = null) => {
  const departmentId = toObjectId(designation?.department?._id || designation?.department);
  if (!departmentId) {
    return null;
  }

  return withSession(
    Department.findById(departmentId).select("_id name code"),
    session,
  );
};

const validateDesignationDepartmentMatch = async ({ employee, designation, session = null }) => {
  const designationDepartment = await resolveDesignationDepartment(designation, session);
  if (!designationDepartment) {
    return { isValid: true, department: null };
  }

  const employeeDepartmentId = toObjectId(employee.departmentId);
  if (employeeDepartmentId && String(employeeDepartmentId) === String(designationDepartment._id)) {
    return { isValid: true, department: designationDepartment };
  }

  const employeeDepartment = String(employee.department || "").trim();
  if (employeeDepartment) {
    const normalizedEmployeeDepartment = employeeDepartment.toLowerCase();
    if (
      normalizedEmployeeDepartment === String(designationDepartment.name || "").trim().toLowerCase()
      || normalizedEmployeeDepartment === String(designationDepartment.code || "").trim().toLowerCase()
    ) {
      return { isValid: true, department: designationDepartment };
    }
  }

  return {
    isValid: false,
    department: designationDepartment,
    message: `Designation belongs to ${designationDepartment.name}. Assign the employee to the same department first.`,
  };
};

const ensureCapacityAvailable = async ({ designation, session = null }) => {
  if (!Number.isFinite(designation.maxHeadcount) || designation.maxHeadcount <= 0) {
    return;
  }

  const activeEmployeeCount = await withSession(
    Employee.countDocuments({
      ...buildEmployeeDesignationFilter(designation),
      isActive: true,
    }),
    session,
  );

  if (activeEmployeeCount >= designation.maxHeadcount) {
    throw createServiceError(
      409,
      "Designation headcount capacity reached",
      {
        designation: `${designation.name} has reached its maximum headcount of ${designation.maxHeadcount}`,
      },
    );
  }
};

const getBaselineEffectiveDate = (employee, fallbackDate) => (
  employee.joinDate
  || employee.joiningDate
  || fallbackDate
);

const ensureActiveHistoryForCurrentDesignation = async ({
  employee,
  designation,
  actorId,
  session = null,
  reason = "ASSIGNMENT",
}) => {
  const existingActiveHistory = await withSession(
    EmployeeDesignationHistory.findOne({
      employeeId: employee._id,
      effectiveTo: null,
    }).sort({ effectiveFrom: -1 }),
    session,
  );

  if (existingActiveHistory) {
    return existingActiveHistory;
  }

  const baselineDate = getBaselineEffectiveDate(employee, new Date());
  const [historyEntry] = await EmployeeDesignationHistory.create(
    [
      {
        employeeId: employee._id,
        designationId: designation._id,
        departmentId: designation.department || employee.departmentId || null,
        effectiveFrom: baselineDate,
        changedBy: actorId,
        reason,
      },
    ],
    { session },
  );

  return historyEntry;
};

const assignDesignationToEmployee = async ({
  actorId,
  employeeId,
  designationId,
  employee: employeeDocument = null,
  designation: designationDocument = null,
  effectiveDate = null,
  reason = "ASSIGNMENT",
  session = null,
}) => {
  const employee = employeeDocument || await withSession(Employee.findById(employeeId), session);
  if (!employee) {
    throw createServiceError(404, "Employee not found", {
      employeeId: "The requested employee does not exist",
    });
  }

  const designation = designationDocument || await resolveDesignation(designationId, { session });
  if (!designation) {
    throw createServiceError(404, "Designation not found", {
      designationId: "The requested designation does not exist",
    });
  }

  if (!designation.isActive) {
    throw createServiceError(400, "Designation is inactive", {
      designationId: "Cannot assign an inactive designation",
    });
  }

  const normalizedEffectiveDate = effectiveDate ? new Date(effectiveDate) : new Date();
  if (Number.isNaN(normalizedEffectiveDate.getTime())) {
    throw createServiceError(400, "Validation failed", {
      effectiveDate: "Invalid date format",
    });
  }

  const departmentValidation = await validateDesignationDepartmentMatch({
    employee,
    designation,
    session,
  });
  if (!departmentValidation.isValid) {
    throw createServiceError(409, "Department and designation mismatch", {
      designation: departmentValidation.message,
    });
  }

  const currentDesignationValue = employee.designation;
  const currentDesignation = await resolveDesignation(currentDesignationValue, { session });
  const nextDesignationId = String(designation._id);
  const currentDesignationId = currentDesignation ? String(currentDesignation._id) : null;
  const isSameLogicalDesignation = currentDesignationId === nextDesignationId;

  if (!isSameLogicalDesignation) {
    await ensureCapacityAvailable({ designation, session });
  }

  if (isSameLogicalDesignation) {
    if (String(currentDesignationValue || "") !== nextDesignationId) {
      employee.designation = nextDesignationId;
      employee.updatedBy = actorId;
      await employee.save({ session });
    }

    await ensureActiveHistoryForCurrentDesignation({
      employee,
      designation,
      actorId,
      session,
      reason: "MIGRATION_SYNC",
    });

    return {
      employee,
      designation,
      previousDesignation: currentDesignation,
      effectiveDate: normalizedEffectiveDate,
      reason: normalizeReason(reason),
      wasNoOp: true,
    };
  }

  const activeHistory = await withSession(
    EmployeeDesignationHistory.findOne({
      employeeId: employee._id,
      effectiveTo: null,
    }).sort({ effectiveFrom: -1 }),
    session,
  );

  if (activeHistory) {
    if (activeHistory.effectiveFrom && normalizedEffectiveDate < activeHistory.effectiveFrom) {
      throw createServiceError(400, "Invalid effective date", {
        effectiveDate: "Effective date cannot be earlier than the current designation start date",
      });
    }

    activeHistory.effectiveTo = normalizedEffectiveDate;
    await activeHistory.save({ session });
  } else if (currentDesignation) {
    const baselineDate = getBaselineEffectiveDate(employee, normalizedEffectiveDate);
    await EmployeeDesignationHistory.create(
      [
        {
          employeeId: employee._id,
          designationId: currentDesignation._id,
          departmentId: currentDesignation.department || employee.departmentId || null,
          effectiveFrom: baselineDate,
          effectiveTo: normalizedEffectiveDate,
          changedBy: actorId,
          reason: "BACKFILL",
        },
      ],
      { session },
    );
  }

  const normalizedReason = normalizeReason(reason);

  employee.designation = nextDesignationId;
  employee.updatedBy = actorId;
  await employee.save({ session });

  await EmployeeDesignationHistory.create(
    [
      {
        employeeId: employee._id,
        designationId: designation._id,
        departmentId: designation.department || employee.departmentId || null,
        effectiveFrom: normalizedEffectiveDate,
        changedBy: actorId,
        reason: normalizedReason,
      },
    ],
    { session },
  );

  if (currentDesignation) {
    await withSession(
      Designation.findByIdAndUpdate(currentDesignation._id, { $inc: { employeeCount: -1 } }),
      session,
    );
  }

  await withSession(
    Designation.findByIdAndUpdate(designation._id, { $inc: { employeeCount: 1 } }),
    session,
  );

  return {
    employee,
    designation,
    previousDesignation: currentDesignation,
    effectiveDate: normalizedEffectiveDate,
    reason: normalizedReason,
    wasNoOp: false,
  };
};

export {
  assignDesignationToEmployee,
  buildEmployeeDesignationFilter,
  createServiceError,
  resolveDesignation,
  toObjectId,
};