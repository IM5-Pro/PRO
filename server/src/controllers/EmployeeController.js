import Employee from "../models/Employee.js";
import User from "../models/User.js";
import AuditLog from "../models/AuditLog.js";
import {
  validateEmployeeData,
  validateDocumentUpload,
  validateBulkEmployeeData,
} from "../utils/employeeValidators.js";
import { sendError, sendSuccess } from "../utils/response.js";

/**
 * Create new employee (HR_ADMIN, SUPER_ADMIN only)
 */
const createEmployee = async (req, res) => {
  try {
    const validation = validateEmployeeData(req.body);
    if (!validation.isValid) {
      return sendError(res, 400, "Validation failed", validation.errors);
    }

    const { email, firstName, lastName, department, designation, salary, managerID, joinDate, dateOfBirth } = req.body;

    // Check if employee with same email exists
    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) {
      return sendError(res, 409, "Employee with this email already exists");
    }

    const employee = await Employee.create({
      email,
      firstName,
      lastName,
      department: department || "",
      designation: designation || "",
      salary: salary || 0,
      managerID: managerID || null,
      joinDate: joinDate || new Date(),
      dateOfBirth: dateOfBirth || null,
      isActive: true,
      createdBy: req.user.id,
    });

    // Log action
    await AuditLog.create({
      userId: req.user.id,
      action: "employee.create",
      entityType: "Employee",
      entityId: employee._id,
      description: `Created employee: ${firstName} ${lastName}`,
      changes: employee.toObject(),
    });

    res.status(201).json({
      success: true,
      message: "Employee created successfully",
      data: employee,
    });
  } catch (err) {
    console.error("Create employee error:", err);
    return sendError(res, 500, "Internal server error", { error: err.message });
  }
};

/**
 * List employees with role-based filtering
 */
const listEmployees = async (req, res) => {
  try {
    const { page = 1, limit = 10, department, designation, isActive } = req.query;
    const userRole = req.user.role;
    const userId = req.user.id;

    let query = {};

    // Role-based filtering
    if (userRole === "MANAGER") {
      // Managers see only their team
      query.managerID = userId;
    }

    // Additional filters
    if (department) query.department = department;
    if (designation) query.designation = designation;
    if (isActive !== undefined) query.isActive = isActive === "true";

    const skip = (page - 1) * limit;

    const employees = await Employee.find(query)
      .select("-documents")
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ firstName: 1 });

    const total = await Employee.countDocuments(query);

    res.status(200).json({
      success: true,
      message: "Employees retrieved successfully",
      data: employees,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("List employees error:", err);
    return sendError(res, 500, "Internal server error", { error: err.message });
  }
};

/**
 * Read employee details
 */
const readEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const userRole = req.user.role;
    const userId = req.user.id;

    if (!employeeId) {
      return sendError(res, 400, "Employee ID is required");
    }

    const employee = await Employee.findById(employeeId)
      .populate("managerID", "firstName lastName email designation")
      .populate("createdBy", "email firstName lastName");

    if (!employee) {
      return sendError(res, 404, "Employee not found");
    }

    // Role-based access control
    if (userRole === "EMPLOYEE" && employee._id.toString() !== userId) {
      return sendError(res, 403, "You can only view your own employee record");
    }

    if (userRole === "MANAGER" && employee.managerID.toString() !== userId) {
      return sendError(res, 403, "You can only view your team members");
    }

    res.status(200).json({
      success: true,
      message: "Employee retrieved successfully",
      data: employee,
    });
  } catch (err) {
    console.error("Read employee error:", err);
    return sendError(res, 500, "Internal server error", { error: err.message });
  }
};

/**
 * Update employee (HR_ADMIN, SUPER_ADMIN)
 */
const updateEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;

    if (!employeeId) {
      return sendError(res, 400, "Employee ID is required");
    }

    const validation = validateEmployeeData(req.body, true);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.errors,
      });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const oldData = employee.toObject();
    const updatedEmployee = await Employee.findByIdAndUpdate(
      employeeId,
      {
        ...req.body,
        updatedAt: new Date(),
      },
      { new: true }
    );

    // Log action with changes
    const changes = {};
    Object.keys(req.body).forEach((key) => {
      if (oldData[key] !== req.body[key]) {
        changes[key] = { old: oldData[key], new: req.body[key] };
      }
    });

    await AuditLog.create({
      userId: req.user.id,
      action: "employee.update",
      entityType: "Employee",
      entityId: employeeId,
      description: `Updated employee: ${updatedEmployee.firstName} ${updatedEmployee.lastName}`,
      changes,
    });

    res.status(200).json({
      success: true,
      message: "Employee updated successfully",
      data: updatedEmployee,
    });
  } catch (err) {
    console.error("Update employee error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

/**
 * Deactivate employee (safer than delete)
 */
const deactivateEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: "Employee ID is required",
      });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const updatedEmployee = await Employee.findByIdAndUpdate(
      employeeId,
      { isActive: false },
      { new: true }
    );

    // Log action
    await AuditLog.create({
      userId: req.user.id,
      action: "employee.deactivate",
      entityType: "Employee",
      entityId: employeeId,
      description: `Deactivated employee: ${employee.firstName} ${employee.lastName}`,
    });

    res.status(200).json({
      success: true,
      message: "Employee deactivated successfully",
      data: updatedEmployee,
    });
  } catch (err) {
    console.error("Deactivate employee error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

/**
 * Activate employee
 */
const activateEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: "Employee ID is required",
      });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const updatedEmployee = await Employee.findByIdAndUpdate(
      employeeId,
      { isActive: true },
      { new: true }
    );

    // Log action
    await AuditLog.create({
      userId: req.user.id,
      action: "employee.activate",
      entityType: "Employee",
      entityId: employeeId,
      description: `Activated employee: ${employee.firstName} ${employee.lastName}`,
    });

    res.status(200).json({
      success: true,
      message: "Employee activated successfully",
      data: updatedEmployee,
    });
  } catch (err) {
    console.error("Activate employee error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

/**
 * View employee profile (own or team)
 */
const viewProfile = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const userRole = req.user.role;
    const userId = req.user.id;

    const employee = await Employee.findById(employeeId || userId)
      .populate("managerID", "firstName lastName email")
      .select("-documents");

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // Role-based access
    if (userRole === "EMPLOYEE" && employee._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only view your own profile",
      });
    }

    if (userRole === "MANAGER" && employee.managerID?.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only view your team members' profiles",
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile retrieved successfully",
      data: employee,
    });
  } catch (err) {
    console.error("View profile error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

/**
 * Update own profile (EMPLOYEE)
 */
const updateProfile = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const allowedFields = [
      "phoneNumber",
      "address",
      "city",
      "state",
      "zipCode",
    ];

    // Filter to allow only certain fields
    const updateData = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const updatedEmployee = await Employee.findByIdAndUpdate(
      employeeId,
      updateData,
      { new: true }
    );

    // Log action
    await AuditLog.create({
      userId: req.user.id,
      action: "employee.update_profile",
      entityType: "Employee",
      entityId: employeeId,
      description: `Updated own profile`,
      changes: updateData,
    });

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedEmployee,
    });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

/**
 * Transfer employee to department
 */
