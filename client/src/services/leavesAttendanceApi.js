/**
 * Leaves & Attendance API Service
 * Comprehensive service for managing leave requests, attendance tracking, and reporting
 * 
 * @module leavesAttendanceApi
 * @author HR Team
 * @version 1.0.0
 * 
 * Architecture:
 * - Centralized API communication layer
 * - Response normalization and error handling
 * - Type validation and data transformation
 * - Efficient error messages and debugging
 */

import API from '../api/client';
import { LEAVE_ENDPOINTS, ATTENDANCE_ENDPOINTS } from '../api/endpoints';

// ============================================================================
// CONSTANTS
// ============================================================================

const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  INVALID_DATA: 'Invalid data format received from server.',
  VALIDATION_ERROR: 'Data validation failed.',
  NOT_FOUND: 'Requested resource not found.',
  UNAUTHORIZED: 'You do not have permission to perform this action.',
  TIMEOUT: 'Request timeout. Please try again.',
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Extract response payload with fallback handling
 * @param {Object} response - Axios response object
 * @returns {Object} Normalized payload
 */
const toPayload = (response) => {
  if (!response) return {};
  return response?.data || {};
};

/**
 * Extract array from various response structures
 * @param {Object} payload - Response payload
 * @param {string} arrayKey - Optional specific key to look for
 * @returns {Array} Extracted array or empty array
 */
const extractArray = (payload, arrayKey) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!payload || typeof payload !== 'object') {
    return [];
  }

  if (arrayKey && Array.isArray(payload[arrayKey])) {
    return payload[arrayKey];
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.records)) {
    return payload.records;
  }

  return [];
};

/**
 * Generate user-friendly error message
 * @param {Error|Object} error - Error object or response
 * @returns {string} Error message
 */
const getErrorMessage = (error) => {
  if (!error) return ERROR_MESSAGES.SERVER_ERROR;

  // Axios error response
  if (error?.response?.status === 401) {
    return ERROR_MESSAGES.UNAUTHORIZED;
  }

  if (error?.response?.status === 404) {
    return ERROR_MESSAGES.NOT_FOUND;
  }

  if (error?.response?.status === 408) {
    return ERROR_MESSAGES.TIMEOUT;
  }

  if (error?.response?.status >= 500) {
    return ERROR_MESSAGES.SERVER_ERROR;
  }

  // Custom message from server
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  // Network error
  if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
    return ERROR_MESSAGES.TIMEOUT;
  }

  if (error?.code === 'ERR_NETWORK') {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }

  return error?.message || ERROR_MESSAGES.SERVER_ERROR;
};

/**
 * Validate date format
 * @param {string} dateStr - Date string to validate
 * @returns {boolean} True if valid ISO date
 */
const isValidDate = (dateStr) => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  return date instanceof Date && !Number.isNaN(date.getTime());
};

/**
 * Normalize leave request data
 * @param {Object} request - Raw leave request from API
 * @returns {Object} Normalized leave request object
 */
const normalizeLeaveRequest = (request) => {
  if (!request) return null;

  const leaveTypeData = request?.leaveTypeId;
  const approvedByData = request?.approvedBy;
  const employeeData = request?.employeeId;

  const leaveTypeName =
    typeof leaveTypeData === 'object'
      ? leaveTypeData?.name || leaveTypeData?.code || 'Leave'
      : request?.leaveTypeName || 'Leave';

  const approverName =
    typeof approvedByData === 'object'
      ? [approvedByData?.firstName, approvedByData?.lastName]
          .filter(Boolean)
          .join(' ')
          .trim() || approvedByData?.email || ''
      : '';

  const employeeName =
    typeof employeeData === 'object'
      ? [employeeData?.firstName, employeeData?.lastName]
          .filter(Boolean)
          .join(' ')
          .trim()
      : '';

  const normalizedStatus = String(request?.status || 'PENDING').toLowerCase();

  return {
    id: request?._id || request?.id,
    type: leaveTypeName,
    startDate: request?.startDate,
    endDate: request?.endDate,
    days: Number(request?.totalDays || 0),
    reason: request?.reason || '-',
    status: normalizedStatus,
    approvedBy: approverName || '-',
    employeeName: employeeName || '-',
    employeeId: typeof employeeData === 'object' ? employeeData?._id : employeeData,
    createdAt: request?.createdAt,
    notes: request?.notes || '',
  };
};

