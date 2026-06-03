import mongoose from "mongoose";
import crypto from "crypto";
import AuditLog from "../models/AuditLog.js";
import { recordAudit } from "../utils/audit.js";
import SalaryHistory from "../models/SalaryHistory.js";
import User from "../models/User.js";
import { assignDesignationToEmployee } from "./designationAssignmentService.js";
import { createUser } from "./userService.js";
import {
  countByQuery,
  createEmployee,
  findByEmail,
  findByEmails,
  findById,
  findWithManager,
  insertManyEmployees,
  listByQuery,
  updateById,
} from "../repositories/employeeRepository.js";
import { maybeProvisionToolsAfterHire } from "./toolProvisioningService.js";
import { escapeRegex } from "./employeeContextService.js";

const applySearchFilter = (query, searchTerm) => {
  const term = String(searchTerm || "").trim();
  if (!term) {
    return query;
  }

  const regex = new RegExp(escapeRegex(term), "i");
  const searchClause = {
    $or: [
      { firstName: regex },
      { lastName: regex },
      { email: regex },
      { department: regex },
      { designation: regex },
    ],
  };

  if (!query || Object.keys(query).length === 0) {
    return searchClause;
  }

  return { $and: [query, searchClause] };
};

const normalizeEmail = (email) => (typeof email === "string" ? email.toLowerCase().trim() : "");

const generateTemporaryPassword = () => {
  const token = crypto.randomBytes(6).toString("hex");
  return `Tmp!${token}Aa1`;
};

const createAuditLog = async (payload, session = null) => {
  const doc = {
    entity: payload.entity || payload.entityType,
    entityType: payload.entityType || payload.entity,
    ...payload,
    actorIp: payload.actorIp || null,
    actorAgent: payload.actorAgent || null,
  };

  if (session) {
    const docs = await recordAudit(null, doc, session);
    return docs ? docs[0] : null;
  }

  return recordAudit(null, doc);
};

const getListQuery = ({ role, userId, filters }) => {
  const query = {};

  if (role === "MANAGER") {
    query.$or = [{ managerID: userId }, { managerId: userId }];
  }

  if (filters.department) {
    query.department = filters.department;
  }

  if (filters.designation) {
    query.designation = filters.designation;
  }

  if (filters.isActive !== undefined) {
    query.isActive = filters.isActive;
  }

  if (filters.cursor) {
    query._id = { $gt: filters.cursor };
  }

  return query;
};

const assertNoManagerLoop = async (employeeId, managerID) => {
  if (!managerID) {
    return;
  }

  if (employeeId && employeeId.toString() === managerID.toString()) {
    const error = new Error("Employee cannot be their own manager");
    error.statusCode = 400;
    throw error;
  }

  let currentManagerId = managerID;
  const visited = new Set();

  while (currentManagerId) {
    const key = currentManagerId.toString();
    if (visited.has(key)) {
      const error = new Error("Invalid manager hierarchy detected");
      error.statusCode = 400;
      throw error;
    }
    visited.add(key);

    if (employeeId && key === employeeId.toString()) {
      const error = new Error("Manager assignment creates a reporting loop");
      error.statusCode = 400;
      throw error;
    }

    const managerRecord = await findWithManager(currentManagerId);
    if (!managerRecord) {
      break;
    }

    currentManagerId = managerRecord.managerID;
  }
};

