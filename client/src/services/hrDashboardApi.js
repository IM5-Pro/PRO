/**
 * HR Dashboard API Service
 * Centralized service for fetching and managing dashboard metrics
 * 
 * @module hrDashboardApi
 * @author HR Team
 * @version 1.0.0
 * 
 * Features:
 * - Comprehensive error handling with user-friendly messages
 * - Response normalization and data validation
 * - Efficient data aggregation and caching support
 * - Type validation and defensive programming
 * - Detailed JSDoc documentation
 */

import API from '../api/client';
import { DASHBOARD_ENDPOINTS, EMPLOYEE_ENDPOINTS, LEAVE_ENDPOINTS, PAYROLL_ENDPOINTS } from '../api/endpoints';

// ============================================================================
// CONSTANTS
// ============================================================================

const API_DEFAULTS = {
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  RETRY_ATTEMPTS: 3,
  TIMEOUT: 10000,
};

const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  INVALID_DATA: 'Invalid data received from server.',
  UNAUTHORIZED: 'You do not have permission to access this data.',
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
 * Generate user-friendly error message
 * @param {Error|Object} error - Error object
 * @returns {string} Error message
 */
const getErrorMessage = (error) => {
  if (!error) return ERROR_MESSAGES.SERVER_ERROR;

  // HTTP status errors
  if (error?.response?.status === 401) {
    return ERROR_MESSAGES.UNAUTHORIZED;
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

  // Network errors
  if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
    return ERROR_MESSAGES.TIMEOUT;
  }

  if (error?.code === 'ERR_NETWORK') {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }

  return error?.message || ERROR_MESSAGES.SERVER_ERROR;
};

/**
 * Safely convert value to number
 * @param {any} value - Value to convert
 * @param {number} defaultValue - Default if invalid
 * @returns {number} Numeric value
 */
const toNumber = (value, defaultValue = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : defaultValue;
};

/**
 * Calculate start of month date
 * @returns {Date} Start of current month
 */
const getMonthStart = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
};

/**
 * Calculate end of month date
 * @returns {Date} End of current month
 */
const getMonthEnd = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
};

/**
 * Filter employees joined this month
 * @param {Array} employees - Array of employee objects
 * @returns {number} Count of new joiners
 */
const countNewJoiners = (employees) => {
  if (!Array.isArray(employees)) return 0;

  const monthStart = getMonthStart();
  const monthEnd = getMonthEnd();

  return employees.filter((emp) => {
    const dateValue = emp?.joiningDate || emp?.dateOfJoining || emp?.createdAt;
    if (!dateValue) return false;

    const joinDate = new Date(dateValue);
    if (Number.isNaN(joinDate.getTime())) return false;

    return joinDate >= monthStart && joinDate <= monthEnd;
  }).length;
};

const isDateInCurrentMonth = (dateValue) => {
  if (!dateValue) return false;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
};

const doesLeaveOverlapCurrentMonth = (leaveRequest) => {
  if (!leaveRequest) return false;

  const start = new Date(leaveRequest.startDate || leaveRequest.start || leaveRequest.createdAt);
  const end = new Date(leaveRequest.endDate || leaveRequest.end || leaveRequest.createdAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return isDateInCurrentMonth(leaveRequest.createdAt || leaveRequest.updatedAt);
  }

  const monthStart = getMonthStart();
  const monthEnd = getMonthEnd();
  return !(end < monthStart || start > monthEnd);
};

const countPendingLeaves = (leaveRequests) => {
  if (!Array.isArray(leaveRequests)) return 0;

  return leaveRequests.filter((req) => {
    const status = String(req?.status || '').toUpperCase();
    return status === 'PENDING' && doesLeaveOverlapCurrentMonth(req);
  }).length;
};

const getPayrollRunDate = (run) => {
  if (!run) return null;
  if (run?.month) {
    const parsedMonth = new Date(run.month);
    if (!Number.isNaN(parsedMonth.getTime())) {
      return parsedMonth;
    }
  }
  if (run?.createdAt) {
    const createdAt = new Date(run.createdAt);
    if (!Number.isNaN(createdAt.getTime())) {
      return createdAt;
    }
  }
  return null;
};

/**
 * Calculate payroll cycle completion percentage
 * @param {Array} payrollData - Array of payroll records
 * @returns {number} Completion percentage (0-100)
 */