/**
 * Normalize leave balance data
 * @param {Object} balance - Raw balance from API
 * @param {number} colorIndex - Index for color assignment
 * @returns {Object} Normalized balance object
 */
const normalizeLeaveBalance = (balance, colorIndex = 0) => {
  if (!balance) return null;

  const colors = [
    'from-blue-500 to-cyan-500',
    'from-red-500 to-pink-500',
    'from-yellow-500 to-orange-500',
    'from-purple-500 to-pink-500',
    'from-emerald-500 to-green-500',
    'from-indigo-500 to-purple-500',
  ];

  const leaveTypeData = balance?.leaveTypeId;
  const leaveTypeName =
    typeof leaveTypeData === 'object'
      ? leaveTypeData?.name || leaveTypeData?.code || 'Leave'
      : balance?.leaveTypeName || 'Leave';

  const leaveTypeId =
    typeof leaveTypeData === 'object'
      ? leaveTypeData?._id || leaveTypeData?.id
      : leaveTypeData;

  const total = Number(balance?.totalDays ?? leaveTypeData?.totalDays ?? 0);
  const used = Number(balance?.usedDays ?? 0);
  const available = Number(balance?.remainingDays ?? Math.max(0, total - used));

  return {
    type: leaveTypeName,
    leaveTypeId,
    total,
    used,
    available,
    color: colors[colorIndex % colors.length],
    percentage: total > 0 ? Math.round((used / total) * 100) : 0,
  };
};

/**
 * Normalize attendance data
 * @param {Object} attendance - Raw attendance from API
 * @returns {Object} Normalized attendance object
 */
const normalizeAttendance = (attendance) => {
  if (!attendance) return null;

  return {
    id: attendance?._id || attendance?.id,
    date: attendance?.attendanceDate || attendance?.date,
    checkInTime: attendance?.checkInTime,
    checkOutTime: attendance?.checkOutTime,
    status: attendance?.status || 'Unknown',
    workingHours: Number(attendance?.workingHours || 0).toFixed(2),
    location: attendance?.checkInLocation || 'Not recorded',
    remarks: attendance?.remarks || '-',
  };
};

/**
 * Normalize monthly summary data
 * @param {Object} summary - Raw summary from API
 * @returns {Object} Normalized summary object
 */
const normalizeMonthlySummary = (summary) => {
  if (!summary) return null;

  return {
    presentDays: Number(summary?.daysPresent ?? summary?.presentDays ?? 0),
    absentDays: Number(summary?.daysAbsent ?? summary?.absentDays ?? 0),
    wfhDays: Number(summary?.wfhDays ?? 0),
    halfDays: Number(summary?.halfDays ?? 0),
    totalWorkingHours: Number(summary?.totalWorkingHours ?? 0).toFixed(1),
    averageWorkingHours: Number(summary?.averageWorkingHours ?? 0).toFixed(1),
    attendanceRate: Number(summary?.attendanceRate ?? 0).toFixed(1),
  };
};

// ============================================================================
// API METHODS - LEAVES
// ============================================================================

/**
 * Fetch employee's own leave requests
 * @param {Object} options - Fetch options
 * @param {number} options.limit - Records limit
 * @returns {Promise<{data: Array, error: string|null}>}
 */
