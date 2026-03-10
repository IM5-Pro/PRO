import Department from "../models/Department.js";
import { sendError, sendSuccess } from "../utils/response.js";

// create a new department
const createDepartment = async (req, res) => {
  try {
    const { name, managerId } = req.body;
    const department = await Department.create({ name, managerId });
    return sendSuccess(res, 201, "Department created successfully", { data: department });
  } catch (err) {
    if (err.code === 11000) {
      return sendError(res, 400, "Department name already exists");
    }
    return sendError(res, 500, "Internal server error", err);
  }
};

// list all departments (or filtered by query parameters later)
const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find();
    return sendSuccess(res, 200, "Departments retrieved successfully", { data: departments });
  } catch (err) {
    return sendError(res, 500, "Internal server error", err);
  }
};

// read single department by id
const readDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
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
    const { name } = req.body;
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      { $set: { name } },
      { new: true },
    );
    if (!department)
      return sendError(res, 404, "Department not found");
    return sendSuccess(res, 200, "Department updated successfully", { data: department });
  } catch (err) {
    return sendError(res, 500, "Internal server error", err);
  }
};

// delete department (hard delete – you may soft delete in real app)
const deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findByIdAndDelete(req.params.id);
    if (!department)
      return sendError(res, 404, "Department not found");
    return sendSuccess(res, 200, "Department deleted");
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
      { $set: { managerId } },
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
