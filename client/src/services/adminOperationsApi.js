import API from '../api/client';
import {
  ADMIN_ENDPOINTS,
  AUTH_ENDPOINTS,
  DEPARTMENT_ENDPOINTS,
  DESIGNATION_ENDPOINTS,
  EMPLOYEE_ENDPOINTS,
  LEAVE_ENDPOINTS,
  PAYROLL_ENDPOINTS,
  PERMISSION_ENDPOINTS,
  PROJECT_ENDPOINTS,
  ROLE_ENDPOINTS,
  USER_ENDPOINTS,
} from '../api/endpoints';
import { createEmployeeRecord } from './unifiedDashboardApi';

const MASTERS_PAGE_LIMIT = 200;

const toPayload = (response) => response?.data || {};

const unwrapData = (payload) => {
  if (payload && typeof payload === 'object' && !Array.isArray(payload) && payload.data !== undefined) {
    return payload.data;
  }
  return payload;
};

const extractRows = (payload, candidates = ['data']) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!payload || typeof payload !== 'object') {
    return [];
  }

  for (const key of candidates) {
    if (Array.isArray(payload[key])) {
      return payload[key];
    }
  }

  if (payload.data && typeof payload.data === 'object') {
    for (const key of candidates) {
      if (Array.isArray(payload.data[key])) {
        return payload.data[key];
      }
    }

    if (Array.isArray(payload.data)) {
      return payload.data;
    }
  }

  return [];
};

export const toErrorMessage = (error, fallback = 'Request failed') => {
  return error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback;
};

export const fetchAdminEmployees = async (limit = 100) => {
  const response = await API.get(EMPLOYEE_ENDPOINTS.list(limit));
  const payload = toPayload(response);
  return extractRows(payload, ['data']);
};

export const fetchAllAdminEmployees = async (limit = 200) => {
  const normalizedLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 200, 1), 500);
  let page = 1;
  let totalPages = 1;
  const merged = [];
  const seen = new Set();

  while (page <= totalPages && page <= 50) {
    const separator = EMPLOYEE_ENDPOINTS.list(normalizedLimit).includes('?') ? '&' : '?';
    const response = await API.get(`${EMPLOYEE_ENDPOINTS.list(normalizedLimit)}${separator}page=${page}`);
    const payload = toPayload(response);
    const rows = extractRows(payload, ['data']);
    const pagination = payload?.pagination || payload?.data?.pagination || {};
    const pagesFromPagination = Number.parseInt(pagination?.pages, 10);
    totalPages = Number.isFinite(pagesFromPagination) && pagesFromPagination > 0
      ? pagesFromPagination
      : (rows.length < normalizedLimit ? page : page + 1);

    rows.forEach((row) => {
      const id = String(row?._id || row?.id || '').trim();
      if (!id || seen.has(id)) {
        return;
      }
      seen.add(id);
      merged.push(row);
    });

    page += 1;
  }

  return merged;
};

export const fetchEmployeeProfile = async (employeeId) => {
  const response = await API.get(EMPLOYEE_ENDPOINTS.profile(employeeId));
  const payload = toPayload(response);
  return unwrapData(payload);
};

export const createAdminEmployee = async (input) => {
  return createEmployeeRecord(input);
};

export const updateAdminEmployee = async (employeeId, input) => {
  const response = await API.put(EMPLOYEE_ENDPOINTS.update(employeeId), input);
  return unwrapData(toPayload(response));
};

export const assignEmployeeDesignation = async (designationId, input) => {
  const response = await API.post(DESIGNATION_ENDPOINTS.assign(designationId), input);
  return unwrapData(toPayload(response));
};

export const updateEmployeeStatus = async (employeeId, isActive) => {
  const endpoint = isActive
    ? EMPLOYEE_ENDPOINTS.activate(employeeId)
    : EMPLOYEE_ENDPOINTS.deactivate(employeeId);
  const response = await API.put(endpoint);
  return unwrapData(toPayload(response));
};