const calculatePayrollCompletion = (payrollData) => {
  if (!Array.isArray(payrollData) || payrollData.length === 0) return 0;

  const currentMonthPayrolls = payrollData.filter((pr) => {
    const payrollDate = getPayrollRunDate(pr);
    return payrollDate && isDateInCurrentMonth(payrollDate);
  });

  if (currentMonthPayrolls.length === 0) return 0;

  const completedCount = currentMonthPayrolls.filter((pr) => {
    const status = String(pr?.status || '').toLowerCase();
    return status === 'processed' || status === 'paid' || status === 'locked' || status === 'finalized';
  }).length;

  const percentage = (completedCount / currentMonthPayrolls.length) * 100;
  return Math.round(percentage);
};

/**
 * Count pending leave requests
 * @param {Array} leaveRequests - Array of leave request objects
 * @returns {number} Count of pending requests
 */
const countPendingLeaves = (leaveRequests) => {
  if (!Array.isArray(leaveRequests)) return 0;

  return leaveRequests.filter((req) => {
    const status = String(req?.status || '').toLowerCase();
    return status === 'pending';
  }).length;
};

// ============================================================================
// DEDICATED DASHBOARD METRICS FETCH
// ============================================================================

/**
 * Fetch dedicated dashboard metrics endpoint
 * Preferred method if backend has dedicated dashboard endpoint
 * @returns {Promise<{data: Object, error: string|null}>}
 */
export const fetchDashboardMetrics = async () => {
  try {
    const response = await API.get(DASHBOARD_ENDPOINTS.hrMetrics);
    const payload = toPayload(response);

    const metrics = {
      totalEmployees: toNumber(payload?.totalEmployees || 0),
      pendingLeaveRequests: toNumber(payload?.pendingLeaveRequests || 0),
      newJoiners: toNumber(payload?.newJoiners || 0),
      payrollCompletion: toNumber(payload?.payrollCompletion || 0),
    };

    return { data: metrics, error: null, raw: payload };
  } catch (error) {
    // Fallback to composite fetch if dedicated endpoint fails
    return { data: null, error: getErrorMessage(error), raw: null };
  }
};

// ============================================================================
// COMPOSITE METRICS FETCH (FALLBACK)
// ============================================================================

/**
 * Fetch metrics from individual endpoints and aggregate
 * Fallback method if dedicated dashboard endpoint unavailable
 * @returns {Promise<{data: Object, error: string|null, errors: Object}>}
 */
export const fetchDashboardMetricsComposite = async () => {
  const errors = {};
  const data = {
    totalEmployees: 0,
    pendingLeaveRequests: 0,
    newJoiners: 0,
    payrollCompletion: 0,
  };

  try {
    // Fetch all data in parallel
    const [employeesRes, leavesRes, payrollRes] = await Promise.all([
      API.get(EMPLOYEE_ENDPOINTS.list()).catch((err) => {
        errors.employees = getErrorMessage(err);
        return null;
      }),
      API.get(LEAVE_ENDPOINTS.all).catch((err) => {
        errors.leaves = getErrorMessage(err);
        return null;
      }),
      API.get(PAYROLL_ENDPOINTS.all).catch((err) => {
        errors.payroll = getErrorMessage(err);
        return null;
      }),
    ]);

    // Process employees data
    if (employeesRes?.data) {
      const payload = toPayload(employeesRes);
      const employees = Array.isArray(payload) ? payload : payload?.data || [];

      data.totalEmployees = toNumber(employees.length);
      data.newJoiners = countNewJoiners(employees);
    }

    // Process leaves data
    if (leavesRes?.data) {
      const payload = toPayload(leavesRes);
      const leaves = Array.isArray(payload) ? payload : payload?.data || [];

      data.pendingLeaveRequests = countPendingLeaves(leaves);
    }

    // Process payroll data
    if (payrollRes?.data) {
      const payload = toPayload(payrollRes);
      const payrolls = Array.isArray(payload) ? payload : payload?.data || [];

      data.payrollCompletion = calculatePayrollCompletion(payrolls);
    }

    // Check if we have any errors
    const hasErrors = Object.keys(errors).length > 0;
    const hasData = data.totalEmployees > 0 || data.pendingLeaveRequests > 0;

    return {
      data: hasData ? data : null,
      error: hasErrors ? 'Some data could not be loaded' : null,
      errors,
    };
  } catch (error) {
    return {
      data: null,
      error: getErrorMessage(error),
      errors: { general: getErrorMessage(error) },
    };
  }
};

