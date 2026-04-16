import API from '../api/client';
import {
  ANNOUNCEMENT_ENDPOINTS,
  AUTH_ENDPOINTS,
  ATTENDANCE_ENDPOINTS,
  DEPARTMENT_ENDPOINTS,
  EMPLOYEE_ENDPOINTS,
  LEAVE_ENDPOINTS,
  PAYROLL_ENDPOINTS,
  PERMISSION_ENDPOINTS,
  ROLE_ENDPOINTS,
} from '../api/endpoints';
import { ROLES } from '../utils/roles';
import { getMonthDateRangeParams } from '../utils/monthDateRange';

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

/** Query params for /attendance/own and /attendance/team: API only filters by month when startDate & endDate are set. */
const currentMonthAttendanceRangeParams = () => {
  const now = new Date();
  const { startDate, endDate } = getMonthDateRangeParams(now.getFullYear(), now.getMonth());
  return { startDate, endDate, limit: 62, page: 1 };
};

const isDateInCurrentMonth = (dateValue) => {
  if (!dateValue) return false;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
};

const leaveRequestOverlapsCurrentMonth = (leaveRequest) => {
  if (!leaveRequest) return false;

  const start = new Date(leaveRequest.startDate || leaveRequest.start || leaveRequest.createdAt);
  const end = new Date(leaveRequest.endDate || leaveRequest.end || leaveRequest.createdAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return isDateInCurrentMonth(leaveRequest.createdAt || leaveRequest.updatedAt);
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  return !(end < monthStart || start > monthEnd);
};

const parsePayrollRunDate = (run) => {
  if (!run) return null;
  if (run.month) {
    const parsed = new Date(run.month);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  if (run.createdAt) {
    const parsed = new Date(run.createdAt);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return null;
};

const filterLeavesForCurrentMonth = (rows) => rows.filter(leaveRequestOverlapsCurrentMonth);

const filterApprovedLeavesCurrentMonth = (rows) => rows.filter((row) => 
  String(row?.status || '').toUpperCase() === 'APPROVED' && leaveRequestOverlapsCurrentMonth(row)
);

const filterPayrollDetailsForCurrentMonth = (rows) =>
  rows.filter((row) => {
    const run = row.payrollRunId || row.payrollRun;
    const d = parsePayrollRunDate(run);
    return d && isDateInCurrentMonth(d);
  });

const DASHBOARD_WIDGET_SOURCES = {
  [ROLES.EMPLOYEE]: [
    { key: 'attendance', endpoint: ATTENDANCE_ENDPOINTS.own(), params: currentMonthAttendanceRangeParams },
    { key: 'leaves', endpoint: LEAVE_ENDPOINTS.own, filterRows: filterApprovedLeavesCurrentMonth },
    { key: 'holidays', endpoint: LEAVE_ENDPOINTS.policy },
    { key: 'payslip', endpoint: PAYROLL_ENDPOINTS.own, filterRows: filterPayrollDetailsForCurrentMonth },
  ],
  [ROLES.MANAGER]: [
    { key: 'team-attendance', endpoint: ATTENDANCE_ENDPOINTS.team(), params: currentMonthAttendanceRangeParams },
    { key: 'leave-requests', endpoint: LEAVE_ENDPOINTS.team, filterRows: filterLeavesForCurrentMonth },
    { key: 'team-performance', endpoint: ATTENDANCE_ENDPOINTS.monthlySummary, countPath: 'summary.averageWorkingHours' },
    { key: 'team-members', endpoint: EMPLOYEE_ENDPOINTS.myTeam(20) },
  ],
  [ROLES.HR_ADMIN]: [
    { key: 'total-employees', endpoint: EMPLOYEE_ENDPOINTS.list(20) },
    { key: 'new-joiners', endpoint: EMPLOYEE_ENDPOINTS.list(200) },
    { key: 'pending-leaves', endpoint: LEAVE_ENDPOINTS.all },
    { key: 'payroll-processing', endpoint: PAYROLL_ENDPOINTS.all },
  ],
  [ROLES.SUPER_ADMIN]: [
    { key: 'company-overview', endpoint: EMPLOYEE_ENDPOINTS.list(50) },
    { key: 'system-settings', endpoint: ROLE_ENDPOINTS.list },
    { key: 'audit-logs', endpoint: AUTH_ENDPOINTS.sessions, arrayKey: 'sessions' },
    { key: 'department-stats', endpoint: DEPARTMENT_ENDPOINTS.list },
  ],
};

const ROLE_PAGE_SOURCES = {
  [ROLES.EMPLOYEE]: {
    'my-profile': [{ key: 'profile', label: 'Profile', endpoint: EMPLOYEE_ENDPOINTS.myProfile }],
    attendance: [
      {
        key: 'attendance',
        label: 'Attendance Records',
        endpoint: ATTENDANCE_ENDPOINTS.own(),
        params: currentMonthAttendanceRangeParams,
      },
    ],
    leaves: [
      {
        key: 'leaves',
        label: 'Leave Requests',
        endpoint: LEAVE_ENDPOINTS.own,
        filterRows: filterLeavesForCurrentMonth,
      },
    ],
    payroll: [
      {
        key: 'payroll',
        label: 'Payroll Details',
        endpoint: PAYROLL_ENDPOINTS.own,
        filterRows: filterPayrollDetailsForCurrentMonth,
      },
    ],
    documents: [{ key: 'documents', label: 'Employee Documents', endpoint: EMPLOYEE_ENDPOINTS.myProfile }],
  },
  [ROLES.MANAGER]: {
    dashboard: [
      { key: 'team-members', label: 'Team Members', endpoint: EMPLOYEE_ENDPOINTS.myTeam(25) },
      { key: 'team-attendance', label: 'Team Attendance', endpoint: ATTENDANCE_ENDPOINTS.team(25) },
      { key: 'leave-requests', label: 'Team Leave Requests', endpoint: LEAVE_ENDPOINTS.team },
    ],
    attendance: [{ key: 'team-attendance', label: 'Team Attendance', endpoint: ATTENDANCE_ENDPOINTS.team(25) }],
    announcements: [{ key: 'announcements', label: 'Announcements', endpoint: ANNOUNCEMENT_ENDPOINTS.list }],
    analytics: [{ key: 'attendance-summary', label: 'Attendance Summary', endpoint: ATTENDANCE_ENDPOINTS.monthlySummary, arrayKey: 'dailyBreakdown' }],
    'employee-profile': [{ key: 'profile', label: 'My Profile', endpoint: EMPLOYEE_ENDPOINTS.myProfile }],
    team: [{ key: 'team-members', label: 'Team Members', endpoint: EMPLOYEE_ENDPOINTS.myTeam(25) }],
    employees: [{ key: 'team-members', label: 'Team Members', endpoint: EMPLOYEE_ENDPOINTS.myTeam(25) }],
    leaves: [{ key: 'leave-requests', label: 'Team Leave Requests', endpoint: LEAVE_ENDPOINTS.team }],
    payroll: [{ key: 'payroll', label: 'Payroll Details', endpoint: PAYROLL_ENDPOINTS.own, filterRows: filterPayrollDetailsForCurrentMonth }],
    performance: [{ key: 'attendance-summary', label: 'Performance Trend Inputs', endpoint: ATTENDANCE_ENDPOINTS.monthlySummary, arrayKey: 'dailyBreakdown' }],
    reports: [{ key: 'attendance-summary', label: 'Attendance Reports', endpoint: ATTENDANCE_ENDPOINTS.monthlySummary, arrayKey: 'dailyBreakdown' }],
    settings: [{ key: 'profile', label: 'My Profile', endpoint: EMPLOYEE_ENDPOINTS.myProfile }],
    'team-collaboration': [{ key: 'team-members', label: 'Team Collaboration Members', endpoint: EMPLOYEE_ENDPOINTS.myTeam(25) }],
  },
  [ROLES.HR_ADMIN]: {
    employees: [{ key: 'employees', label: 'Employees', endpoint: EMPLOYEE_ENDPOINTS.list(25) }],
    attendance: [{ key: 'attendance', label: 'Attendance', endpoint: ATTENDANCE_ENDPOINTS.all(25) }],
    leaves: [{ key: 'leaves', label: 'Leave Requests', endpoint: LEAVE_ENDPOINTS.all }],
    payroll: [{ key: 'payroll-runs', label: 'Payroll Runs', endpoint: PAYROLL_ENDPOINTS.all, arrayKey: 'runs' }],
    reports: [{ key: 'monthly-summary', label: 'Monthly Summary', endpoint: ATTENDANCE_ENDPOINTS.monthlySummary, arrayKey: 'dailyBreakdown' }],
    settings: [{ key: 'profile', label: 'My Profile', endpoint: EMPLOYEE_ENDPOINTS.myProfile }],
  },
  [ROLES.SUPER_ADMIN]: {
    employees: [{ key: 'employees', label: 'Employees', endpoint: EMPLOYEE_ENDPOINTS.list(25) }],
    departments: [{ key: 'departments', label: 'Departments', endpoint: DEPARTMENT_ENDPOINTS.list }],
    'roles-permissions': [
      { key: 'roles', label: 'Roles', endpoint: ROLE_ENDPOINTS.list, arrayKey: 'roles' },
      { key: 'permissions', label: 'Permissions', endpoint: PERMISSION_ENDPOINTS.list },
    ],
    'system-settings': [
      { key: 'roles', label: 'Role Settings', endpoint: ROLE_ENDPOINTS.list, arrayKey: 'roles' },
      { key: 'sessions', label: 'Sessions', endpoint: AUTH_ENDPOINTS.sessions, arrayKey: 'sessions' },
    ],
    'audit-logs': [{ key: 'sessions', label: 'Session Activity', endpoint: AUTH_ENDPOINTS.sessions, arrayKey: 'sessions' }],
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
    const requestConfig = {};
    if (typeof source.params === 'function') {
      requestConfig.params = source.params();
    } else if (source.params && typeof source.params === 'object') {
      requestConfig.params = source.params;
    }

    const response = await API.get(
      source.endpoint,
      Object.keys(requestConfig).length > 0 ? requestConfig : undefined,
    );
    const payload = toPayload(response);
    let rows = extractRows(payload, source.arrayKey);
    if (typeof source.filterRows === 'function') {
      rows = source.filterRows(rows);
    }
    let countValue = extractCount(payload, rows, source.countPath);
    if (source.filterRows) {
      countValue = rows.length;
    }

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
    return status === 'PENDING' && leaveRequestOverlapsCurrentMonth(row);
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

const getCurrentMonthPayrollRuns = (rows) => {
  return rows.filter((row) => {
    const date = parsePayrollRunDate(row);
    return date && isDateInCurrentMonth(date);
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

  const response = await API.patch(LEAVE_ENDPOINTS.approve(leaveId));
  return response?.data || {};
};

export const rejectLeaveRequest = async (leaveId) => {
  if (!leaveId) {
    throw new Error('Leave request ID is required');
  }

  const response = await API.patch(LEAVE_ENDPOINTS.reject(leaveId));
  return response?.data || {};
};

export const processPayrollRun = async (runId) => {
  if (!runId) {
    throw new Error('Payroll run ID is required');
  }

  const response = await API.post(PAYROLL_ENDPOINTS.process(runId));
  return response?.data || {};
};

export const createEmployeeRecord = async ({
  firstName,
  middleName,
  lastName,
  email,
  department,
  designation,
  salary,
  joinDate,
  dateOfBirth,
  phoneNumber,
  managerName,
  managerEmail,
  managerId,
  city,
  state,
  zipCode,
  accountRole,
}) => {
  const normalizedFirstName = String(firstName || '').trim();
  const normalizedLastName = String(lastName || '').trim();
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!normalizedFirstName || !normalizedLastName || !normalizedEmail) {
    throw new Error('First name, last name, and email are required');
  }

  if (!/^[A-Za-z0-9._%+-]+@ispace\.com$/i.test(normalizedEmail)) {
    throw new Error('Email must be a valid @ispace.com address');
  }

  const normalizedAccountRole = String(accountRole || 'EMPLOYEE').trim().toUpperCase();

  if (!['EMPLOYEE', 'MANAGER', 'HR_ADMIN', 'DEPT_ADMIN'].includes(normalizedAccountRole)) {
    throw new Error('Account role must be EMPLOYEE, MANAGER, HR_ADMIN, or DEPT_ADMIN');
  }

  const payload = {
    firstName: normalizedFirstName,
    lastName: normalizedLastName,
    email: normalizedEmail,
    accountRole: normalizedAccountRole,
  };

  const normalizedMiddleName = String(middleName || '').trim();
  if (normalizedMiddleName) {
    payload.middleName = normalizedMiddleName;
  }

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

  const normalizedDateOfBirth = String(dateOfBirth || '').trim();
  if (normalizedDateOfBirth) {
    const parsedDate = new Date(normalizedDateOfBirth);
    if (Number.isNaN(parsedDate.getTime())) {
      throw new Error('Date of birth must be a valid date (YYYY-MM-DD)');
    }

    payload.dateOfBirth = normalizedDateOfBirth;
  }

  const normalizedPhoneNumber = String(phoneNumber || '').trim();
  if (normalizedPhoneNumber) {
    if (!/^\d{10}$/.test(normalizedPhoneNumber)) {
      throw new Error('Phone number must be exactly 10 digits');
    }

    payload.phoneNumber = normalizedPhoneNumber;
  }

  const normalizedCity = String(city || '').trim();
  if (normalizedCity) {
    payload.city = normalizedCity;
  }

  const normalizedState = String(state || '').trim();
  if (normalizedState) {
    payload.state = normalizedState;
  }

  const normalizedZipCode = String(zipCode || '').trim();
  if (normalizedZipCode) {
    if (!/^\d{5,6}$/.test(normalizedZipCode)) {
      throw new Error('Zip code must be 5-6 digits');
    }

    payload.zipCode = normalizedZipCode;
  }

  const response = await API.post(EMPLOYEE_ENDPOINTS.create, payload);
  const responseData = response?.data || {};
  const temporaryPassword = responseData?.temporaryPassword;

  if (!temporaryPassword) {
    return responseData;
  }

  return {
    ...responseData,
    message: `${responseData?.message || 'Employee and login account created successfully'} Temporary password: ${temporaryPassword}`,
  };
};

export const assignPermissionToRole = async ({ roleId, permissionId }) => {
  if (!roleId || !permissionId) {
    throw new Error('Role ID and Permission ID are required');
  }

  const response = await API.post(ROLE_ENDPOINTS.assignPermission(roleId), {
    permissionId,
  });

  return response?.data || {};
};

export const assignRoleToPermission = async ({ permissionId, roleId }) => {
  if (!permissionId || !roleId) {
    throw new Error('Permission ID and Role ID are required');
  }

  const response = await API.post(PERMISSION_ENDPOINTS.assignRole(permissionId), {
    roleId,
  });

  return response?.data || {};
};
