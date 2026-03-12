import Employee from "../models/Employee.js";
import User from "../models/User.js";
import AuditLog from "../models/AuditLog.js";
import {
  validateEmployeeData,
  validateDocumentUpload,
  validateBulkEmployeeData,
} from "../utils/employeeValidators.js";
import { sendError, sendSuccess } from "../utils/response.js";
import {
  bulkImportEmployees,
  changeEmployeeManager,
  createEmployeeWithAudit,
  getCurrentSalary,
  listEmployeesWithPagination,
} from "../services/employeeService.js";
import { generateSignedDocumentUrl } from "../utils/documentSigner.js";

const resolveCurrentEmployee = async (userId) => {
  let employee = await Employee.findById(userId)
    .populate("managerID", "firstName lastName email designation")
    .populate("managerId", "firstName lastName email designation");

  if (!employee) {
    employee = await Employee.findOne({ createdBy: userId })
      .populate("managerID", "firstName lastName email designation")
      .populate("managerId", "firstName lastName email designation");
  }

  return employee;
};

/**
 * Create new employee (HR_ADMIN, SUPER_ADMIN only)
 */
const createEmployee = async (req, res) => {
  try {
    const validation = validateEmployeeData(req.body);
    if (!validation.isValid) {
      return sendError(res, 400, "Validation failed", validation.errors);
    }

    const employee = await createEmployeeWithAudit({
      body: req.body,
      actorId: req.user.id,
    });

    return sendSuccess(res, 201, "Employee created successfully", {
      data: employee,
    });
  } catch (err) {
    console.error("Create employee error:", err);
    if (err.statusCode) {
      return sendError(res, err.statusCode, err.message);
    }
    return sendError(res, 500, "Internal server error", { error: err.message });
  }
};

/**
 * List employees with role-based filtering
 */
const listEmployees = async (req, res) => {
  try {
    const result = await listEmployeesWithPagination({
      role: req.user.role,
      userId: req.user.id,
      queryParams: req.query,
    });

    return sendSuccess(res, 200, "Employees retrieved successfully", {
      data: result.employees,
      pagination: result.pagination,
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

    const employeeManagerId = employee.managerId || employee.managerID;
    if (userRole === "MANAGER" && employeeManagerId?.toString() !== userId) {
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
 * View my own profile
 */
const myProfile = async (req, res) => {
  try {
    const employee = await resolveCurrentEmployee(req.user.id);
    if (!employee) {
      return sendError(res, 404, "Employee profile not found for current user");
    }

    return sendSuccess(res, 200, "Profile retrieved successfully", {
      data: employee,
    });
  } catch (err) {
    console.error("My profile error:", err);
    return sendError(res, 500, "Internal server error", { error: err.message });
  }
};

/**
 * View direct reports of current manager
 */
const myTeam = async (req, res) => {
  try {
    const { page = 1, limit = 20, isActive } = req.query;
    const skip = (Number.parseInt(page, 10) - 1) * Number.parseInt(limit, 10);

    const selfEmployee = await resolveCurrentEmployee(req.user.id);
    const managerIdentifiers = [req.user.id];
    if (selfEmployee?._id) {
      managerIdentifiers.push(selfEmployee._id);
    }

    const filter = {
      $or: [
        { managerID: { $in: managerIdentifiers } },
        { managerId: { $in: managerIdentifiers } },
      ],
    };

    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    const [teamMembers, total] = await Promise.all([
      Employee.find(filter)
        .select("firstName lastName email designation department status isActive managerID managerId")
        .sort({ firstName: 1 })
        .skip(skip)
        .limit(Number.parseInt(limit, 10)),
      Employee.countDocuments(filter),
    ]);

    return sendSuccess(res, 200, "Team members retrieved successfully", {
      data: teamMembers,
      pagination: {
        page: Number.parseInt(page, 10),
        limit: Number.parseInt(limit, 10),
        total,
        pages: Math.ceil(total / Number.parseInt(limit, 10)),
      },
    });
  } catch (err) {
    console.error("My team error:", err);
    return sendError(res, 500, "Internal server error", { error: err.message });
  }
};

/**
 * View current employee's manager
 */
const myManager = async (req, res) => {
  try {
    const selfEmployee = await resolveCurrentEmployee(req.user.id);
    if (!selfEmployee) {
      return sendError(res, 404, "Employee profile not found for current user");
    }

    const managerRef = selfEmployee.managerId || selfEmployee.managerID;
    if (!managerRef) {
      return sendError(res, 404, "Manager not assigned");
    }

    const manager = await Employee.findById(managerRef)
      .select("firstName lastName email designation department status isActive")
      .lean();

    if (!manager) {
      return sendError(res, 404, "Manager not found");
    }

    return sendSuccess(res, 200, "Manager retrieved successfully", {
      data: manager,
    });
  } catch (err) {
    console.error("My manager error:", err);
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

    const employeeManagerId = employee.managerId || employee.managerID;
    if (userRole === "MANAGER" && employeeManagerId?.toString() !== userId) {
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
      "addressLine",
      "city",
      "state",
      "zipCode",
      "emergencyContact",
    ];

    // Filter to allow only certain fields
    const updateData = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    if (typeof req.body.address === "string") {
      updateData.addressLine = req.body.address;
      updateData.address = {
        street: req.body.address,
        city: req.body.city || "",
        state: req.body.state || "",
        country: "",
        zipCode: req.body.zipCode || "",
      };
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
    const managerID = req.body.managerID || req.body.managerId;

    if (!employeeId || !managerID) {
      return res.status(400).json({
        success: false,
        message: "Employee ID and Manager ID are required",
      });
    }

    const updatedEmployee = await changeEmployeeManager({
      employeeId,
      managerID,
      actorId: req.user.id,
    });

    return sendSuccess(res, 200, "Manager changed successfully", {
      data: updatedEmployee,
    });
  } catch (err) {
    console.error("Change manager error:", err);
    if (err.statusCode) {
      return sendError(res, err.statusCode, err.message);
    }
    return sendError(res, 500, "Internal server error", { error: err.message });
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

    return sendSuccess(res, 200, "Document retrieved successfully", {
      data: {
        ...document.toObject(),
        downloadUrl: generateSignedDocumentUrl(document.fileUrl),
      },
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

    const { employee, salaryRecord } = await getCurrentSalary({ employeeId });

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
        $or: [{ managerID: userId }, { managerId: userId }],
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

    return sendSuccess(res, 200, "Salary retrieved successfully", {
      data: {
        employeeId: employee._id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        salary: salaryRecord?.amount ?? employee.salary ?? 0,
        currency: salaryRecord?.currency || "INR",
        effectiveFrom: salaryRecord?.effectiveFrom || null,
      },
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

    const employeeManagerId = employee.managerId || employee.managerID;
    if (userRole === "MANAGER" && employeeManagerId?.toString() !== userId) {
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

    const { createdEmployees, failedRows } = await bulkImportEmployees({
      employees,
      actorId: req.user.id,
    });

    return sendSuccess(res, 200, `Imported ${createdEmployees.length} employees`, {
      data: {
        created: createdEmployees.length,
        failed: failedRows.length,
        createdEmployees,
        failedRows,
      },
    });
  } catch (err) {
    console.error("Bulk import error:", err);
    return sendError(res, 500, "Internal server error", { error: err.message });
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
  myProfile,
  myTeam,
  myManager,
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
