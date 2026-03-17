/**
 * Manpower Planning API Service
 * Client-side service for fetching workforce planning metrics and related data
 *
 * @module manpowerPlanningApi
 * @author HR Team
 * @version 1.0.0
 *
 * Features:
 * - Fetch workforce metrics (strength, positions, approvals, efficiency)
 * - Retrieve open job positions with filtering and pagination
 * - Get pending leave/approval requests
 * - Department-wise workforce summary
 * - Trend analysis for visualization
 * - Comprehensive error handling and data validation
 */

import API from '../api/client';
import { MANPOWER_PLANNING_ENDPOINTS } from '../api/endpoints';

// ============================================================================
// CONSTANTS
// ============================================================================

const API_DEFAULTS = {
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  RETRY_ATTEMPTS: 3,
  TIMEOUT: 10000,
};

const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  SERVER_ERROR: 'Failed to fetch workforce data. Please try again later.',
  INVALID_DATA: 'Invalid data received from server.',
  UNAUTHORIZED: 'You do not have permission to access workforce metrics.',
  TIMEOUT: 'Request timeout. Please try again.',
  PARSE_ERROR: 'Failed to parse response data.',
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Extract and validate response payload
 * @param {Object} response - Axios response object
 * @returns {Object} Validated payload
 * @throws {Error} If response is invalid
 */
const toPayload = (response) => {
  if (!response) return {};
  const data = response?.data || {};
  if (!data.success && data.status !== 'success') {
    throw new Error(data.message || 'Invalid response from server');
  }
  // Backend spreads data directly, so we return the full response data minus success/message
  const { success, message, ...payload } = data;
  return payload || {};
};

/**
 * Handle API errors with consistent messaging
 * @param {Error} err - Error object
 * @returns {Object} Formatted error object
 */
const handleError = (err) => {
  console.error('Manpower Planning API Error:', err);

  let message = ERROR_MESSAGES.SERVER_ERROR;
  let statusCode = 500;

  if (err.response) {
    statusCode = err.response.status;
    message = err.response.data?.message || ERROR_MESSAGES.SERVER_ERROR;

    if (statusCode === 401 || statusCode === 403) {
      message = ERROR_MESSAGES.UNAUTHORIZED;
    } else if (statusCode === 400) {
      message = 'Invalid request. Please check your input.';
    }
  } else if (err.code === 'ECONNABORTED') {
    message = ERROR_MESSAGES.TIMEOUT;
  } else if (!err.response) {
    message = ERROR_MESSAGES.NETWORK_ERROR;
  }

  return {
    success: false,
    error: message,
    statusCode,
    details: err.response?.data?.details || null,
  };
};

/**
 * Validate metrics data structure
 * @param {Object} metrics - Metrics object to validate
 * @returns {boolean} True if valid
 */
const validateMetrics = (metrics) => {
  if (!metrics || typeof metrics !== 'object') return false;
  const requiredFields = ['totalStrength', 'openPositions', 'pendingApprovals', 'departmentEfficiency'];
  return requiredFields.every((field) => field in metrics);
};

// ============================================================================
// API METHODS
// ============================================================================

/**
 * Fetch workforce planning metrics summary
 * Retrieves: total strength, open positions, pending approvals, department efficiency
 *
 * @async
 * @returns {Promise<Object>} Metrics data with trends
 * @example
 * const { metrics } = await getMetrics();
 * console.log(metrics.totalStrength); // { value: 1250, trend: {...} }
 */
const getMetrics = async () => {
  try {
    const response = await API.get(MANPOWER_PLANNING_ENDPOINTS.metrics);
    const payload = toPayload(response);

    if (!payload?.metrics || !validateMetrics(payload.metrics)) {
      throw new Error(ERROR_MESSAGES.INVALID_DATA);
    }

    return {
      success: true,
      metrics: payload.metrics,
      timestamp: payload.timestamp,
      metadata: payload.metadata,
    };
  } catch (err) {
    return handleError(err);
  }
};

/**
 * Fetch open job positions with pagination and filtering
 *
 * @async
 * @param {Object} options - Query options
 * @param {number} options.limit - Records per page (default: 20)
 * @param {number} options.skip - Records to skip (default: 0)
 * @param {string} options.department - Filter by department (optional)
 * @returns {Promise<Object>} Positions array and pagination info
 *
 * @example
 * const { positions, pagination } = await getOpenPositions({ limit: 10, department: 'IT' });
 */
