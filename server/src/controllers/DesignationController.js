import Designation from "../models/Designation.js";
import Employee from "../models/Employee.js";
import AuditLog from "../models/AuditLog.js";
import { recordAudit } from "../utils/audit.js";
import Department from "../models/Department.js";
import mongoose from "mongoose";
import {
  validateDesignation,
  validateDesignationAssignment,
} from "../utils/designationValidators.js";
import { sendError, sendSuccess } from "../utils/response.js";
import {
  assignDesignationToEmployee,
  buildEmployeeDesignationFilter,
} from "../services/designationAssignmentService.js";

const MAX_LIMIT = 100;

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

const normalizeCode = (value) => String(value || "")
  .trim()
  .toUpperCase()
  .replace(/[^A-Z0-9]/g, "");

const generateBaseCode = (name) => {
  const words = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return "DESIG";
  }

  if (words.length === 1) {
    return normalizeCode(words[0]).slice(0, 8) || "DESIG";
  }

  const initials = words.map((word) => word[0]).join("");
  return normalizeCode(initials).slice(0, 8) || normalizeCode(words.join("")).slice(0, 8) || "DESIG";
};

const resolveUniqueDesignationCode = async ({ code, name, excludeDesignationId = null }) => {
  const baseCode = normalizeCode(code) || generateBaseCode(name);
  let candidate = baseCode;
  let suffix = 1;

  while (true) {
    const query = { code: candidate };
    if (excludeDesignationId) {
      query._id = { $ne: excludeDesignationId };
    }

    const exists = await Designation.exists(query);
    if (!exists) {
      return candidate;
    }

    candidate = `${baseCode}${suffix}`;
    suffix += 1;
  }
};

const normalizeSalaryBand = (payload = {}) => {
  const hasSalary = payload.salary !== undefined && payload.salary !== null;
  const hasMinSalary = payload.minSalary !== undefined && payload.minSalary !== null;
  const hasMaxSalary = payload.maxSalary !== undefined && payload.maxSalary !== null;

  const minSalary = hasMinSalary ? payload.minSalary : hasSalary ? payload.salary : undefined;
  const maxSalary = hasMaxSalary ? payload.maxSalary : hasSalary ? payload.salary : undefined;

  return { minSalary, maxSalary };
};

const checkCircularDesignation = async (parentId, currentId) => {
  let cursor = parentId;
  const visited = new Set();

  while (cursor) {
    const key = String(cursor);
    if (visited.has(key)) {
      return true;
    }
    visited.add(key);

    if (key === String(currentId)) {
      return true;
    }

    const currentDesignation = await Designation.findById(cursor)
      .select("_id reportingTo")
      .lean();
    if (!currentDesignation || !currentDesignation.reportingTo) {
      break;
    }

    cursor = currentDesignation.reportingTo;
  }

  return false;
};

const ensureDepartmentExists = async (departmentId) => {
  const parsedDepartmentId = toObjectId(departmentId);
  if (!parsedDepartmentId) {
    return { isValid: false, message: "Department must be a valid department ID" };
  }

  const department = await Department.findById(parsedDepartmentId).select("_id name code").lean();
  if (!department) {
    return { isValid: false, message: "Department not found" };
  }

  return { isValid: true, department, departmentId: parsedDepartmentId };
};

const ensureReportingToIsValid = async ({ reportingTo, designationId = null }) => {
  if (!reportingTo) {
    return { isValid: true, reportingToId: null };
  }

  const reportingToId = toObjectId(reportingTo);
  if (!reportingToId) {
    return { isValid: false, message: "Reporting to must be a valid designation ID" };
  }

  if (designationId && String(reportingToId) === String(designationId)) {
    return { isValid: false, message: "A designation cannot report to itself" };
  }

  const parentDesignation = await Designation.findById(reportingToId)
    .select("_id isActive")
    .lean();
  if (!parentDesignation) {
    return { isValid: false, message: "Reporting designation not found" };
  }

  if (!parentDesignation.isActive) {
    return { isValid: false, message: "Reporting designation is inactive" };
  }

  if (designationId) {
    const hasCircularHierarchy = await checkCircularDesignation(reportingToId, designationId);
    if (hasCircularHierarchy) {
      return { isValid: false, message: "Circular reporting hierarchy detected" };
    }
  }

  return { isValid: true, reportingToId };
};

const getEmployeeDesignationFilter = buildEmployeeDesignationFilter;