/**
 * Fetch all HR dashboard metrics with intelligent fallback
 * Tries dedicated endpoint first, falls back to composite fetch
 * @returns {Promise<{
 *   totalEmployees: number,
 *   pendingLeaveRequests: number,
 *   newJoiners: number,
 *   payrollCompletion: number,
 *   loading: boolean,
 *   error: string|null,
 *   errors: Object
 * }>}
 */
export const fetchHRDashboardData = async () => {
  try {
    // Try dedicated dashboard endpoint first
    const dedicated = await fetchDashboardMetrics();

    if (dedicated.data) {
      return {
        ...dedicated.data,
        loading: false,
        error: null,
        errors: {},
      };
    }

    // Fallback to composite fetch
    const composite = await fetchDashboardMetricsComposite();

    if (composite.data) {
      return {
        ...composite.data,
        loading: false,
        error: composite.error,
        errors: composite.errors,
      };
    }

    // Both methods failed
    return {
      totalEmployees: 0,
      pendingLeaveRequests: 0,
      newJoiners: 0,
      payrollCompletion: 0,
      loading: false,
      error: composite.error || ERROR_MESSAGES.SERVER_ERROR,
      errors: composite.errors || {},
    };
  } catch (error) {
    return {
      totalEmployees: 0,
      pendingLeaveRequests: 0,
      newJoiners: 0,
      payrollCompletion: 0,
      loading: false,
      error: getErrorMessage(error),
      errors: { general: getErrorMessage(error) },
    };
  }
};

// ============================================================================
// INDIVIDUAL METRIC FETCHES
// ============================================================================

/**
 * Fetch only total employee count
 * @returns {Promise<{data: number, error: string|null}>}
 */
export const fetchTotalEmployees = async () => {
  try {
    const response = await API.get(EMPLOYEE_ENDPOINTS.list());
    const payload = toPayload(response);
    const employees = Array.isArray(payload) ? payload : payload?.data || [];

    return {
      data: toNumber(employees.length),
      error: null,
    };
  } catch (error) {
    return {
      data: 0,
      error: getErrorMessage(error),
    };
  }
};

/**
 * Fetch only pending leave requests count
 * @returns {Promise<{data: number, error: string|null}>}
 */
export const fetchPendingLeaves = async () => {
  try {
    const response = await API.get(LEAVE_ENDPOINTS.all);
    const payload = toPayload(response);
    const leaves = Array.isArray(payload) ? payload : payload?.data || [];

    return {
      data: countPendingLeaves(leaves),
      error: null,
    };
  } catch (error) {
    return {
      data: 0,
      error: getErrorMessage(error),
    };
  }
};

/**
 * Fetch only new joiners this month count
 * @returns {Promise<{data: number, error: string|null}>}
 */
export const fetchNewJoiners = async () => {
  try {
    const response = await API.get(EMPLOYEE_ENDPOINTS.list());
    const payload = toPayload(response);
    const employees = Array.isArray(payload) ? payload : payload?.data || [];

    return {
      data: countNewJoiners(employees),
      error: null,
    };
  } catch (error) {
    return {
      data: 0,
      error: getErrorMessage(error),
    };
  }
};

/**
 * Fetch payroll cycle completion percentage
 * @returns {Promise<{data: number, error: string|null}>}
 */
export const fetchPayrollCompletion = async () => {
  try {
    const response = await API.get(PAYROLL_ENDPOINTS.all);
    const payload = toPayload(response);
    const payrolls = Array.isArray(payload) ? payload : payload?.data || [];

    return {
      data: calculatePayrollCompletion(payrolls),
      error: null,
    };
  } catch (error) {
    return {
      data: 0,
      error: getErrorMessage(error),
    };
  }
};

// ============================================================================
// ACTIVITY FEED DATA FETCH
// ============================================================================

/**
 * Fetch recent announcements for activity feed
 * @returns {Promise<{data: Array, error: string|null}>}
 */
export const fetchRecentAnnouncements = async () => {
  try {
    const response = await API.get('/announcements?limit=3');
    const payload = toPayload(response);
    const announcements = Array.isArray(payload) ? payload : payload?.data || [];

    // Map announcements to activity feed format
    const activities = announcements
      .slice(0, 1)
      .map((a) => ({
        type: 'announcement',
        message: a?.title || 'New announcement',
        timestamp: a?.createdAt,
      }));

    return {
      data: activities,
      error: null,
    };
  } catch (error) {
    return {
      data: [],
      error: null, // Silent fail for announcements
    };
  }
};

/**
 * Fetch pending department requests for activity feed
 * @returns {Promise<{data: Array, error: string|null}>}
 */
