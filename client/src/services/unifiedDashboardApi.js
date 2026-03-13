import API from '../api/client';
import { ROLES } from '../utils/roles';

const getByPath = (input, path) => {
  if (!path) {
    return undefined;
  }

  return path.split('.').reduce((acc, key) => {
    if (acc && Object.prototype.hasOwnProperty.call(acc, key)) {
      return acc[key];
    }
    return undefined;
  }, input);
};

const extractRows = (payload, arrayKey) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!payload || typeof payload !== 'object') {
    return [];
  }

  if (arrayKey && Array.isArray(payload[arrayKey])) {
    return payload[arrayKey];
  }

  if (payload.data && typeof payload.data === 'object') {
    if (arrayKey && Array.isArray(payload.data[arrayKey])) {
      return payload.data[arrayKey];
    }

    if (Array.isArray(payload.data)) {
      return payload.data;
    }
  }

  const knownArrayKeys = ['data', 'attendance', 'details', 'runs', 'roles', 'permissions', 'sessions', 'dailyBreakdown'];
  for (const key of knownArrayKeys) {
    if (Array.isArray(payload[key])) {
      return payload[key];
    }
  }

  return [];
};

const extractCount = (payload, rows, countPath) => {
  if (countPath) {
    const explicitCount = getByPath(payload, countPath);
    if (typeof explicitCount === 'number') {
      return explicitCount;
    }
  }

  if (payload?.pagination?.total !== undefined) {
    return payload.pagination.total;
  }

  if (payload?.data?.pagination?.total !== undefined) {
    return payload.data.pagination.total;
  }

  if (typeof payload?.count === 'number') {
    return payload.count;
  }

  if (typeof payload?.summary?.totalRecords === 'number') {
    return payload.summary.totalRecords;
  }

  return rows.length;
};

const toPayload = (response) => {
  return response?.data || {};
};

const toErrorMessage = (err) => {
  return err?.response?.data?.message || err?.message || 'Failed to load data';
};

const DASHBOARD_WIDGET_SOURCES = {
  [ROLES.EMPLOYEE]: [
    { key: 'attendance', endpoint: '/attendance/own?limit=10' },
    { key: 'leaves', endpoint: '/leaves/own' },
    { key: 'holidays', endpoint: '/leaves/policy' },
    { key: 'payslip', endpoint: '/payroll/own' },
  ],
  [ROLES.MANAGER]: [
    { key: 'team-attendance', endpoint: '/attendance/team?limit=20' },
    { key: 'leave-requests', endpoint: '/leaves/team' },
    { key: 'team-performance', endpoint: '/attendance/monthly-summary', countPath: 'summary.averageWorkingHours' },
    { key: 'team-members', endpoint: '/employees/my-team?limit=20' },
  ],
  [ROLES.HR_ADMIN]: [
    { key: 'total-employees', endpoint: '/employees?limit=20' },
    { key: 'new-joiners', endpoint: '/employees?limit=200' },
    { key: 'pending-leaves', endpoint: '/leaves/all' },
    { key: 'payroll-processing', endpoint: '/payroll/all' },
  ],
  [ROLES.SUPER_ADMIN]: [
    { key: 'company-overview', endpoint: '/employees?limit=50' },
    { key: 'system-settings', endpoint: '/roles' },
    { key: 'audit-logs', endpoint: '/auth/sessions', arrayKey: 'sessions' },
    { key: 'department-stats', endpoint: '/departments' },
  ],
};

const ROLE_PAGE_SOURCES = {
  [ROLES.EMPLOYEE]: {
    'my-profile': [{ key: 'profile', label: 'Profile', endpoint: '/employees/me/profile' }],
    attendance: [{ key: 'attendance', label: 'Attendance Records', endpoint: '/attendance/own?limit=25' }],
    leaves: [{ key: 'leaves', label: 'Leave Requests', endpoint: '/leaves/own' }],
    payroll: [{ key: 'payroll', label: 'Payroll Details', endpoint: '/payroll/own' }],
    documents: [{ key: 'documents', label: 'Employee Documents', endpoint: '/employees/me/profile' }],
  },
  [ROLES.MANAGER]: {
    team: [{ key: 'team', label: 'Team Members', endpoint: '/employees/my-team?limit=25' }],
    attendance: [{ key: 'team-attendance', label: 'Team Attendance', endpoint: '/attendance/team?limit=25' }],
    'leave-approvals': [{ key: 'leave-requests', label: 'Team Leave Requests', endpoint: '/leaves/team' }],
    reports: [{ key: 'attendance-summary', label: 'Monthly Attendance Summary', endpoint: '/attendance/monthly-summary', arrayKey: 'dailyBreakdown' }],
  },
  [ROLES.HR_ADMIN]: {
    employees: [{ key: 'employees', label: 'Employees', endpoint: '/employees?limit=25' }],
    attendance: [{ key: 'attendance', label: 'Attendance', endpoint: '/attendance/all?limit=25' }],
    leaves: [{ key: 'leaves', label: 'Leave Requests', endpoint: '/leaves/all' }],
    payroll: [{ key: 'payroll-runs', label: 'Payroll Runs', endpoint: '/payroll/all', arrayKey: 'runs' }],
    reports: [{ key: 'monthly-summary', label: 'Monthly Summary', endpoint: '/attendance/monthly-summary', arrayKey: 'dailyBreakdown' }],
  },
  [ROLES.SUPER_ADMIN]: {
    employees: [{ key: 'employees', label: 'Employees', endpoint: '/employees?limit=25' }],
    departments: [{ key: 'departments', label: 'Departments', endpoint: '/departments' }],
    'roles-permissions': [
      { key: 'roles', label: 'Roles', endpoint: '/roles', arrayKey: 'roles' },
      { key: 'permissions', label: 'Permissions', endpoint: '/permissions' },
    ],
    'system-settings': [
      { key: 'roles', label: 'Role Settings', endpoint: '/roles', arrayKey: 'roles' },
      { key: 'sessions', label: 'Sessions', endpoint: '/auth/sessions', arrayKey: 'sessions' },
    ],
    'audit-logs': [{ key: 'sessions', label: 'Session Activity', endpoint: '/auth/sessions', arrayKey: 'sessions' }],
  },
};

