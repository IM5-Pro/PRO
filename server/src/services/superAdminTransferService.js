import User from "../models/User.js";
import Employee from "../models/Employee.js";
import Department from "../models/Department.js";
import RoleTransfer from "../models/RoleTransfer.js";
import Roles from "../constants/roles.js";
import { recordAudit } from "../utils/audit.js";
import { invalidateSession } from "./authService.js";

const UNASSIGNED_DEPARTMENT = "Unassigned";

const formatPersonName = (user, employee) => {
  const fromUser = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
  if (fromUser) return fromUser;

  const fromEmployee = [employee?.firstName, employee?.middleName, employee?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (fromEmployee) return fromEmployee;

  return user?.email || employee?.email || "Unknown";
};

const normalizeAuditLog = (auditResult) => {
  if (Array.isArray(auditResult)) {
    return auditResult[0] || null;
  }
  return auditResult || null;
};

const resolveDepartmentName = (employee, departmentNameById) => {
  if (employee?.departmentId && departmentNameById.has(String(employee.departmentId))) {
    return departmentNameById.get(String(employee.departmentId));
  }

  const department = String(employee?.department || "").trim();
  return department || UNASSIGNED_DEPARTMENT;
};

const mapRecipientRecord = (employee, user, currentUserId) => {
  const department = employee.departmentName;
  const hasUserAccount = Boolean(user);
  const isCurrentUser = hasUserAccount && String(user._id) === String(currentUserId);

  return {
    id: hasUserAccount ? String(user._id) : null,
    employeeId: String(employee._id),
    name: formatPersonName(user, employee),
    email: user?.email || employee.email || "",
    designation: employee.designation || "",
    department,
    role: user?.role || null,
    status: employee.status || null,
    isActive: employee.isActive !== false,
    hasUserAccount,
    canReceiveTransfer: hasUserAccount && !isCurrentUser,
    isCurrentUser,
  };
};

const groupRecipientsByDepartment = (recipients) => {
  const departmentMap = new Map();

  recipients.forEach((recipient) => {
    const departmentName = recipient.department || UNASSIGNED_DEPARTMENT;
    if (!departmentMap.has(departmentName)) {
      departmentMap.set(departmentName, []);
    }
    departmentMap.get(departmentName).push(recipient);
  });

  return Array.from(departmentMap.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, employees]) => ({
      name,
      count: employees.length,
      employees,
    }));
};

export const listEligibleRecipients = async (currentUserId, filters = {}) => {
  const employeeQuery = {};

  if (filters.department) {
    const departmentFilter = String(filters.department).trim();
    const matchedDepartments = await Department.find({
      $or: [
        { name: departmentFilter },
        { code: departmentFilter.toUpperCase() },
      ],
    }).select("_id name");

    const departmentIds = matchedDepartments.map((department) => department._id);
    const departmentNames = matchedDepartments.map((department) => department.name);

    employeeQuery.$or = [
      { department: departmentFilter },
      ...(departmentNames.length > 0 ? [{ department: { $in: departmentNames } }] : []),
      ...(departmentIds.length > 0 ? [{ departmentId: { $in: departmentIds } }] : []),
    ];
  }

  const [employees, departments, users] = await Promise.all([
    Employee.find(employeeQuery)
      .select(
        "firstName middleName lastName email designation department departmentId isActive status",
      )
      .sort({ department: 1, firstName: 1, lastName: 1 })
      .lean(),
    Department.find().select("name code status").sort({ name: 1 }).lean(),
    User.find({ employeeId: { $ne: null } })
      .select("_id email firstName lastName role employeeId isActive")
      .lean(),
  ]);

  const departmentNameById = new Map(
    departments.map((department) => [String(department._id), department.name]),
  );
  const departmentOptions = departments.map((department) => ({
    id: String(department._id),
    name: department.name,
    code: department.code,
  }));
  const optionNames = new Set(departmentOptions.map((department) => department.name));

  employees.forEach((employee) => {
    const departmentName = resolveDepartmentName(employee, departmentNameById);
    if (departmentName !== UNASSIGNED_DEPARTMENT && !optionNames.has(departmentName)) {
      departmentOptions.push({
        id: departmentName,
        name: departmentName,
        code: departmentName,
      });
      optionNames.add(departmentName);
    }
  });

  departmentOptions.sort((left, right) => left.name.localeCompare(right.name));

  const userByEmployeeId = new Map();
  users.forEach((user) => {
    if (user.employeeId) {
      userByEmployeeId.set(String(user.employeeId), user);
    }
  });

  const recipients = employees.map((employee) => {
    const user = userByEmployeeId.get(String(employee._id));
    const departmentName = resolveDepartmentName(employee, departmentNameById);

    return mapRecipientRecord(
      { ...employee, departmentName },
      user,
      currentUserId,
    );
  });

  return {
    employees: recipients,
    departments: groupRecipientsByDepartment(recipients),
    departmentOptions,
    total: recipients.length,
  };
};