const transferDepartment = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { department } = req.body;

    if (!employeeId || !department) {
      return res.status(400).json({
        success: false,
        message: "Employee ID and department are required",
      });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const oldDept = employee.department;
    const updatedEmployee = await Employee.findByIdAndUpdate(
      employeeId,
      { department },
      { new: true }
    );

    // Log action
    await AuditLog.create({
      userId: req.user.id,
      action: "employee.transfer_dept",
      entityType: "Employee",
      entityId: employeeId,
      description: `Transferred ${employee.firstName} ${employee.lastName} from ${oldDept} to ${department}`,
      changes: { department: { old: oldDept, new: department } },
    });

    res.status(200).json({
      success: true,
      message: "Employee transferred successfully",
      data: updatedEmployee,
    });
  } catch (err) {
    console.error("Transfer department error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

/**
 * Change employee designation
 */
const changeDesignation = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { designation } = req.body;

    if (!employeeId || !designation) {
      return res.status(400).json({
        success: false,
        message: "Employee ID and designation are required",
      });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const oldDesignation = employee.designation;
    const updatedEmployee = await Employee.findByIdAndUpdate(
      employeeId,
      { designation },
      { new: true }
    );

    // Log action
    await AuditLog.create({
      userId: req.user.id,
      action: "employee.change_designation",
      entityType: "Employee",
      entityId: employeeId,
      description: `Changed designation for ${employee.firstName} ${employee.lastName} from ${oldDesignation} to ${designation}`,
      changes: { designation: { old: oldDesignation, new: designation } },
    });

    res.status(200).json({
      success: true,
      message: "Designation changed successfully",
      data: updatedEmployee,
    });
  } catch (err) {
    console.error("Change designation error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

/**
 * Change employee manager
 */
const changeManager = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { managerID } = req.body;

    if (!employeeId || !managerID) {
      return res.status(400).json({
        success: false,
        message: "Employee ID and Manager ID are required",
      });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const newManager = await Employee.findById(managerID);
    if (!newManager) {
      return res.status(404).json({
        success: false,
        message: "Manager not found",
      });
    }

    const oldManager = employee.managerID;
    const updatedEmployee = await Employee.findByIdAndUpdate(
      employeeId,
      { managerID },
      { new: true }
    );

    // Log action
    await AuditLog.create({
      userId: req.user.id,
      action: "employee.change_manager",
      entityType: "Employee",
      entityId: employeeId,
      description: `Changed manager for ${employee.firstName} ${employee.lastName}`,
      changes: {
        managerID: { old: oldManager, new: managerID },
      },
    });

    res.status(200).json({
      success: true,
      message: "Manager changed successfully",
      data: updatedEmployee,
    });
  } catch (err) {
    console.error("Change manager error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

/**
 * Upload employee document
 */
const uploadDocument = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { documentType, fileName, fileUrl } = req.body;

    const validation = validateDocumentUpload({ documentType, fileName, fileUrl });
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.errors,
      });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const document = {
      documentType,
      fileName,
      fileUrl,
      uploadedAt: new Date(),
      uploadedBy: req.user.id,
    };

    employee.documents.push(document);
    await employee.save();

    // Log action
    await AuditLog.create({
      userId: req.user.id,
      action: "employee.upload_docs",
      entityType: "Employee",
      entityId: employeeId,
      description: `Uploaded ${documentType} for ${employee.firstName} ${employee.lastName}`,
    });

    res.status(201).json({
      success: true,
      message: "Document uploaded successfully",
      data: {
        employeeId,
        document,
      },
    });
  } catch (err) {
    console.error("Upload document error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

/**
 * Download employee document
 */
const downloadDocument = async (req, res) => {
  try {
    const { employeeId, documentId } = req.params;
    const userRole = req.user.role;
    const userId = req.user.id;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // Role-based access
    if (userRole === "EMPLOYEE" && employee._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only download your own documents",
      });
    }

    const document = employee.documents.id(documentId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Log action
    await AuditLog.create({
      userId: req.user.id,
      action: "employee.download_docs",
      entityType: "Employee",
      entityId: employeeId,
      description: `Downloaded ${document.documentType}`,
    });

    res.status(200).json({
      success: true,
      message: "Document retrieved successfully",
      data: document,
    });
  } catch (err) {
    console.error("Download document error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

/**
 * View salary (role-based)
 */
const viewSalary = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const userRole = req.user.role;
    const userId = req.user.id;

    const employee = await Employee.findById(employeeId).select("firstName lastName email salary");

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // Access control
    if (userRole === "EMPLOYEE" && employee._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only view your own salary",
      });
    }

    if (userRole === "MANAGER") {
      // Manager can view only their team
      const managerCheckEmployee = await Employee.findOne({
        _id: employeeId,
        managerID: userId,
      });
      if (!managerCheckEmployee) {
        return res.status(403).json({
          success: false,
          message: "You can only view your team members' salary",
        });
      }
    }

    // Log action
    await AuditLog.create({
      userId: req.user.id,
      action: "employee.view_salary",
      entityType: "Employee",
      entityId: employeeId,
      description: `Viewed salary for ${employee.firstName} ${employee.lastName}`,
    });

    res.status(200).json({
      success: true,
      message: "Salary retrieved successfully",
      data: employee,
    });
  } catch (err) {
    console.error("View salary error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

/**
 * View employee history
 */
const viewHistory = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const userRole = req.user.role;
    const userId = req.user.id;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // Access control
    if (userRole === "EMPLOYEE" && employee._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only view your own history",
      });
    }

    if (userRole === "MANAGER" && employee.managerID?.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only view your team members' history",
      });
    }

    const history = await AuditLog.find({
      entityType: "Employee",
      entityId: employeeId,
    })
      .populate("userId", "firstName lastName email")
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      message: "History retrieved successfully",
      data: history,
    });
  } catch (err) {
    console.error("View history error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

/**
 * Bulk import employees
 */
const bulkImport = async (req, res) => {
  try {
    const { employees } = req.body;

    const validation = validateBulkEmployeeData(employees);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.errors,
      });
    }

    const created = [];
    const failed = [];

    for (let i = 0; i < employees.length; i++) {
      try {
        const emp = employees[i];

        // Check if employee exists
        const existing = await Employee.findOne({ email: emp.email });
        if (existing) {
          failed.push({
            rowNumber: i + 1,
            email: emp.email,
            error: "Employee already exists",
          });
          continue;
        }

        const newEmployee = await Employee.create({
          ...emp,
          isActive: true,
          createdBy: req.user.id,
        });

        created.push(newEmployee);
      } catch (err) {
        failed.push({
          rowNumber: i + 1,
          error: err.message,
        });
      }
    }

    // Log action
    await AuditLog.create({
      userId: req.user.id,
      action: "employee.import",
      entityType: "Employee",
      description: `Bulk imported ${created.length} employees`,
      changes: { created: created.length, failed: failed.length },
    });

    res.status(200).json({
      success: true,
      message: `Imported ${created.length} employees`,
      data: {
        created: created.length,
        failed: failed.length,
        createdEmployees: created,
        failedRows: failed,
      },
    });
  } catch (err) {
    console.error("Bulk import error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

/**
 * Bulk update employees
 */
const bulkUpdate = async (req, res) => {
  try {
    const { updates } = req.body; // Array of { employeeId, fields }

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Updates must be a non-empty array",
      });
    }

    const updated = [];
    const failed = [];

    for (const update of updates) {
      try {
        const { employeeId, ...fields } = update;

        const employee = await Employee.findByIdAndUpdate(employeeId, fields, {
          new: true,
        });

        if (!employee) {
          failed.push({ employeeId, error: "Employee not found" });
          continue;
        }

        updated.push(employee);

        // Log action
        await AuditLog.create({
          userId: req.user.id,
          action: "employee.bulk_update",
          entityType: "Employee",
          entityId: employeeId,
          changes: fields,
        });
      } catch (err) {
        failed.push({ employeeId: update.employeeId, error: err.message });
      }
    }

    res.status(200).json({
      success: true,
      message: `Updated ${updated.length} employees`,
      data: {
        updated: updated.length,
        failed: failed.length,
        updatedEmployees: updated,
        failedUpdates: failed,
      },
    });
  } catch (err) {
    console.error("Bulk update error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

/**
 * Export employees
 */
const exportEmployees = async (req, res) => {
  try {
    const { format = "json", department, designation } = req.query;

    let query = {};
    if (department) query.department = department;
    if (designation) query.designation = designation;

    const employees = await Employee.find(query);

    // Log action
    await AuditLog.create({
      userId: req.user.id,
      action: "employee.export",
      entityType: "Employee",
      description: `Exported ${employees.length} employees in ${format} format`,
    });

    if (format === "csv") {
      // Convert to CSV format
      const csv = convertToCSV(employees);
      res.header("Content-Type", "text/csv");
      res.header("Content-Disposition", "attachment; filename=employees.csv");
      res.send(csv);
    } else {
      res.status(200).json({
        success: true,
        message: "Employees exported successfully",
        data: employees,
        count: employees.length,
      });
    }
  } catch (err) {
    console.error("Export employees error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

/**
 * Helper function to convert to CSV
 */
const convertToCSV = (employees) => {
  if (!employees || employees.length === 0) return "";

  const headers = [
    "ID",
    "First Name",
    "Last Name",
    "Email",
    "Department",
    "Designation",
    "Salary",
    "Join Date",
    "Active",
  ];

  const rows = employees.map((emp) => [
    emp._id,
    emp.firstName,
    emp.lastName,
    emp.email,
    emp.department,
    emp.designation,
    emp.salary,
    emp.joinDate,
    emp.isActive,
  ]);

  return [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");
};

export {
  createEmployee,
  listEmployees,
  readEmployee,
  updateEmployee,
  deactivateEmployee,
  activateEmployee,
  viewProfile,
  updateProfile,
  transferDepartment,
  changeDesignation,
  changeManager,
  uploadDocument,
  downloadDocument,
  viewSalary,
  viewHistory,
  bulkImport,
  bulkUpdate,
  exportEmployees,
};