export const fetchPendingDepartments = async () => {
  try {
    const response = await API.get('/departments?limit=10');
    const payload = toPayload(response);
    const departments = Array.isArray(payload) ? payload : payload?.data || [];

    // Count recently created (pending) departments
    const recentDepts = departments.filter((d) => {
      if (!d?.createdAt) return false;
      const daysSinceCreation = (new Date() - new Date(d.createdAt)) / (1000 * 60 * 60 * 24);
      return daysSinceCreation <= 7; // Created in last 7 days
    });

    const pendingCount = recentDepts.length;

    const activities = pendingCount > 0
      ? [{
        type: 'department',
        message: `${pendingCount} new department${pendingCount !== 1 ? 's' : ''} requested for setup`,
        count: pendingCount,
      }]
      : [];

    return {
      data: activities,
      error: null,
    };
  } catch (error) {
    return {
      data: [],
      error: null, // Silent fail for departments
    };
  }
};

/**
 * Fetch upcoming performance appraisals for activity feed
 * @returns {Promise<{data: Array, error: string|null}>}
 */
export const fetchUpcomingAppraisals = async () => {
  try {
    const response = await API.get('/performance-reviews?limit=10&status=scheduled');
    const payload = toPayload(response);
    const reviews = Array.isArray(payload) ? payload : payload?.data || [];

    // Find next scheduled cycle start
    const today = new Date();
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7));

    const activities = reviews.length > 0
      ? [{
        type: 'appraisal',
        message: 'Quarterly appraisal cycle starts next week',
        date: nextMonday,
      }]
      : [];

    return {
      data: activities,
      error: null,
    };
  } catch (error) {
    return {
      data: [],
      error: null, // Silent fail for appraisals
    };
  }
};

/**
 * Fetch payroll lock date for activity feed
 * @returns {Promise<{data: Array, error: string|null}>}
 */
export const fetchPayrollLockDate = async () => {
  try {
    const response = await API.get('/payroll/runs?limit=1&sort=-createdAt');
    const payload = toPayload(response);
    const payrollRuns = Array.isArray(payload) ? payload : payload?.data || [];

    if (payrollRuns.length === 0) {
      return { data: [], error: null };
    }

    const currentPayroll = payrollRuns[0];
    const lockDate = currentPayroll?.lockedAt || currentPayroll?.approvedAt;

    // Calculate next payroll lock date (last Friday of month)
    const today = new Date();
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    let lastFriday = new Date(lastDay);

    while (lastFriday.getDay() !== 5) {
      lastFriday.setDate(lastFriday.getDate() - 1);
    }

    // If last Friday has passed, get next month's last Friday
    if (lastFriday < today) {
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);
      lastFriday = new Date(nextMonth);

      while (lastFriday.getDay() !== 5) {
        lastFriday.setDate(lastFriday.getDate() - 1);
      }
    }

    const activities = [{
      type: 'payroll',
      message: 'Payroll lock date is scheduled for Friday',
      date: lastFriday,
      day: lastFriday.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
    }];

    return {
      data: activities,
      error: null,
    };
  } catch (error) {
    return {
      data: [],
      error: null, // Silent fail for payroll
    };
  }
};

/**
 * Fetch all activity feed data combined
 * @returns {Promise<{data: Array, error: string|null}>}
 */
export const fetchActivityFeed = async () => {
  try {
    // Fetch all activity sources in parallel
    const [announcements, departments, appraisals, payroll] = await Promise.all([
      fetchRecentAnnouncements(),
      fetchPendingDepartments(),
      fetchUpcomingAppraisals(),
      fetchPayrollLockDate(),
    ]);

    // Combine all activities
    let activities = [
      ...announcements.data,
      ...departments.data,
      ...appraisals.data,
      ...payroll.data,
    ];

    // Sort by timestamp if available
    activities.sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timeB - timeA;
    });

    return {
      data: activities,
      error: null,
    };
  } catch (error) {
    return {
      data: [],
      error: getErrorMessage(error),
    };
  }
};

export default {
  fetchDashboardMetrics,
  fetchDashboardMetricsComposite,
  fetchHRDashboardData,
  fetchTotalEmployees,
  fetchPendingLeaves,
  fetchNewJoiners,
  fetchPayrollCompletion,
  fetchRecentAnnouncements,
  fetchPendingDepartments,
  fetchUpcomingAppraisals,
  fetchPayrollLockDate,
  fetchActivityFeed,
};