export const transferSuperAdminRole = async ({
  currentUserId,
  recipientUserId,
  recipientEmail,
  reason,
  req,
  res,
}) => {
  if (!recipientUserId) {
    const error = new Error("Recipient user ID is required");
    error.statusCode = 400;
    throw error;
  }

  if (String(currentUserId) === String(recipientUserId)) {
    const error = new Error("Cannot transfer super admin role to yourself");
    error.statusCode = 400;
    throw error;
  }

  const [currentUser, recipient] = await Promise.all([
    User.findById(currentUserId),
    User.findById(recipientUserId).populate({
      path: "employeeId",
      select:
        "firstName middleName lastName email designation department joinDate joiningDate isActive status",
    }),
  ]);

  if (!currentUser || currentUser.role !== Roles.SUPER_ADMIN) {
    const error = new Error("Only the current super admin can transfer this role");
    error.statusCode = 403;
    throw error;
  }

  if (!recipient) {
    const error = new Error("Recipient not found");
    error.statusCode = 404;
    throw error;
  }

  if (recipientEmail && recipient.email !== String(recipientEmail).toLowerCase().trim()) {
    const error = new Error("Recipient email does not match the selected user");
    error.statusCode = 400;
    throw error;
  }

  await User.findByIdAndUpdate(currentUserId, { role: Roles.EMPLOYEE });
  await User.findByIdAndUpdate(recipientUserId, { role: Roles.SUPER_ADMIN });

  const auditLog = normalizeAuditLog(
    await recordAudit(req, {
      userId: currentUserId,
      action: "ROLE_TRANSFER",
      entityType: "User",
      entityId: String(recipientUserId),
      description: `Super admin role transferred to ${formatPersonName(recipient, recipient.employeeId)}`,
      changes: {
        fromUserId: String(currentUserId),
        toUserId: String(recipientUserId),
        fromRole: Roles.SUPER_ADMIN,
        toRole: Roles.SUPER_ADMIN,
        previousRecipientRole: recipient.role,
        reason: reason || "Manual role transfer",
      },
    }),
  );

  const roleTransfer = await RoleTransfer.create({
    fromUserId: currentUserId,
    toUserId: recipientUserId,
    reason: reason || "Manual role transfer",
    auditLogId: auditLog?._id,
  });

  await invalidateSession(currentUserId, res);

  return {
    auditLogId: auditLog?._id,
    transferId: roleTransfer?._id,
    transferredAt: roleTransfer?.completedAt || new Date(),
    recipient: {
      id: String(recipient._id),
      name: formatPersonName(recipient, recipient.employeeId),
      email: recipient.email,
    },
  };
};

export const listTransferHistory = async ({ limit = 20, offset = 0 } = {}) => {
  const parsedLimit = Number.isFinite(Number(limit))
    ? Math.min(Math.max(Number(limit), 1), 100)
    : 20;
  const parsedOffset = Number.isFinite(Number(offset)) ? Math.max(Number(offset), 0) : 0;

  const transfers = await RoleTransfer.find()
    .sort({ completedAt: -1 })
    .skip(parsedOffset)
    .limit(parsedLimit)
    .populate("fromUserId", "email firstName lastName")
    .populate("toUserId", "email firstName lastName")
    .populate("auditLogId", "action description createdAt");

  return transfers.map((transfer) => ({
    id: String(transfer._id),
    fromUser: {
      id: String(transfer.fromUserId?._id || transfer.fromUserId),
      name: formatPersonName(transfer.fromUserId),
      email: transfer.fromUserId?.email || "",
    },
    toUser: {
      id: String(transfer.toUserId?._id || transfer.toUserId),
      name: formatPersonName(transfer.toUserId),
      email: transfer.toUserId?.email || "",
    },
    reason: transfer.reason,
    completedAt: transfer.completedAt,
    auditLogId: transfer.auditLogId?._id || transfer.auditLogId,
  }));
};