const getOpenPositions = async (options = {}) => {
  try {
    const endpoint = MANPOWER_PLANNING_ENDPOINTS.openPositions(options);
    const response = await API.get(endpoint);
    const payload = toPayload(response);

    if (!Array.isArray(payload?.positions)) {
      throw new Error(ERROR_MESSAGES.INVALID_DATA);
    }

    return {
      success: true,
      positions: payload.positions,
      pagination: payload.pagination || {
        total: payload.positions.length,
        limit: options.limit || 20,
        skip: options.skip || 0,
        pages: 1,
      },
    };
  } catch (err) {
    return handleError(err);
  }
};

/**
 * Fetch pending leave/approval requests with pagination
 *
 * @async
 * @param {Object} options - Query options
 * @param {number} options.limit - Records per page (default: 20)
 * @param {number} options.skip - Records to skip (default: 0)
 * @returns {Promise<Object>} Approvals array and pagination info
 *
 * @example
 * const { approvals, pagination } = await getPendingApprovals({ limit: 15 });
 */
const getPendingApprovals = async (options = {}) => {
  try {
    const endpoint = MANPOWER_PLANNING_ENDPOINTS.pendingApprovals(options);
    const response = await API.get(endpoint);
    const payload = toPayload(response);

    if (!Array.isArray(payload?.approvals)) {
      throw new Error(ERROR_MESSAGES.INVALID_DATA);
    }

    return {
      success: true,
      approvals: payload.approvals,
      pagination: payload.pagination || {
        total: payload.approvals.length,
        limit: options.limit || 20,
        skip: options.skip || 0,
        pages: 1,
      },
    };
  } catch (err) {
    return handleError(err);
  }
};

/**
 * Fetch department-wise workforce summary
 * Returns strength, budget, and efficiency for each department
 *
 * @async
 * @returns {Promise<Object>} Departments array with metrics
 *
 * @example
 * const { departments } = await getDepartmentsSummary();
 * departments.forEach(dept => console.log(dept.name, dept.strength));
 */
const getDepartmentsSummary = async () => {
  try {
    const response = await API.get(MANPOWER_PLANNING_ENDPOINTS.departmentsSummary);
    const payload = toPayload(response);

    if (!Array.isArray(payload?.departments)) {
      throw new Error(ERROR_MESSAGES.INVALID_DATA);
    }

    return {
      success: true,
      departments: payload.departments,
      totalDepartments: payload.totalDepartments || payload.departments.length,
      totalStrength: payload.totalStrength || 0,
    };
  } catch (err) {
    return handleError(err);
  }
};

/**
 * Fetch workforce trend data for time-period analysis
 * Useful for visualization and historical analysis
 *
 * @async
 * @param {string} period - Time period: 'week', 'month', 'quarter', 'year' (default: 'month')
 * @returns {Promise<Object>} Trend data array with date and metrics
 *
 * @example
 * const { trends } = await getTrends('month');
 * // Each trend: { date: '2026-02-15', totalStrength: 1248, openPositions: 22 }
 */
const getTrends = async (period = 'month') => {
  try {
    const endpoint = MANPOWER_PLANNING_ENDPOINTS.trends(period);
    const response = await API.get(endpoint);
    const payload = toPayload(response);

    if (!Array.isArray(payload?.trends)) {
      throw new Error(ERROR_MESSAGES.INVALID_DATA);
    }

    return {
      success: true,
      trends: payload.trends,
      period: payload.period || period,
      dataPoints: payload.dataPoints || payload.trends.length,
    };
  } catch (err) {
    return handleError(err);
  }
};

/**
 * Get all critical workforce data in one call
 * Combines metrics, departments, and trends for dashboard initialization
 *
 * @async
 * @returns {Promise<Object>} Combined data from all endpoints
 *
 * @example
 * const { metrics, departments, trends } = await getDashboardData();
 */
const getDashboardData = async () => {
  try {
    const [metricsRes, departmentsRes, trendsRes] = await Promise.all([
      getMetrics(),
      getDepartmentsSummary(),
      getTrends('month'),
    ]);

    // Check if any request failed
    if (!metricsRes.success || !departmentsRes.success || !trendsRes.success) {
      throw new Error('Failed to fetch complete dashboard data');
    }

    return {
      success: true,
      metrics: metricsRes.metrics,
      departments: departmentsRes.departments,
      trends: trendsRes.trends,
      totalDepartments: departmentsRes.totalDepartments,
      totalStrength: departmentsRes.totalStrength,
    };
  } catch (err) {
    return handleError(err);
  }
};

// ============================================================================
// EXPORT API SERVICE
// ============================================================================

export default {
  getMetrics,
  getOpenPositions,
  getPendingApprovals,
  getDepartmentsSummary,
  getTrends,
  getDashboardData,
};