export const resetEmployeePassword = async (employeeId) => {
  const response = await API.post(USER_ENDPOINTS.resetPassword(employeeId));
  const payload = toPayload(response);
  const data = unwrapData(payload);
  return {
    data,
    temporaryPassword: data?.temporaryPassword || payload?.temporaryPassword || '',
  };
};

export const fetchDepartments = async () => {
  const response = await API.get(`${DEPARTMENT_ENDPOINTS.list}?limit=${MASTERS_PAGE_LIMIT}`);
  const payload = toPayload(response);
  return extractRows(payload, ['data']);
};

export const fetchProjects = async () => {
  const response = await API.get(PROJECT_ENDPOINTS.list);
  const payload = toPayload(response);
  return extractRows(payload, ['data']);
};

export const createDepartment = async (input) => {
  const response = await API.post(DEPARTMENT_ENDPOINTS.create, input);
  return unwrapData(toPayload(response));
};

export const updateDepartment = async (departmentId, input) => {
  const response = await API.put(DEPARTMENT_ENDPOINTS.update(departmentId), input);
  return unwrapData(toPayload(response));
};

export const deactivateDepartment = async (departmentId) => {
  const response = await API.delete(DEPARTMENT_ENDPOINTS.delete(departmentId));
  return unwrapData(toPayload(response));
};

export const fetchDesignations = async () => {
  const response = await API.get(`${DESIGNATION_ENDPOINTS.list}?limit=${MASTERS_PAGE_LIMIT}`);
  const payload = toPayload(response);
  return extractRows(payload, ['designations', 'data']);
};

export const fetchDesignationsByDepartment = async (departmentId) => {
  if (!departmentId) {
    return [];
  }

  const params = new URLSearchParams({
    limit: String(MASTERS_PAGE_LIMIT),
    department: String(departmentId),
  });

  const response = await API.get(`${DESIGNATION_ENDPOINTS.list}?${params.toString()}`);
  const payload = toPayload(response);
  return extractRows(payload, ['designations', 'data']);
};

export const fetchAuditLogs = async ({ page = 1, limit = 25, search = '' } = {}) => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  const normalizedSearch = String(search || '').trim();
  if (normalizedSearch) {
    params.set('search', normalizedSearch);
  }

  const response = await API.get(`${ADMIN_ENDPOINTS.auditLogs}?${params.toString()}`);
  const payload = toPayload(response);
  const logs = extractRows(payload, ['logs', 'data']);

  return {
    logs,
    pagination: payload?.pagination || payload?.data?.pagination || null,
  };
};

export const createDesignation = async (input) => {
  const response = await API.post(DESIGNATION_ENDPOINTS.create, input);
  return unwrapData(toPayload(response));
};

export const deactivateDesignation = async (designationId) => {
  const response = await API.delete(DESIGNATION_ENDPOINTS.delete(designationId));
  return unwrapData(toPayload(response));
};

export const fetchLeavePolicies = async () => {
  const response = await API.get(LEAVE_ENDPOINTS.policy);
  const payload = toPayload(response);
  return extractRows(payload, ['data']);
};

export const createLeavePolicy = async (input) => {
  const response = await API.post(LEAVE_ENDPOINTS.policy, input);
  return unwrapData(toPayload(response));
};

export const updateLeavePolicy = async (policyId, input) => {
  const response = await API.put(LEAVE_ENDPOINTS.policyUpdate(policyId), input);
  return unwrapData(toPayload(response));
};

export const deleteLeavePolicy = async (policyId) => {
  const response = await API.delete(LEAVE_ENDPOINTS.policyDelete(policyId));
  return unwrapData(toPayload(response));
};

export const fetchPayrollRuns = async () => {
  const response = await API.get(PAYROLL_ENDPOINTS.all);
  const payload = toPayload(response);
  return extractRows(payload, ['runs', 'data']);
};

