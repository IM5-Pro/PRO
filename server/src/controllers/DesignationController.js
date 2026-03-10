import Designation from "../models/Designation.js";
import Employee from "../models/Employee.js";
import AuditLog from "../models/AuditLog.js";
import {
  validateDesignation,
  validateDesignationAssignment,
} from "../utils/designationValidators.js";
import { sendError, sendSuccess } from "../utils/response.js";

// Create a new designation
export const createDesignation = async (req, res) => {
  try {
    // Validate input
    const validation = validateDesignation(req.body, false);
    if (!validation.isValid) {
      return sendError(res, 400, "Validation failed", validation.errors);
    }

    const { name, description, level, salary, department, reportingTo } =
      req.body;

    // Check if designation already exists
    const existingDesignation = await Designation.findOne({
      name: { $regex: `^${name}$`, $options: "i" },
    });
    if (existingDesignation) {
      return sendError(
        res,
        409,
        "Designation with this name already exists",
        { name: "Designation name must be unique" }
      );
    }

    // If reportingTo is provided, validate it exists
    if (reportingTo) {
      const parentDesignation = await Designation.findById(reportingTo);
      if (!parentDesignation) {
        return sendError(res, 404, "Reporting designation not found", {
          reportingTo: "Designation to report to does not exist",
        });
      }
    }

    // Create new designation
    const designation = new Designation({
      name: name.trim(),
      description: description?.trim() || "",
      level,
      salary,
      department: department?.trim() || "",
      reportingTo: reportingTo || null,
      createdBy: req.user.id,
    });

    await designation.save();

    // Log action
    await AuditLog.create({
      userId: req.user.id,
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
    console.error("Create designation error:", error);
    return sendError(res, 500, "Failed to create designation", {
      error: error.message,
    });
  }
};

// List all designations (with role-based filtering)
export const listDesignations = async (req, res) => {
  try {
    const { page = 1, limit = 10, department, isActive = true } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

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
      filter.department = { $regex: department, $options: "i" };
    }

    // Get total count
    const total = await Designation.countDocuments(filter);

    // Get paginated results
    const designations = await Designation.find(filter)
      .populate("reportingTo", "name level")
      .populate("createdBy", "email firstName lastName")
      .populate("updatedBy", "email firstName lastName")
      .sort({ level: 1, name: 1 })
      .limit(parseInt(limit))
      .skip(skip);

    return sendSuccess(res, 200, "Designations retrieved successfully", {
      designations,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
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
      .populate("reportingTo", "name level")
      .populate("createdBy", "email firstName lastName")
      .populate("updatedBy", "email firstName lastName");

    if (!designation) {
      return sendError(res, 404, "Designation not found", {
        designationId: "The requested designation does not exist",
      });
    }

    // Get employee count in this designation
    const employeeCount = await Employee.countDocuments({
      designation: designationId,
      isActive: true,
    });

    const designationData = designation.toObject();
    designationData.employeeCount = employeeCount;

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

    const { name, description, level, salary, department, reportingTo } =
      req.body;

    // Check if designation exists
    const designation = await Designation.findById(designationId);
    if (!designation) {
      return sendError(res, 404, "Designation not found", {
        designationId: "The requested designation does not exist",
      });
    }

    // Track changes for audit log
    const changes = {};

    if (name && name !== designation.name) {
      // Check for duplicate name
      const existingDesignation = await Designation.findOne({
        _id: { $ne: designationId },
        name: { $regex: `^${name}$`, $options: "i" },
      });
      if (existingDesignation) {
        return sendError(
          res,
          409,
          "Designation with this name already exists",
          { name: "Designation name must be unique" }
        );
      }
      changes.name = { from: designation.name, to: name };
      designation.name = name.trim();
    }

    if (description !== undefined && description !== designation.description) {
      changes.description = { from: designation.description, to: description };
      designation.description = description?.trim() || "";
    }

    if (level !== undefined && level !== designation.level) {
      changes.level = { from: designation.level, to: level };
      designation.level = level;
    }

    if (salary !== undefined && salary !== designation.salary) {
      changes.salary = { from: designation.salary, to: salary };
      designation.salary = salary;
    }

    if (
      department !== undefined &&
      department !== designation.department
    ) {
      changes.department = { from: designation.department, to: department };
      designation.department = department?.trim() || "";
    }

    if (reportingTo !== undefined) {
      // Validate reportingTo designation exists if provided
      if (reportingTo) {
        const parentDesignation = await Designation.findById(reportingTo);
        if (!parentDesignation) {
          return sendError(res, 404, "Reporting designation not found", {
            reportingTo: "Designation to report to does not exist",
          });
        }
        // Prevent circular reporting
        if (reportingTo.toString() === designationId) {
          return sendError(res, 400, "Invalid reporting structure", {
            reportingTo: "A designation cannot report to itself",
          });
        }
      }

      if (reportingTo !== designation.reportingTo?.toString()) {
        changes.reportingTo = {
          from: designation.reportingTo,
          to: reportingTo || null,
        };
        designation.reportingTo = reportingTo || null;
      }
    }

    designation.updatedBy = req.user.id;
    await designation.save();

    // Log action with changes
    await AuditLog.create({
      userId: req.user.id,
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

    // Check if any employee has this designation
    const employeeCount = await Employee.countDocuments({
      designation: designationId,
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

    const deletedDesignation = await Designation.findByIdAndDelete(
      designationId
    );

    // Log action
    await AuditLog.create({
      userId: req.user.id,
      action: "DELETE",
      entityType: "Designation",
      entityId: designationId,
      description: `Deleted designation: ${deletedDesignation.name}`,
    });

    return sendSuccess(
      res,
      200,
      "Designation deleted successfully",
      deletedDesignation
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
  try {
    // Validate input
    const validation = validateDesignationAssignment(req.body);
    if (!validation.isValid) {
      return sendError(res, 400, "Validation failed", validation.errors);
    }

    const { employeeId, designationId, effectiveDate } = req.body;

    // Check if designation exists
    const designation = await Designation.findById(designationId);
    if (!designation) {
      return sendError(res, 404, "Designation not found", {
        designationId: "The requested designation does not exist",
      });
    }

    // Check if employee exists
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return sendError(res, 404, "Employee not found", {
        employeeId: "The requested employee does not exist",
      });
    }

    // Track changes for audit log
    const changes = {
      designation: {
        from: employee.designation?.toString() || "None",
        to: designation._id.toString(),
      },
      effectiveDate,
    };

    // Update employee designation
    const oldDesignation = employee.designation;
    employee.designation = designationId;
    employee.updatedBy = req.user.id;
    await employee.save();

    // Update employee counts
    if (oldDesignation) {
      await Designation.findByIdAndUpdate(
        oldDesignation,
        { $inc: { employeeCount: -1 } },
        { new: true }
      );
    }

    await Designation.findByIdAndUpdate(
      designationId,
      { $inc: { employeeCount: 1 } },
      { new: true }
    );

    // Log action
    await AuditLog.create({
      userId: req.user.id,
      action: "ASSIGN",
      entityType: "Designation",
      entityId: designationId,
      description: `Assigned designation ${designation.name} to employee ${employee.firstName} ${employee.lastName}`,
      changes,
    });

    const populatedEmployee = await Employee.findById(employeeId)
      .populate("designation")
      .populate("department")
      .populate("manager", "email firstName lastName");

    return sendSuccess(res, 200, "Designation assigned to employee successfully", {
      employee: populatedEmployee,
      designation,
      effectiveDate,
    });
  } catch (error) {
    console.error("Assign designation error:", error);
    return sendError(res, 500, "Failed to assign designation", {
      error: error.message,
    });
  }
};