const toNumberLike = (value) => {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string' && value.trim() && !Number.isNaN(Number(value))) {
    return Number(value);
  }

  return null;
};

const fetchSource = async (source) => {
  try {
    const response = await API.get(source.endpoint);
    const payload = toPayload(response);
    const rows = extractRows(payload, source.arrayKey);
    const countValue = extractCount(payload, rows, source.countPath);

    return {
      key: source.key,
      label: source.label || source.key,
      endpoint: source.endpoint,
      rows,
      count: countValue,
      payload,
      error: null,
    };
  } catch (err) {
    return {
      key: source.key,
      label: source.label || source.key,
      endpoint: source.endpoint,
      rows: [],
      count: null,
      payload: null,
      error: toErrorMessage(err),
    };
  }
};

export const fetchRolePageData = async (role, pageId) => {
  const sources = ROLE_PAGE_SOURCES?.[role]?.[pageId] || [];

  if (sources.length === 0) {
    return [];
  }

  return Promise.all(sources.map((source) => fetchSource(source)));
};

const WIDGET_VALUE_FORMATTERS = {
  'team-performance': (count) => {
    const numeric = toNumberLike(count);
    return numeric === null ? 'N/A' : `${Math.round(numeric)} avg hrs`;
  },
  'payroll-processing': (count) => {
    const numeric = toNumberLike(count);
    return numeric === null ? 'N/A' : `${numeric} runs`;
  },
};

const getPendingCount = (rows) => {
  return rows.filter((row) => {
    const status = String(row?.status || '').toUpperCase();
    return status === 'PENDING';
  }).length;
};

const getCurrentMonthJoiners = (rows) => {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  return rows.filter((row) => {
    const dateValue = row?.joiningDate || row?.dateOfJoining || row?.createdAt || row?.joinDate;
    if (!dateValue) {
      return false;
    }

    const joinDate = new Date(dateValue);
    if (Number.isNaN(joinDate.getTime())) {
      return false;
    }

    return joinDate.getMonth() === month && joinDate.getFullYear() === year;
  }).length;
};

export const fetchDashboardWidgetValues = async (role) => {
  const sources = DASHBOARD_WIDGET_SOURCES?.[role] || [];

  if (sources.length === 0) {
    return {};
  }

  const resolved = await Promise.all(sources.map((source) => fetchSource(source)));

  return resolved.reduce((acc, item) => {
    if (item.error) {
      acc[item.key] = {
        value: 'N/A',
        noteSuffix: `(${item.error})`,
      };
      return acc;
    }

    let displayCount = item.count;
    if (item.key === 'pending-leaves') {
      displayCount = getPendingCount(item.rows);
    }

    if (item.key === 'new-joiners') {
      displayCount = getCurrentMonthJoiners(item.rows);
    }

    const formatter = WIDGET_VALUE_FORMATTERS[item.key];
    const formattedValue = formatter
      ? formatter(displayCount)
      : String(displayCount ?? item.rows.length ?? 0);

    acc[item.key] = {
      value: formattedValue,
      noteSuffix: '(live)',
    };

    return acc;
  }, {});
};

export const approveLeaveRequest = async (leaveId) => {
  if (!leaveId) {
    throw new Error('Leave request ID is required');
  }

  const response = await API.patch(`/leaves/${leaveId}/approve`);
  return response?.data || {};
};

export const rejectLeaveRequest = async (leaveId) => {
  if (!leaveId) {
    throw new Error('Leave request ID is required');
  }

  const response = await API.patch(`/leaves/${leaveId}/reject`);
  return response?.data || {};
};