export const createPayrollRun = async (month) => {
  const response = await API.post(PAYROLL_ENDPOINTS.create, { month });
  return unwrapData(toPayload(response));
};

export const processPayrollRun = async (runId) => {
  const response = await API.post(PAYROLL_ENDPOINTS.process(runId), { runId });
  return unwrapData(toPayload(response));
};

export const lockPayrollRun = async (runId) => {
  const response = await API.patch(PAYROLL_ENDPOINTS.lock(runId), { runId });
  return unwrapData(toPayload(response));
};

export const unlockPayrollRun = async (runId) => {
  const response = await API.patch(PAYROLL_ENDPOINTS.unlock(runId), { runId });
  return unwrapData(toPayload(response));
};

export const fetchPayrollSlips = async (runId) => {
  const response = await API.post(PAYROLL_ENDPOINTS.generateSlips(runId), { runId });
  const payload = toPayload(response);
  return extractRows(payload, ['slips', 'data']);
};

export const fetchRoles = async () => {
  const response = await API.get(ROLE_ENDPOINTS.list);
  const payload = toPayload(response);
  return extractRows(payload, ['roles', 'data']);
};

export const createRole = async (input) => {
  const response = await API.post(ROLE_ENDPOINTS.create, input);
  return unwrapData(toPayload(response));
};

export const assignPermissionToRole = async (roleId, permissionId) => {
  const response = await API.post(ROLE_ENDPOINTS.assignPermission(roleId), { permissionId });
  return unwrapData(toPayload(response));
};

export const removePermissionFromRole = async (roleId, permissionId) => {
  const response = await API.post(ROLE_ENDPOINTS.removePermission(roleId), { permissionId });
  return unwrapData(toPayload(response));
};

export const fetchPermissions = async () => {
  const response = await API.get(PERMISSION_ENDPOINTS.list);
  const payload = toPayload(response);
  return extractRows(payload, ['data']);
};

export const createPermission = async (input) => {
  const response = await API.post(PERMISSION_ENDPOINTS.create, input);
  return unwrapData(toPayload(response));
};

export const updatePermission = async (permissionId, input) => {
  const response = await API.put(PERMISSION_ENDPOINTS.update(permissionId), input);
  return unwrapData(toPayload(response));
};

export const deletePermission = async (permissionId) => {
  const response = await API.delete(PERMISSION_ENDPOINTS.delete(permissionId));
  return unwrapData(toPayload(response));
};

export const assignRoleToPermission = async (permissionId, roleId) => {
  const response = await API.post(PERMISSION_ENDPOINTS.assignRole(permissionId), { roleId });
  return unwrapData(toPayload(response));
};

export const removeRoleFromPermission = async (permissionId, roleId) => {
  const response = await API.post(PERMISSION_ENDPOINTS.removeRole(permissionId), { roleId });
  return unwrapData(toPayload(response));
};

export const fetchSessions = async () => {
  const response = await API.get(AUTH_ENDPOINTS.sessions);
  const payload = toPayload(response);
  const unwrapped = unwrapData(payload);
  return extractRows(unwrapped, ['sessions', 'data']);
};

export const terminateSession = async (sessionId) => {
  const response = await API.post(AUTH_ENDPOINTS.terminateSession, { sessionId });
  return unwrapData(toPayload(response));
};

export const enableMfa = async () => {
  const response = await API.post(AUTH_ENDPOINTS.mfaEnable);
  return unwrapData(toPayload(response));
};

export const disableMfa = async () => {
  const response = await API.post(AUTH_ENDPOINTS.mfaDisable);
  return unwrapData(toPayload(response));
};

export const getPayrollDownloadUrl = (detailId) => {
  const baseUrl = process.env.REACT_APP_API_BASE_URL || 'https://zgf2pvkx-7888.inc1.devtunnels.ms/api';
  return `${baseUrl}${PAYROLL_ENDPOINTS.download(detailId)}`;
};