export const fetchOwnLeaveRequests = async (options = {}) => {
  try {
    const endpoint = LEAVE_ENDPOINTS.own;
    const response = await API.get(endpoint);
    const payload = toPayload(response);
    const records = extractArray(payload, 'data');
    const normalized = records
      .map(normalizeLeaveRequest)
      .filter(Boolean);

    return { data: normalized, error: null, raw: payload };
  } catch (error) {
    return {
      data: [],
      error: getErrorMessage(error),
      raw: null,
    };
  }
};

/**
 * Fetch team's leave requests (manager view)
 * @param {Object} options - Fetch options
 * @returns {Promise<{data: Array, error: string|null}>}
 */
export const fetchTeamLeaveRequests = async (options = {}) => {
  try {
    const endpoint = LEAVE_ENDPOINTS.team;
    const response = await API.get(endpoint);
    const payload = toPayload(response);
    const records = extractArray(payload, 'data');
    const normalized = records
      .map(normalizeLeaveRequest)
      .filter(Boolean);

    return { data: normalized, error: null, raw: payload };
  } catch (error) {
    return {
      data: [],
      error: getErrorMessage(error),
      raw: null,
    };
  }
};

/**
 * Fetch all leave requests (admin view)
 * @param {Object} options - Fetch options
 * @returns {Promise<{data: Array, error: string|null}>}
 */
export const fetchAllLeaveRequests = async (options = {}) => {
  try {
    const endpoint = LEAVE_ENDPOINTS.all;
    const response = await API.get(endpoint);
    const payload = toPayload(response);
    const records = extractArray(payload, 'data');
    const normalized = records
      .map(normalizeLeaveRequest)
      .filter(Boolean);

    return { data: normalized, error: null, raw: payload };
  } catch (error) {
    return {
      data: [],
      error: getErrorMessage(error),
      raw: null,
    };
  }
};

/**
 * Fetch leave balance for current employee
 * @param {Object} options - Fetch options
 * @returns {Promise<{data: Array, error: string|null}>}
 */
export const fetchLeaveBalance = async (options = {}) => {
  try {
    const endpoint = LEAVE_ENDPOINTS.balance();
    const response = await API.get(endpoint);
    const payload = toPayload(response);
    const records = extractArray(payload, 'data');
    const normalized = records
      .map((balance, index) => normalizeLeaveBalance(balance, index))
      .filter(Boolean);

    return { data: normalized, error: null, raw: payload };
  } catch (error) {
    return {
      data: [],
      error: getErrorMessage(error),
      raw: null,
    };
  }
};

/**
 * Fetch leave policies
 * @param {Object} options - Fetch options
 * @returns {Promise<{data: Array, error: string|null}>}
 */
export const fetchLeavePolicies = async (options = {}) => {
  try {
    const endpoint = LEAVE_ENDPOINTS.policy;
    const response = await API.get(endpoint);
    const payload = toPayload(response);
    const records = extractArray(payload, 'data');
    const normalized = records
      .map((policy) => ({
        id: policy?._id || policy?.id,
        name: policy?.name || policy?.code || 'Leave',
        totalDays: Number(policy?.totalDays || 0),
        code: policy?.code || '',
        description: policy?.description || '',
      }))
      .filter(Boolean);

    return { data: normalized, error: null, raw: payload };
  } catch (error) {
    return {
      data: [],
      error: getErrorMessage(error),
      raw: null,
    };
  }
};

/**
 * Create a leave request
 * @param {Object} leaveData - Leave request data
 * @returns {Promise<{data: Object, error: string|null}>}
 */
export const createLeaveRequest = async (leaveData) => {
  try {
    // Validate input
    if (!leaveData?.leaveTypeId || !leaveData?.startDate || !leaveData?.endDate) {
      return {
        data: null,
        error: 'Leave type, start date, and end date are required.',
      };
    }

    if (!isValidDate(leaveData.startDate) || !isValidDate(leaveData.endDate)) {
      return {
        data: null,
        error: 'Invalid date format. Use YYYY-MM-DD format.',
      };
    }

    if (new Date(leaveData.startDate) > new Date(leaveData.endDate)) {
      return {
        data: null,
        error: 'Start date must be before or equal to end date.',
      };
    }

    const response = await API.post(LEAVE_ENDPOINTS.create, {
      leaveTypeId: leaveData.leaveTypeId,
      startDate: leaveData.startDate,
      endDate: leaveData.endDate,
      reason: String(leaveData.reason || '').trim(),
    });

    const payload = toPayload(response);
    return {
      data: normalizeLeaveRequest(payload),
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: getErrorMessage(error),
    };
  }
};