const escapeRegex = (value) => String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const sortDesignationTree = (nodes) => {
  nodes.sort((left, right) => {
    if (left.level !== right.level) {
      return left.level - right.level;
    }

    return String(left.name || "").localeCompare(String(right.name || ""));
  });

  nodes.forEach((node) => {
    if (Array.isArray(node.children) && node.children.length > 0) {
      sortDesignationTree(node.children);
    }
  });

  return nodes;
};

const buildDesignationHierarchy = (designations) => {
  const nodeMap = new Map();
  const roots = [];

  designations.forEach((designation) => {
    nodeMap.set(String(designation._id), {
      ...designation,
      currentHeadcount: designation.employeeCount || 0,
      capacityRemaining: Number.isFinite(designation.maxHeadcount)
        ? Math.max(designation.maxHeadcount - (designation.employeeCount || 0), 0)
        : null,
      children: [],
    });
  });

  designations.forEach((designation) => {
    const node = nodeMap.get(String(designation._id));
    const parentKey = String(designation.reportingTo?._id || designation.reportingTo || "");
    const parentNode = parentKey ? nodeMap.get(parentKey) : null;

    if (parentNode) {
      parentNode.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return sortDesignationTree(roots);
};

export const listDesignationHierarchy = async (req, res) => {
  try {
    const { department, includeInactive = "false" } = req.query;
    const filter = {};

    if (includeInactive !== "true") {
      filter.isActive = true;
    }

    if (department) {
      const departmentId = toObjectId(department);
      if (!departmentId) {
        return sendError(res, 400, "Invalid department filter", {
          department: "Department filter must be a valid department ID",
        });
      }

      filter.department = departmentId;
    }

    const designations = await Designation.find(filter)
      .populate("department", "name code")
      .populate("reportingTo", "name code level")
      .sort({ level: 1, name: 1 })
      .lean();

    const hierarchy = buildDesignationHierarchy(designations);

    return sendSuccess(res, 200, "Designation hierarchy retrieved successfully", {
      orgChart: hierarchy,
      total: designations.length,
      rootNodes: hierarchy.length,
    });
  } catch (error) {
    console.error("List designation hierarchy error:", error);
    return sendError(res, 500, "Failed to retrieve designation hierarchy", {
      error: error.message,
    });
  }
};

export const getOrgChart = listDesignationHierarchy;

// Create a new designation
export const createDesignation = async (req, res) => {
  try {
    // Validate input
    const validation = validateDesignation(req.body, false);
    if (!validation.isValid) {
      return sendError(res, 400, "Validation failed", validation.errors);
    }

    const {
      name,
      code,
      description,
      level,
      department,
      maxHeadcount,
      reportingTo,
    } = req.body;

    const { minSalary, maxSalary } = normalizeSalaryBand(req.body);

    const normalizedName = String(name || "").trim();
    if (!normalizedName) {
      return sendError(res, 400, "Designation name is required", {
        name: "Designation name is required",
      });
    }

    // Check if designation already exists
    const existingDesignation = await Designation.findOne({
      name: { $regex: `^${escapeRegex(normalizedName)}$`, $options: "i" },
    });
    if (existingDesignation) {
      return sendError(
        res,
        409,
        "Designation with this name already exists",
        { name: "Designation name must be unique" }
      );
    }

    const uniqueCode = await resolveUniqueDesignationCode({
      code,
      name: normalizedName,
    });

    let departmentId = null;
    if (department) {
      const departmentValidation = await ensureDepartmentExists(department);
      if (!departmentValidation.isValid) {
        return sendError(res, 400, departmentValidation.message, {
          department: departmentValidation.message,
        });
      }
      departmentId = departmentValidation.departmentId;
    }

    const reportingValidation = await ensureReportingToIsValid({ reportingTo });
    if (!reportingValidation.isValid) {
      return sendError(res, 400, "Invalid reporting structure", {
        reportingTo: reportingValidation.message,
      });
    }

    // Create new designation
    const designation = new Designation({
      name: normalizedName,
      code: uniqueCode,
      description: description?.trim() || "",
      level,
      minSalary: minSalary ?? 0,
      maxSalary: maxSalary ?? 0,
      maxHeadcount: Number.isFinite(maxHeadcount) ? maxHeadcount : null,
      department: departmentId,
      reportingTo: reportingValidation.reportingToId,
      createdBy: req.user.id,
      updatedBy: req.user.id,
    });

    await designation.save();

    // Log action
    await recordAudit(req, {
      action: "CREATE",
      entityType: "Designation",
      entityId: designation._id,
      description: `Created new designation: ${designation.name}`,
    });

    return sendSuccess(
      res,
      201,
      "Designation created successfully",
      designation
    );
  } catch (error) {
    if (error?.code === 11000) {
      return sendError(res, 409, "Designation name or code must be unique", {
        duplicate: "Designation name or code already exists",
      });
    }

    if (error?.name === "ValidationError") {
      return sendError(res, 400, "Validation failed", {
        error: error.message,
      });
    }

    console.error("Create designation error:", error);
    return sendError(res, 500, "Failed to create designation", {
      error: error.message,
    });
  }
};

// List all designations (with role-based filtering)
export const listDesignations = async (req, res) => {
  try {
    const {
      page: requestedPage,
      limit: requestedLimit,
      department,
      isActive = "true",
      search,
    } = req.query;

    const parsedPage = Number.parseInt(requestedPage, 10);
    const parsedLimit = Number.parseInt(requestedLimit, 10);
    const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    const limit = Number.isFinite(parsedLimit) && parsedLimit > 0
      ? Math.min(parsedLimit, MAX_LIMIT)
      : 10;
    const skip = (page - 1) * limit;

    // Build filter object
    let filter = {};

    // HR Admin can see all active designations
    // Manager can see all active designations
    // Super Admin can see all
    if (isActive === "true") {
      filter.isActive = true;
    } else if (isActive === "false") {
      filter.isActive = false;
    }

    if (department) {
      const departmentId = toObjectId(department);
      if (!departmentId) {
        return sendError(res, 400, "Invalid department filter", {
          department: "Department filter must be a valid department ID",
        });
      }
      filter.department = departmentId;
    }

    if (search) {
      const safeSearch = escapeRegex(search);
      filter.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { code: { $regex: safeSearch, $options: "i" } },
      ];
    }

    // Get total count
    const total = await Designation.countDocuments(filter);

    // Get paginated results
    const designations = await Designation.find(filter)
      .populate("department", "name code")
      .populate("reportingTo", "name level code")
      .populate("createdBy", "email firstName lastName")
      .populate("updatedBy", "email firstName lastName")
      .sort({ level: 1, name: 1 })
      .limit(limit)
      .skip(skip);

    return sendSuccess(res, 200, "Designations retrieved successfully", {
      designations,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("List designations error:", error);
    return sendError(res, 500, "Failed to retrieve designations", {
      error: error.message,
    });
  }
};

// Read a single designation
export const readDesignation = async (req, res) => {
  try {
    const { designationId } = req.params;

    const designation = await Designation.findById(designationId)
      .populate("department", "name code")
      .populate("reportingTo", "name level code")
      .populate("createdBy", "email firstName lastName")
      .populate("updatedBy", "email firstName lastName");

    if (!designation) {
      return sendError(res, 404, "Designation not found", {
        designationId: "The requested designation does not exist",
      });
    }

    const designationData = designation.toObject();
    designationData.employeeCount = designation.employeeCount || 0;

    return sendSuccess(res, 200, "Designation retrieved successfully", designationData);
  } catch (error) {
    console.error("Read designation error:", error);
    return sendError(res, 500, "Failed to retrieve designation", {
      error: error.message,
    });
  }
};

// Update a designation
export const updateDesignation = async (req, res) => {
  try {
    const { designationId } = req.params;

    // Validate input
    const validation = validateDesignation(req.body, true);
    if (!validation.isValid) {
      return sendError(res, 400, "Validation failed", validation.errors);
    }

    const {
      name,
      code,
      description,
      level,
      department,
      reportingTo,
      isActive,
      maxHeadcount,
    } = req.body;

    const { minSalary, maxSalary } = normalizeSalaryBand(req.body);

    // Check if designation exists
    const designation = await Designation.findById(designationId);
    if (!designation) {
      return sendError(res, 404, "Designation not found", {
        designationId: "The requested designation does not exist",
      });
    }

    // Track changes for audit log
    const changes = {};

    if (name && name.trim() !== designation.name) {
      const normalizedName = name.trim();
      // Check for duplicate name
      const existingDesignation = await Designation.findOne({
        _id: { $ne: designationId },
        name: { $regex: `^${escapeRegex(normalizedName)}$`, $options: "i" },
      });
      if (existingDesignation) {
        return sendError(
          res,
          409,
          "Designation with this name already exists",
          { name: "Designation name must be unique" }
        );
      }
      changes.name = { from: designation.name, to: normalizedName };
      designation.name = normalizedName;
    }

    if (code !== undefined) {
      const normalizedCode = await resolveUniqueDesignationCode({
        code,
        name: designation.name,
        excludeDesignationId: designationId,
      });
      if (normalizedCode !== designation.code) {
        changes.code = { from: designation.code, to: normalizedCode };
        designation.code = normalizedCode;
      }
    }

    if (description !== undefined && description !== designation.description) {
      changes.description = { from: designation.description, to: description };
      designation.description = description?.trim() || "";
    }

    if (level !== undefined && level !== designation.level) {
      changes.level = { from: designation.level, to: level };
      designation.level = level;
    }

    if (minSalary !== undefined && minSalary !== designation.minSalary) {
      changes.minSalary = { from: designation.minSalary, to: minSalary };
      designation.minSalary = minSalary;
    }

    if (maxSalary !== undefined && maxSalary !== designation.maxSalary) {
      changes.maxSalary = { from: designation.maxSalary, to: maxSalary };
      designation.maxSalary = maxSalary;
    }

    if (maxHeadcount !== undefined && maxHeadcount !== designation.maxHeadcount) {
      if (Number.isFinite(maxHeadcount)) {
        const activeEmployeeCount = await Employee.countDocuments({
          ...getEmployeeDesignationFilter(designation),
          isActive: true,
        });

        if (maxHeadcount < activeEmployeeCount) {
          return sendError(res, 409, "Invalid headcount capacity", {
            maxHeadcount: `Cannot set maxHeadcount below the current active employee count of ${activeEmployeeCount}`,
          });
        }
      }

      changes.maxHeadcount = {
        from: designation.maxHeadcount,
        to: maxHeadcount,
      };
      designation.maxHeadcount = Number.isFinite(maxHeadcount) ? maxHeadcount : null;
    }

    if (
      department !== undefined &&
      String(department || "") !== String(designation.department || "")
    ) {
      if (!department) {
        changes.department = {
          from: designation.department,
          to: null,
        };
        designation.department = null;
      } else {
        const departmentValidation = await ensureDepartmentExists(department);
        if (!departmentValidation.isValid) {
          return sendError(res, 400, "Invalid department", {
            department: departmentValidation.message,
          });
        }
        changes.department = {
          from: designation.department,
          to: departmentValidation.departmentId,
        };
        designation.department = departmentValidation.departmentId;
      }
    }

    if (reportingTo !== undefined) {
      const reportingValidation = await ensureReportingToIsValid({
        reportingTo,
        designationId,
      });
      if (!reportingValidation.isValid) {
        return sendError(res, 400, "Invalid reporting structure", {
          reportingTo: reportingValidation.message,
        });
      }

      if (String(reportingValidation.reportingToId || "") !== String(designation.reportingTo || "")) {
        changes.reportingTo = {
          from: designation.reportingTo,
          to: reportingValidation.reportingToId,
        };
        designation.reportingTo = reportingValidation.reportingToId;
      }
    }

    if (isActive !== undefined && Boolean(isActive) !== designation.isActive) {
      if (!isActive) {
        const activeEmployeeCount = await Employee.countDocuments({
          ...getEmployeeDesignationFilter(designation),
          isActive: true,
        });
        if (activeEmployeeCount > 0) {
          return sendError(res, 409, "Cannot deactivate designation with assigned active employees", {
            designation: `${activeEmployeeCount} active employee(s) are assigned to this designation`,
          });
        }
      }

      changes.isActive = {
        from: designation.isActive,
        to: Boolean(isActive),
      };
      designation.isActive = Boolean(isActive);
    }

    if (Object.keys(changes).length === 0) {
      return sendSuccess(res, 200, "No changes detected", designation);
    }

    designation.updatedBy = req.user.id;
    await designation.save();

    // Log action with changes
    await recordAudit(req, {
      action: "UPDATE",
      entityType: "Designation",
      entityId: designation._id,
      description: `Updated designation: ${designation.name}`,
      changes,
    });

    return sendSuccess(
      res,
      200,
      "Designation updated successfully",
      designation
    );
  } catch (error) {
    if (error?.code === 11000) {
      return sendError(res, 409, "Designation name or code must be unique", {
        duplicate: "Designation name or code already exists",
      });
    }

    if (error?.name === "ValidationError") {
      return sendError(res, 400, "Validation failed", {
        error: error.message,
      });
    }

    console.error("Update designation error:", error);
    return sendError(res, 500, "Failed to update designation", {
      error: error.message,
    });
  }
};

// Delete a designation
export const deleteDesignation = async (req, res) => {
  try {
    const { designationId } = req.params;

    // Check if designation exists
    const designation = await Designation.findById(designationId);
    if (!designation) {
      return sendError(res, 404, "Designation not found", {
        designationId: "The requested designation does not exist",
      });
    }

    if (!designation.isActive) {
      return sendSuccess(res, 200, "Designation already inactive", designation);
    }

    // Check if any employee has this designation
    const employeeCount = await Employee.countDocuments({
      ...getEmployeeDesignationFilter(designation),
      isActive: true,
    });

    if (employeeCount > 0) {
      return sendError(
        res,
        409,
        "Cannot delete designation with assigned employees",
        {
          designation: `${employeeCount} employee(s) are assigned to this designation`,
        }
      );
    }

    // Check if any designation reports to this one
    const childDesignations = await Designation.countDocuments({
      reportingTo: designationId,
      isActive: true,
    });

    if (childDesignations > 0) {
      return sendError(
        res,
        409,
        "Cannot delete designation with child designations",
        {
          designation:
            "Some designations report to this one, reassign them first",
        }
      );
    }

    designation.isActive = false;
    designation.updatedBy = req.user.id;
    await designation.save();

    // Log action
    await recordAudit(req, {
      action: "DEACTIVATE",
      entityType: "Designation",
      entityId: designationId,
      description: `Deactivated designation: ${designation.name}`,
    });

    return sendSuccess(
      res,
      200,
      "Designation deactivated successfully",
      designation
    );
  } catch (error) {
    console.error("Delete designation error:", error);
    return sendError(res, 500, "Failed to delete designation", {
      error: error.message,
    });
  }
};

// Assign designation to employee
export const assignToEmployee = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const payloadForValidation = {
      ...req.body,
      designationId: req.body.designationId || req.params.designationId,
    };

    // Validate input
    const validation = validateDesignationAssignment(payloadForValidation);
    if (!validation.isValid) {
      await session.endSession();
      return sendError(res, 400, "Validation failed", validation.errors);
    }

    const { employeeId, effectiveDate, reason } = req.body;
    const designationId = req.body.designationId || req.params.designationId;

    if (!designationId) {
      await session.endSession();
      return sendError(res, 400, "Validation failed", {
        designationId: "Designation ID is required",
      });
    }

    await session.startTransaction();

    const assignment = await assignDesignationToEmployee({
      actorId: req.user.id,
      employeeId,
      designationId,
      effectiveDate,
      reason,
      session,
    });

    if (assignment.wasNoOp) {
      await session.commitTransaction();
      await session.endSession();
      return sendSuccess(res, 200, "Employee already has this designation", {
        employee: assignment.employee,
        designation: assignment.designation,
        effectiveDate: assignment.effectiveDate,
        reason: assignment.reason,
      });
    }

    const changes = {
      designation: {
        from: assignment.previousDesignation?._id?.toString() || "None",
        to: assignment.designation._id.toString(),
      },
      effectiveDate: assignment.effectiveDate,
      reason: assignment.reason,
    };

    // Log action (include actor metadata inside transaction)
    await recordAudit(
      req,
      {
        userId: req.user.id,
        action: "ASSIGN",
        entityType: "Designation",
        entity: "Designation",
        entityId: designationId,
        description: `Assigned designation ${assignment.designation.name} to employee ${assignment.employee.firstName} ${assignment.employee.lastName}`,
        changes,
      },
      session,
    );

    await session.commitTransaction();
    await session.endSession();

    const populatedEmployee = await Employee.findById(employeeId)
      .populate("departmentId", "name code")
      .populate("manager", "email firstName lastName");

    return sendSuccess(res, 200, "Designation assigned to employee successfully", {
      employee: populatedEmployee,
      designation: assignment.designation,
      effectiveDate: assignment.effectiveDate,
      reason: assignment.reason,
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    await session.endSession();
    if (error?.statusCode) {
      return sendError(res, error.statusCode, error.message, error.details);
    }
    console.error("Assign designation error:", error);
    return sendError(res, 500, "Failed to assign designation", {
      error: error.message,
    });
  }
};