const createEmployeeWithAudit = async ({ body, actorId, actorRole }) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const normalizedEmail = normalizeEmail(body.email);
    const requestedDesignation = body.designationId || body.designation || "";

    const existingEmployee = await findByEmail(normalizedEmail, session);
    if (existingEmployee) {
      const error = new Error("Employee with this email already exists");
      error.statusCode = 409;
      throw error;
    }

    if (body.managerID) {
      const manager = await findById(body.managerID, null, session);
      if (!manager) {
        const error = new Error("Manager not found");
        error.statusCode = 404;
        throw error;
      }
    }

    const assignedProjectRaw =
      typeof body.assignedProjectId === "string"
        ? body.assignedProjectId.trim()
        : body.assignedProjectId;
    const assignedProjectOid =
      assignedProjectRaw && mongoose.Types.ObjectId.isValid(String(assignedProjectRaw))
        ? new mongoose.Types.ObjectId(String(assignedProjectRaw))
        : null;

    const employeePayload = {
      email: normalizedEmail,
      firstName: body.firstName,
      middleName: body.middleName || '',
      lastName: body.lastName,
      department: body.department || "",
      designation: body.designation || "",
      salary: body.salary || 0,
      managerID: body.managerID || body.managerId || null,
      managerId: body.managerId || body.managerID || null,
      joinDate: body.joinDate || new Date(),
      joiningDate: body.joinDate || new Date(),
      dateOfBirth: body.dateOfBirth || null,
      phoneNumber: body.phoneNumber || body.phone || "",
      phone: body.phoneNumber || body.phone || "",
      employmentType: body.employmentType || "FULL_TIME",
      profileCompletionStatus: "pending_employee",
      isActive: true,
      createdBy: actorId,
      ...(assignedProjectOid ? { assignedProjectId: assignedProjectOid } : {}),
    };

    const employee = await createEmployee(employeePayload, session);
    const temporaryPassword = generateTemporaryPassword();
    let loginAccountCreated = false;

    try {
      await createUser({
        creatorRole: actorRole,
        creatorId: actorId,
        payload: {
          email: normalizedEmail,
          password: temporaryPassword,
          role: body.accountRole || "EMPLOYEE",
          firstName: body.firstName,
          middleName: body.middleName || "",
          lastName: body.lastName,
          employeeId: employee._id,
          mustChangePassword: true,
        },
        session,
      });
      loginAccountCreated = true;
    } catch (error) {
      error.statusCode = error.statusCode || error.status || 400;
      throw error;
    }

    if (requestedDesignation) {
      await assignDesignationToEmployee({
        actorId,
        employeeId: employee._id,
        designationId: requestedDesignation,
        employee,
        effectiveDate: body.joinDate || employee.joinDate || new Date(),
        reason: "INITIAL_HIRE",
        session,
      });
    }

    if (Number.isFinite(body.salary) && body.salary >= 0) {
      await SalaryHistory.create(
        [
          {
            employeeId: employee._id,
            amount: body.salary,
            effectiveFrom: body.joinDate || new Date(),
            changedBy: actorId,
            reason: "INITIAL",
          },
        ],
        { session },
      );
    }

    await createAuditLog(
      {
        userId: actorId,
        action: "employee.create",
        entity: "Employee",
        entityType: "Employee",
        entityId: employee._id.toString(),
        description: `Created employee: ${employee.firstName} ${employee.lastName}`,
        changes: employee.toObject(),
      },
      session,
    );

    await session.commitTransaction();

    if (assignedProjectOid) {
      try {
        await maybeProvisionToolsAfterHire({
          employeeId: employee._id,
          assignedProjectId: assignedProjectOid,
          triggeredByUserId: actorId,
        });
      } catch (provisionError) {
        console.error("Tool provisioning after hire failed:", provisionError);
      }
    }

    return {
      employee,
      loginAccountCreated,
      temporaryPassword,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const listEmployeesWithPagination = async ({ role, userId, queryParams, deptAdminDepartment }) => {
  const page = Number.parseInt(queryParams.page || "1", 10);
  const limit = Number.parseInt(queryParams.limit || "10", 10);
  const filters = {
    department: queryParams.department,
    designation: queryParams.designation,
    isActive:
      queryParams.isActive !== undefined ? queryParams.isActive === "true" : undefined,
    cursor: queryParams.cursor || null,
  };

  // Department Admins are scoped to their own department only
  if (role === "DEPT_ADMIN") {
    const resolvedDept = deptAdminDepartment || null;
    if (!resolvedDept) {
      return {
        employees: [],
        pagination: { page, limit, total: 0, pages: 0 },
      };
    }
    if (!filters.department) {
      filters.department = resolvedDept;
    }
  }

  let query = getListQuery({ role, userId, filters });
  query = applySearchFilter(query, queryParams.search);

  if (filters.cursor) {
    const employees = await listByQuery({
      query,
      select: "-documents",
      sort: { _id: 1 },
      limit,
    });

    // Enrich employees with user role information
    const employeeIds = employees.map((emp) => emp._id);
    const usersByEmployeeId = new Map();
    if (employeeIds.length > 0) {
      const users = await User.find({ employeeId: { $in: employeeIds } }).select("employeeId role").lean();
      users.forEach((user) => {
        if (user.employeeId) {
          usersByEmployeeId.set(user.employeeId.toString(), user.role);
        }
      });
    }

    const enrichedEmployees = employees.map((emp) => {
      const empObj = emp.toObject ? emp.toObject() : emp;
      return {
        ...empObj,
        role: usersByEmployeeId.get(emp._id.toString()) || "EMPLOYEE",
      };
    });

    const lastEmployee = enrichedEmployees[enrichedEmployees.length - 1] || null;

    return {
      employees: enrichedEmployees,
      pagination: {
        cursor: filters.cursor,
        nextCursor: lastEmployee ? lastEmployee._id.toString() : null,
        limit,
      },
    };
  }

  const skip = (page - 1) * limit;
  const [employees, total, activeTotal, inactiveTotal] = await Promise.all([
    listByQuery({
      query,
      select: "-documents",
      sort: { firstName: 1 },
      limit,
      skip,
    }),
    countByQuery(query),
    countByQuery({ ...query, isActive: true }),
    countByQuery({ ...query, isActive: false }),
  ]);

  // Enrich employees with user role information
  const employeeIds = employees.map((emp) => emp._id);
  const usersByEmployeeId = new Map();
  if (employeeIds.length > 0) {
    const users = await User.find({ employeeId: { $in: employeeIds } }).select("employeeId role").lean();
    users.forEach((user) => {
      if (user.employeeId) {
        usersByEmployeeId.set(user.employeeId.toString(), user.role);
      }
    });
  }

  const enrichedEmployees = employees.map((emp) => {
    const empObj = emp.toObject ? emp.toObject() : emp;
    return {
      ...empObj,
      role: usersByEmployeeId.get(emp._id.toString()) || "EMPLOYEE",
    };
  });

  return {
    employees: enrichedEmployees,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 0,
      active: activeTotal,
      inactive: inactiveTotal,
    },
  };
};