/**
 * Approve a leave request
 * @param {string} requestId - Leave request ID
 * @returns {Promise<{data: Object, error: string|null}>}
 */
export const approveLeaveRequest = async (requestId) => {
  try {
    if (!requestId) {
      return { data: null, error: 'Request ID is required.' };
    }

    const response = await API.patch(LEAVE_ENDPOINTS.approve(requestId));
    const payload = toPayload(response);

    return {
      data: normalizeLeaveRequest(payload),
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: getErrorMessage(error),
    };
  }
};

/**
 * Reject a leave request
 * @param {string} requestId - Leave request ID
 * @returns {Promise<{data: Object, error: string|null}>}
 */
export const rejectLeaveRequest = async (requestId) => {
  try {
    if (!requestId) {
      return { data: null, error: 'Request ID is required.' };
    }

    const response = await API.patch(LEAVE_ENDPOINTS.reject(requestId));
    const payload = toPayload(response);

    return {
      data: normalizeLeaveRequest(payload),
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: getErrorMessage(error),
    };
  }
};

/**
 * Cancel a leave request
 * @param {string} requestId - Leave request ID
 * @returns {Promise<{data: Object, error: string|null}>}
 */
export const cancelLeaveRequest = async (requestId) => {
  try {
    if (!requestId) {
      return { data: null, error: 'Request ID is required.' };
    }

    const response = await API.post(LEAVE_ENDPOINTS.cancel(requestId));
    const payload = toPayload(response);

    return {
      data: normalizeLeaveRequest(payload),
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: getErrorMessage(error),
    };
  }
};

// ============================================================================
// API METHODS - ATTENDANCE
// ============================================================================

/**
 * Fetch own attendance records
 * @param {Object} options - Fetch options
 * @returns {Promise<{data: Array, error: string|null}>}
 */
export const fetchOwnAttendance = async (options = {}) => {
  try {
    const endpoint = ATTENDANCE_ENDPOINTS.own();
    const response = await API.get(endpoint);
    const payload = toPayload(response);
    const records = extractArray(payload, 'data');
    const normalized = records
      .map(normalizeAttendance)
      .filter(Boolean);

    return { data: normalized, error: null, raw: payload };
  } catch (error) {
    return {
      data: [],
      error: getErrorMessage(error),
      raw: null,
    };
  }
};

/**
 * Fetch team attendance records
 * @param {Object} options - Fetch options
 * @returns {Promise<{data: Array, error: string|null}>}
 */
export const fetchTeamAttendance = async (options = {}) => {
  try {
    const endpoint = ATTENDANCE_ENDPOINTS.team();
    const response = await API.get(endpoint);
    const payload = toPayload(response);
    const records = extractArray(payload, 'data');
    const normalized = records
      .map(normalizeAttendance)
      .filter(Boolean);

    return { data: normalized, error: null, raw: payload };
  } catch (error) {
    return {
      data: [],
      error: getErrorMessage(error),
      raw: null,
    };
  }
};

/**
 * Fetch all attendance records (admin)
 * @param {Object} options - Fetch options
 * @returns {Promise<{data: Array, error: string|null}>}
 */
export const fetchAllAttendance = async (options = {}) => {
  try {
    const endpoint = ATTENDANCE_ENDPOINTS.all();
    const response = await API.get(endpoint);
    const payload = toPayload(response);
    const records = extractArray(payload, 'data');
    const normalized = records
      .map(normalizeAttendance)
      .filter(Boolean);

    return { data: normalized, error: null, raw: payload };
  } catch (error) {
    return {
      data: [],
      error: getErrorMessage(error),
      raw: null,
    };
  }
};