export const processPayrollRun = async (runId) => {
  if (!runId) {
    throw new Error('Payroll run ID is required');
  }

  const response = await API.post(`/payroll/${runId}/process`);
  return response?.data || {};
};

export const createEmployeeRecord = async ({
  firstName,
  lastName,
  email,
  department,
  designation,
  salary,
  joinDate,
  phoneNumber,
  managerId,
  accountPassword,
  confirmPassword,
  accountRole,
}) => {
  const normalizedFirstName = String(firstName || '').trim();
  const normalizedLastName = String(lastName || '').trim();
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!normalizedFirstName || !normalizedLastName || !normalizedEmail) {
    throw new Error('First name, last name, and email are required');
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error('Email format is invalid');
  }

  const payload = {
    firstName: normalizedFirstName,
    lastName: normalizedLastName,
    email: normalizedEmail,
  };

  const normalizedDepartment = String(department || '').trim();
  if (normalizedDepartment) {
    payload.department = normalizedDepartment;
  }

  const normalizedDesignation = String(designation || '').trim();
  if (normalizedDesignation) {
    payload.designation = normalizedDesignation;
  }

  const normalizedManagerId = String(managerId || '').trim();
  if (normalizedManagerId) {
    payload.managerId = normalizedManagerId;
  }

  const normalizedSalary = String(salary ?? '').trim();
  if (normalizedSalary) {
    const salaryAmount = Number(normalizedSalary);
    if (Number.isNaN(salaryAmount) || salaryAmount < 0) {
      throw new Error('Salary must be a non-negative number');
    }

    payload.salary = salaryAmount;
  }

  const normalizedJoinDate = String(joinDate || '').trim();
  if (normalizedJoinDate) {
    const parsedDate = new Date(normalizedJoinDate);
    if (Number.isNaN(parsedDate.getTime())) {
      throw new Error('Join date must be a valid date (YYYY-MM-DD)');
    }

    payload.joinDate = normalizedJoinDate;
  }

  const normalizedPhoneNumber = String(phoneNumber || '').trim();
  if (normalizedPhoneNumber) {
    if (!/^\d{10}$/.test(normalizedPhoneNumber)) {
      throw new Error('Phone number must be exactly 10 digits');
    }

    payload.phoneNumber = normalizedPhoneNumber;
  }

  const response = await API.post('/employees', payload);
  const createdEmployee = response?.data?.data || {};
  const createdEmployeeId = createdEmployee?._id || createdEmployee?.id;

  const normalizedPassword = String(accountPassword || '').trim();
  const normalizedConfirmPassword = String(confirmPassword || '').trim();
  const normalizedAccountRole = String(accountRole || 'EMPLOYEE').trim().toUpperCase();

  if (normalizedConfirmPassword && !normalizedPassword) {
    throw new Error('Please enter account password');
  }

  if (normalizedPassword) {
    if (!normalizedConfirmPassword) {
      throw new Error('Please confirm account password');
    }

    if (normalizedPassword !== normalizedConfirmPassword) {
      throw new Error('Account password and confirm password must match');
    }

    const passwordPattern = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!passwordPattern.test(normalizedPassword)) {
      throw new Error('Account password must be 8+ chars with uppercase, lowercase, number, and special character');
    }

    if (!['EMPLOYEE', 'MANAGER', 'HR_ADMIN'].includes(normalizedAccountRole)) {
      throw new Error('Account role must be EMPLOYEE, MANAGER, or HR_ADMIN');
    }

    try {
      await API.post('/users/create', {
        email: normalizedEmail,
        password: normalizedPassword,
        role: normalizedAccountRole,
        firstName: normalizedFirstName,
        lastName: normalizedLastName,
        employeeId: createdEmployeeId || undefined,
      });

      return {
        ...(response?.data || {}),
        message: 'Employee and login account created successfully',
      };
    } catch (accountError) {
      return {
        ...(response?.data || {}),
        message: `Employee created, but login account setup failed: ${accountError?.response?.data?.message || accountError?.message || 'Unknown error'}`,
      };
    }
  }

  return {
    ...(response?.data || {}),
    message: 'Employee created successfully. No login account was created.',
  };
};

export const assignPermissionToRole = async ({ roleId, permissionId }) => {
  if (!roleId || !permissionId) {
    throw new Error('Role ID and Permission ID are required');
  }

  const response = await API.post(`/roles/${roleId}/assign-permission`, {
    permissionId,
  });

  return response?.data || {};
};

export const assignRoleToPermission = async ({ permissionId, roleId }) => {
  if (!permissionId || !roleId) {
    throw new Error('Permission ID and Role ID are required');
  }

  const response = await API.post(`/permissions/${permissionId}/assign-role`, {
    roleId,
  });

  return response?.data || {};
};
