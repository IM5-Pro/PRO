import Department from "../models/Department.js";
import Employee from "../models/Employee.js";
import { sendError, sendSuccess } from "../utils/response.js";

const MAX_LIMIT = 100;

const escapeRegex = (value) => String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeDepartmentCode = (value) => String(value || "")
  .trim()
  .toUpperCase()
  .replace(/[^A-Z0-9]/g, "");

const generateBaseDepartmentCode = (name) => {
  const words = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return "DEPT";
  }

  if (words.length === 1) {
    return normalizeDepartmentCode(words[0]).slice(0, 6) || "DEPT";
  }

  const initials = words.map((word) => word[0]).join("");
  return normalizeDepartmentCode(initials).slice(0, 6) || normalizeDepartmentCode(words.join("")).slice(0, 6) || "DEPT";
};

const resolveUniqueDepartmentCode = async ({ code, name, excludeDepartmentId = null }) => {
  const baseCode = normalizeDepartmentCode(code) || generateBaseDepartmentCode(name);
  let nextCode = baseCode;
  let suffix = 1;

  while (true) {
    const query = { code: nextCode };
    if (excludeDepartmentId) {
      query._id = { $ne: excludeDepartmentId };
    }

    const existing = await Department.exists(query);
    if (!existing) {
      return nextCode;
    }

    nextCode = `${baseCode}${suffix}`;
    suffix += 1;
  }
};

const checkCircularHierarchy = async (parentId, currentId) => {
  const visited = new Set();
  let cursor = parentId;

  while (cursor) {
    const cursorKey = String(cursor);
    if (visited.has(cursorKey)) {
      return true;
    }
    visited.add(cursorKey);

    if (cursorKey === String(currentId)) {
      return true;
    }

    const node = await Department.findById(cursor).select("_id parentDepartmentId").lean();
    if (!node || !node.parentDepartmentId) {
      break;
    }

    cursor = node.parentDepartmentId;
  }

  return false;
};

const validateParentDepartment = async (parentDepartmentId, currentDepartmentId = null) => {
  if (!parentDepartmentId) {
    return { isValid: true, normalizedParentId: null };
  }

  if (currentDepartmentId && String(parentDepartmentId) === String(currentDepartmentId)) {
    return { isValid: false, message: "Department cannot be its own parent" };
  }

  const parentDepartment = await Department.findById(parentDepartmentId).select("_id").lean();
  if (!parentDepartment) {
    return { isValid: false, message: "Parent department not found" };
  }

  const hasCircularHierarchy = currentDepartmentId
    ? await checkCircularHierarchy(parentDepartment._id, currentDepartmentId)
    : false;

  if (hasCircularHierarchy) {
    return { isValid: false, message: "Circular department hierarchy detected" };
  }

  return { isValid: true, normalizedParentId: parentDepartment._id };
};

const validateDepartmentDeactivation = async (departmentId, departmentName) => {
  const childDepartment = await Department.findOne({
    parentDepartmentId: departmentId,
    status: "active",
  }).select("_id");

  if (childDepartment) {
    return { isValid: false, message: "Cannot delete department with child departments" };
  }

  const employeeExists = await Employee.exists({
    isActive: true,
    $or: [
      { departmentId },
      { department: departmentName },
    ],
  });

  if (employeeExists) {
    return { isValid: false, message: "Department has employees assigned" };
  }

  return { isValid: true };
};

// create a new department
const createDepartment = async (req, res) => {
  try {
    const { name, code, managerId, parentDepartmentId } = req.body;

    const normalizedName = String(name || "").trim();
    if (!normalizedName) {
      return sendError(res, 400, "Department name is required");
    }

    const parentValidation = await validateParentDepartment(parentDepartmentId);
    if (!parentValidation.isValid) {
      return sendError(res, 400, parentValidation.message);
    }

    const uniqueCode = await resolveUniqueDepartmentCode({
      code,
      name: normalizedName,
    });

    const department = await Department.create({
      name: normalizedName,
      code: uniqueCode,
      managerId,
      parentDepartmentId: parentValidation.normalizedParentId,
      createdBy: req.user?.id,
      updatedBy: req.user?.id,
    });
    return sendSuccess(res, 201, "Department created successfully", { data: department });
  } catch (err) {
    if (err.code === 11000) {
      return sendError(res, 400, "Department name or code already exists");
    }
    return sendError(res, 500, "Internal server error", err);
  }
};

