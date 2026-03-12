import mongoose from "mongoose";
import AuditLog from "../models/AuditLog.js";
import SalaryHistory from "../models/SalaryHistory.js";
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

const normalizeEmail = (email) => (typeof email === "string" ? email.toLowerCase().trim() : "");

const createAuditLog = (payload, session = null) => {
  return AuditLog.create([payload], { session }).then((docs) => docs[0]);
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

const createEmployeeWithAudit = async ({ body, actorId }) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const normalizedEmail = normalizeEmail(body.email);

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

    const employeePayload = {
      email: normalizedEmail,
      firstName: body.firstName,
      lastName: body.lastName,
      department: body.department || "",
      designation: body.designation || "",
      salary: body.salary || 0,
      managerID: body.managerID || body.managerId || null,
      managerId: body.managerId || body.managerID || null,
      joinDate: body.joinDate || new Date(),
      dateOfBirth: body.dateOfBirth || null,
      isActive: true,
      createdBy: actorId,
    };

    const employee = await createEmployee(employeePayload, session);

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
    return employee;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const listEmployeesWithPagination = async ({ role, userId, queryParams }) => {
  const page = Number.parseInt(queryParams.page || "1", 10);
  const limit = Number.parseInt(queryParams.limit || "10", 10);
  const filters = {
    department: queryParams.department,
    designation: queryParams.designation,
    isActive:
      queryParams.isActive !== undefined ? queryParams.isActive === "true" : undefined,
    cursor: queryParams.cursor || null,
  };

  const query = getListQuery({ role, userId, filters });

  if (filters.cursor) {
    const employees = await listByQuery({
      query,
      select: "-documents",
      sort: { _id: 1 },
      limit,
    });

    const lastEmployee = employees[employees.length - 1] || null;

    return {
      employees,
      pagination: {
        cursor: filters.cursor,
        nextCursor: lastEmployee ? lastEmployee._id.toString() : null,
        limit,
      },
    };
  }

  const skip = (page - 1) * limit;
  const [employees, total] = await Promise.all([
    listByQuery({
      query,
      select: "-documents",
      sort: { firstName: 1 },
      limit,
      skip,
    }),
    countByQuery(query),
  ]);

  return {
    employees,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

const bulkImportEmployees = async ({ employees, actorId }) => {
  const normalizedEmployees = employees.map((employee) => ({
    ...employee,
    email: normalizeEmail(employee.email),
    isActive: true,
    createdBy: actorId,
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

    validEmployees.push(employee);
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

  await AuditLog.create({
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

  await AuditLog.create({
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