/**
 * Fetch monthly attendance summary
 * @returns {Promise<{data: Object, error: string|null}>}
 */
export const fetchMonthlySummary = async () => {
  try {
    const endpoint = ATTENDANCE_ENDPOINTS.monthlySummary;
    const response = await API.get(endpoint);
    const payload = toPayload(response);
    const summary = payload?.data || payload;

    return {
      data: normalizeMonthlySummary(summary),
      error: null,
      raw: payload,
    };
  } catch (error) {
    return {
      data: null,
      error: getErrorMessage(error),
      raw: null,
    };
  }
};

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Fetch all required data for leaves & attendance dashboard
 * @param {string} userRole - Current user role
 * @returns {Promise<{
 *   leaveRequests: Array,
 *   leaveBalance: Array,
 *   leavePolicies: Array,
 *   attendanceData: Array,
 *   monthlySummary: Object,
 *   errors: Object
 * }>}
 */
export const fetchLeavesAttendanceDashboardData = async (userRole) => {
  const result = {
    leaveRequests: [],
    leaveBalance: [],
    leavePolicies: [],
    attendanceData: [],
    monthlySummary: null,
    errors: {},
  };

  try {
    let leaveRequestsPromise;

    // Fetch leave requests based on role
    if (userRole === 'HR_ADMIN' || userRole === 'SUPER_ADMIN') {
      leaveRequestsPromise = fetchAllLeaveRequests();
    } else if (userRole === 'MANAGER') {
      leaveRequestsPromise = fetchTeamLeaveRequests();
    } else {
      leaveRequestsPromise = fetchOwnLeaveRequests();
    }

    let attendancePromise;
    if (userRole === 'HR_ADMIN' || userRole === 'SUPER_ADMIN') {
      attendancePromise = fetchAllAttendance();
    } else if (userRole === 'MANAGER') {
      attendancePromise = fetchTeamAttendance();
    } else {
      attendancePromise = fetchOwnAttendance();
    }

    // Fetch all data in parallel
    const [leaveRequests, leaveBalance, leavePolicies, attendance, monthlySummary] =
      await Promise.all([
        leaveRequestsPromise,
        fetchLeaveBalance(),
        fetchLeavePolicies(),
        attendancePromise,
        fetchMonthlySummary(),
      ]);

    // Collect results
    if (leaveRequests.error) {
      result.errors.leaveRequests = leaveRequests.error;
    } else {
      result.leaveRequests = leaveRequests.data || [];
    }

    if (leaveBalance.error) {
      result.errors.leaveBalance = leaveBalance.error;
    } else {
      result.leaveBalance = leaveBalance.data || [];
    }

    if (leavePolicies.error) {
      result.errors.leavePolicies = leavePolicies.error;
    } else {
      result.leavePolicies = leavePolicies.data || [];
    }

    if (attendance.error) {
      result.errors.attendance = attendance.error;
    } else {
      result.attendanceData = attendance.data || [];
    }

    if (monthlySummary.error) {
      result.errors.monthlySummary = monthlySummary.error;
    } else {
      result.monthlySummary = monthlySummary.data || null;
    }

    return result;
  } catch (error) {
    return {
      ...result,
      errors: {
        ...result.errors,
        general: getErrorMessage(error),
      },
    };
  }
};

const leavesAttendanceApi = {
  fetchOwnLeaveRequests,
  fetchTeamLeaveRequests,
  fetchAllLeaveRequests,
  fetchLeaveBalance,
  fetchLeavePolicies,
  createLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,
  cancelLeaveRequest,
  fetchOwnAttendance,
  fetchTeamAttendance,
  fetchAllAttendance,
  fetchMonthlySummary,
  fetchLeavesAttendanceDashboardData,
};

export default leavesAttendanceApi;