// list departments with pagination and search
const getDepartments = async (req, res) => {
  try {
    const parsedPage = Number.parseInt(req.query.page, 10);
    const parsedLimit = Number.parseInt(req.query.limit, 10);
    const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    const limit = Number.isFinite(parsedLimit) && parsedLimit > 0
      ? Math.min(parsedLimit, MAX_LIMIT)
      : 10;
    const skip = (page - 1) * limit;

    const { search, status, parentDepartmentId } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    if (parentDepartmentId !== undefined) {
      query.parentDepartmentId = parentDepartmentId === "null" ? null : parentDepartmentId;
    }

    if (search) {
      const safeSearch = escapeRegex(search);
      query.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { code: { $regex: safeSearch, $options: "i" } },
      ];
    }

    const [departments, total] = await Promise.all([
      Department.find(query)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .populate("parentDepartmentId", "name code")
        .populate("managerId", "firstName lastName email"),
      Department.countDocuments(query),
    ]);

    return sendSuccess(res, 200, "Departments retrieved successfully", {
      data: departments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    return sendError(res, 500, "Internal server error", err);
  }
};

// read single department by id
const readDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate("parentDepartmentId", "name code")
      .populate("managerId", "firstName lastName email");
    if (!department)
      return sendError(res, 404, "Department not found");
    return sendSuccess(res, 200, "Department retrieved successfully", { data: department });
  } catch (err) {
    return sendError(res, 500, "Internal server error", err);
  }
};

// update department metadata
const updateDepartment = async (req, res) => {
  try {
    const { name, code, parentDepartmentId, managerId, status } = req.body;
    const existingDepartment = await Department.findById(req.params.id).select("_id name status").lean();
    if (!existingDepartment) {
      return sendError(res, 404, "Department not found");
    }

    const updatePayload = {};
    if (name !== undefined) {
      const normalizedName = String(name || "").trim();
      if (!normalizedName) {
        return sendError(res, 400, "Department name cannot be empty");
      }
      updatePayload.name = normalizedName;
    }

    if (code !== undefined || name !== undefined) {
      const uniqueCode = await resolveUniqueDepartmentCode({
        code,
        name: name !== undefined ? name : undefined,
        excludeDepartmentId: req.params.id,
      });
      updatePayload.code = uniqueCode;
    }

    if (managerId !== undefined) {
      updatePayload.managerId = managerId;
    }

    if (parentDepartmentId !== undefined) {
      const parentValidation = await validateParentDepartment(parentDepartmentId, req.params.id);
      if (!parentValidation.isValid) {
        return sendError(res, 400, parentValidation.message);
      }
      updatePayload.parentDepartmentId = parentValidation.normalizedParentId;
    }

    if (status !== undefined) {
      const normalizedStatus = String(status).toLowerCase();
      if (!["active", "inactive"].includes(normalizedStatus)) {
        return sendError(res, 400, "Status must be either active or inactive");
      }

      if (normalizedStatus === "inactive" && existingDepartment.status !== "inactive") {
        const deactivationValidation = await validateDepartmentDeactivation(
          existingDepartment._id,
          existingDepartment.name,
        );
        if (!deactivationValidation.isValid) {
          return sendError(res, 400, deactivationValidation.message);
        }
      }

      updatePayload.status = normalizedStatus;
    }

    if (Object.keys(updatePayload).length === 0) {
      return sendError(res, 400, "No fields provided for update");
    }

    updatePayload.updatedBy = req.user?.id;

    const department = await Department.findByIdAndUpdate(
      req.params.id,
      { $set: updatePayload },
      { new: true },
    );
    return sendSuccess(res, 200, "Department updated successfully", { data: department });
  } catch (err) {
    if (err.code === 11000) {
      return sendError(res, 400, "Department name or code already exists");
    }
    return sendError(res, 500, "Internal server error", err);
  }
};

// delete department (soft delete)
const deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department)
      return sendError(res, 404, "Department not found");

    if (department.status === "inactive") {
      return sendSuccess(res, 200, "Department already inactive", { data: department });
    }

    const deactivationValidation = await validateDepartmentDeactivation(
      req.params.id,
      department.name,
    );
    if (!deactivationValidation.isValid) {
      return sendError(res, 400, deactivationValidation.message);
    }

    await Department.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          status: "inactive",
          updatedBy: req.user?.id,
        },
      },
      { new: true },
    );

    return sendSuccess(res, 200, "Department marked as inactive");
  } catch (err) {
    return sendError(res, 500, "Internal server error", err);
  }
};

// assign or change manager of a department
const assignManager = async (req, res) => {
  try {
    const { managerId } = req.body;
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          managerId,
          updatedBy: req.user?.id,
        },
      },
      { new: true },
    );
    if (!department)
      return sendError(res, 404, "Department not found");
    return sendSuccess(res, 200, "Manager assigned successfully", { data: department });
  } catch (err) {
    return sendError(res, 500, "Internal server error", err);
  }
};

export default {
  createDepartment,
  getDepartments,
  readDepartment,
  updateDepartment,
  deleteDepartment,
  assignManager,
};