const bulkImportEmployees = async ({ employees, actorId }) => {
  const normalizedEmployees = employees.map((employee) => ({
    ...employee,
    email: normalizeEmail(employee.email),
    isActive: true,
    createdBy: actorId,
    updatedBy: actorId,
  }));

  const failedRows = [];
  const seen = new Set();
  const invalidRows = new Set();

  normalizedEmployees.forEach((employee, index) => {
    if (!employee.email) {
      failedRows.push({ rowNumber: index + 1, error: "Email is required" });
      invalidRows.add(index);
      return;
    }

    if (seen.has(employee.email)) {
      failedRows.push({
        rowNumber: index + 1,
        email: employee.email,
        error: "Duplicate email in import payload",
      });
      invalidRows.add(index);
      return;
    }

    seen.add(employee.email);
  });

  const existing = await findByEmails([...seen]);
  const existingSet = new Set(existing.map((e) => e.email));
  const requestedDesignationByEmail = new Map();

  const validEmployees = [];
  normalizedEmployees.forEach((employee, index) => {
    if (invalidRows.has(index)) {
      return;
    }

    if (existingSet.has(employee.email)) {
      failedRows.push({
        rowNumber: index + 1,
        email: employee.email,
        error: "Employee already exists",
      });
      return;
    }

    if (!employee.email) {
      return;
    }

    if (!employee.firstName || !employee.lastName) {
      failedRows.push({
        rowNumber: index + 1,
        email: employee.email,
        error: "First name and last name are required",
      });
      return;
    }

    requestedDesignationByEmail.set(
      employee.email,
      employee.designationId || employee.designation || "",
    );

    validEmployees.push({
      ...employee,
      designation: "",
    });
  });

  let createdEmployees = [];
  if (validEmployees.length > 0) {
    try {
      createdEmployees = await insertManyEmployees(validEmployees, {
        ordered: false,
      });
    } catch (error) {
      if (error?.writeErrors?.length) {
        for (const writeError of error.writeErrors) {
          failedRows.push({
            rowNumber: writeError.index + 1,
            error: writeError.errmsg || "Insert failed",
          });
        }
        createdEmployees = error.insertedDocs || [];
      } else {
        throw error;
      }
    }
  }

  for (const employee of createdEmployees) {
    const requestedDesignation = requestedDesignationByEmail.get(employee.email);
    if (!requestedDesignation) {
      continue;
    }

    try {
      await assignDesignationToEmployee({
        actorId,
        employeeId: employee._id,
        designationId: requestedDesignation,
        employee,
        effectiveDate: employee.joinDate || employee.joiningDate || new Date(),
        reason: "BULK_IMPORT",
      });
    } catch (error) {
      failedRows.push({
        email: employee.email,
        error: error?.message || "Designation assignment failed during import",
      });
    }
  }

  await recordAudit(null, {
    userId: actorId,
    action: "employee.import",
    entity: "Employee",
    entityType: "Employee",
    entityId: "bulk",
    description: `Bulk imported ${createdEmployees.length} employees`,
    changes: { created: createdEmployees.length, failed: failedRows.length },
  });

  return {
    createdEmployees,
    failedRows,
  };
};

const changeEmployeeManager = async ({ employeeId, managerID, actorId }) => {
  const employee = await findById(employeeId);
  if (!employee) {
    const error = new Error("Employee not found");
    error.statusCode = 404;
    throw error;
  }

  const manager = await findById(managerID);
  if (!manager) {
    const error = new Error("Manager not found");
    error.statusCode = 404;
    throw error;
  }

  await assertNoManagerLoop(employeeId, managerID);

  const oldManager = employee.managerID;
  const updatedEmployee = await updateById(employeeId, {
    managerID,
    managerId: managerID,
  });

  await recordAudit(null, {
    userId: actorId,
    action: "employee.change_manager",
    entity: "Employee",
    entityType: "Employee",
    entityId: employeeId,
    description: `Changed manager for ${employee.firstName} ${employee.lastName}`,
    changes: {
      managerID: { old: oldManager, new: managerID },
    },
  });

  return updatedEmployee;
};

const getCurrentSalary = async ({ employeeId }) => {
  const [employee, salaryRecord] = await Promise.all([
    findById(employeeId),
    SalaryHistory.findOne({
      employeeId,
      $or: [{ effectiveTo: null }, { effectiveTo: { $gt: new Date() } }],
    })
      .sort({ effectiveFrom: -1 })
      .lean(),
  ]);

  return { employee, salaryRecord };
};

export {
  createEmployeeWithAudit,
  listEmployeesWithPagination,
  bulkImportEmployees,
  changeEmployeeManager,
  getCurrentSalary,
};
