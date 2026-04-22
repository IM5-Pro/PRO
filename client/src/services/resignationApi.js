/**
 * Resignation API Service
 * Centralized service for resignation-related API calls
 * 
 * @module resignationApi
 * @author HR Team
 * @version 1.0.0
 * 
 * Architecture:
 * - Centralized API communication layer for resignation management
 * - Response normalization and error handling
 * - Type validation and data transformation
 * - Efficient error messages and debugging
 */

import API from '../api/client';
import { RESIGNATION_ENDPOINTS } from '../api/endpoints';

// ============================================================================
// CONSTANTS
// ============================================================================

const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  INVALID_DATA: 'Invalid resignation data format.',
  VALIDATION_ERROR: 'Validation failed. Please check all required fields.',
  NOT_FOUND: 'Resignation request not found.',
  UNAUTHORIZED: 'You do not have permission to perform this action.',
  TIMEOUT: 'Request timeout. Please try again.',
  DUPLICATE: 'An active resignation request already exists.',
};

const RESIGNATION_REASONS = [
  { value: 'CAREER_GROWTH', label: 'Career Growth Opportunity' },
  { value: 'HIGHER_EDUCATION', label: 'Higher Education' },
  { value: 'RELOCATION', label: 'Relocation' },
  { value: 'PERSONAL_REASONS', label: 'Personal Reasons' },
  { value: 'HEALTH_ISSUES', label: 'Health Issues' },
  { value: 'FAMILY_RESPONSIBILITIES', label: 'Family Responsibilities' },
  { value: 'BETTER_OPPORTUNITY', label: 'Better Job Opportunity' },
  { value: 'WORKPLACE_DISSATISFACTION', label: 'Workplace Dissatisfaction' },
  { value: 'SALARY_EXPECTATIONS', label: 'Salary Expectations' },
  { value: 'WORK_LIFE_BALANCE', label: 'Work-Life Balance' },
  { value: 'OTHER', label: 'Other' },
];

const STATUS_LABELS = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  MANAGER_APPROVED: 'Approved by Manager',
  MANAGER_REJECTED: 'Rejected by Manager',
  HR_APPROVED: 'Approved by HR',
  HR_REJECTED: 'Rejected by HR',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const STATUS_COLORS = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SUBMITTED: 'bg-blue-100 text-blue-800',
  MANAGER_APPROVED: 'bg-blue-100 text-blue-800',
  MANAGER_REJECTED: 'bg-red-100 text-red-800',
  HR_APPROVED: 'bg-green-100 text-green-800',
  HR_REJECTED: 'bg-red-100 text-red-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const toPayload = (response) => response?.data || {};

const getErrorMessage = (error) => {
  if (!error) return ERROR_MESSAGES.SERVER_ERROR;

  if (error?.response?.status === 401) {
    return ERROR_MESSAGES.UNAUTHORIZED;
  }
  if (error?.response?.status === 404) {
    return ERROR_MESSAGES.NOT_FOUND;
  }
  if (error?.response?.status === 400) {
    return error?.response?.data?.message || ERROR_MESSAGES.VALIDATION_ERROR;
  }
  if (error?.response?.status === 409) {
    return ERROR_MESSAGES.DUPLICATE;
  }
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.message === 'Network Error') {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }
  return ERROR_MESSAGES.SERVER_ERROR;
};

const formatResignationForDisplay = (resignation) => {
  if (!resignation) return null;

  return {
    ...resignation,
    // Add display labels
    statusLabel: STATUS_LABELS[resignation.status] || resignation.status,
    statusColor: STATUS_COLORS[resignation.status] || 'bg-gray-100',
    reasonLabel: RESIGNATION_REASONS.find(r => r.value === resignation.reasonForLeaving)?.label || resignation.reasonForLeaving,
    daysUntilLastDay: resignation.daysUntilLastDay,
    // Add convenience flags
    isApproved: resignation.status === 'HR_APPROVED',
    isPending: ['DRAFT', 'SUBMITTED', 'MANAGER_APPROVED'].includes(resignation.status),
    isRejected: resignation.status.includes('REJECTED'),
  };
};

// ============================================================================
// RESIGNATION REQUEST OPERATIONS
// ============================================================================

/**
 * Create a new resignation request
 * @param {Object} data - Resignation details
 * @returns {Promise<Object>} Created resignation with all details
 */
export const createResignation = async (data) => {
  try {
    const response = await API.post(RESIGNATION_ENDPOINTS.create, {
      reasonForLeaving: data.reasonForLeaving,
      reasonDescription: data.reasonDescription || '',
      requestedLastDayOfWork: data.requestedLastDayOfWork,
    });

    const payload = toPayload(response);
    const resignation = payload?.data || payload;
    return {
      success: true,
      data: formatResignationForDisplay(resignation),
      message: payload?.message || 'Resignation request submitted successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error),
      details: error?.response?.data,
    };
  }
};

/**
 * Get employee's own resignations
 * @returns {Promise<Object>} Array of resignations and metadata
 */
export const getMyResignations = async () => {
  try {
    const response = await API.get(RESIGNATION_ENDPOINTS.myResignation);
    const payload = toPayload(response);

    const resignations = Array.isArray(payload) 
      ? payload 
      : (payload.data || []);

    console.log('Fetched resignations:', resignations);

    return {
      success: true,
      data: resignations.map(formatResignationForDisplay),
      count: resignations.length,
    };
  } catch (error) {
    console.error('Error fetching resignations:', error);
    return {
      success: false,
      error: getErrorMessage(error),
      data: [],
      count: 0,
    };
  }
};

/**
 * Get team resignations (for managers)
 * @param {Object} options - Query options (status, limit, skip)
 * @returns {Promise<Object>} Array of team resignations
 */
export const getTeamResignations = async (options = {}) => {
  try {
    const params = new URLSearchParams();
    if (options.status) params.append('status', options.status);
    if (options.limit) params.append('limit', options.limit);
    if (options.skip) params.append('skip', options.skip);

    const endpoint = params.toString() 
      ? `${RESIGNATION_ENDPOINTS.teamResignations}?${params}`
      : RESIGNATION_ENDPOINTS.teamResignations;

    const response = await API.get(endpoint);
    const payload = toPayload(response);

    const resignations = payload.data || [];
    return {
      success: true,
      data: resignations.map(formatResignationForDisplay),
      total: payload.total || resignations.length,
      count: resignations.length,
    };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error),
      data: [],
      total: 0,
      count: 0,
    };
  }
};

/**
 * Get all resignations (for HR/Admin)
 * @param {Object} options - Query options
 * @returns {Promise<Object>} All resignations with pagination
 */
export const getAllResignations = async (options = {}) => {
  try {
    const endpoint = RESIGNATION_ENDPOINTS.all(options);
    const response = await API.get(endpoint);
    const payload = toPayload(response);

    const resignations = payload.data || [];
    return {
      success: true,
      data: resignations.map(formatResignationForDisplay),
      total: payload.total || resignations.length,
      count: resignations.length,
    };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error),
      data: [],
      total: 0,
      count: 0,
    };
  }
};

/**
 * Update an existing resignation request
 * @param {string} resignationId - Resignation ID
 * @param {Object} data - Updated resignation details
 * @returns {Promise<Object>} Updated resignation
 */
export const updateResignation = async (resignationId, data) => {
  try {
    const response = await API.put(RESIGNATION_ENDPOINTS.update(resignationId), {
      reasonForLeaving: data.reasonForLeaving,
      reasonDescription: data.reasonDescription || '',
      requestedLastDayOfWork: data.requestedLastDayOfWork,
    });

    const payload = toPayload(response);
    return {
      success: true,
      data: formatResignationForDisplay(payload),
      message: 'Resignation updated successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error),
      details: error?.response?.data,
    };
  }
};

/**
 * Cancel an existing resignation request
 * @param {string} resignationId - Resignation ID
 * @param {string} cancellationReason - Reason for cancellation
 * @returns {Promise<Object>} Cancelled resignation
 */
export const cancelResignation = async (resignationId, cancellationReason = '') => {
  try {
    const response = await API.post(
      RESIGNATION_ENDPOINTS.cancel(resignationId), 
      { cancellationReason }
    );

    const payload = toPayload(response);
    return {
      success: true,
      data: formatResignationForDisplay(payload),
      message: 'Resignation cancelled successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error),
      details: error?.response?.data,
    };
  }
};

// ============================================================================
// APPROVAL/REJECTION OPERATIONS
// ============================================================================

/**
 * Approve a resignation request
 * @param {string} resignationId - Resignation ID
 * @param {Object} data - Approval details
 * @returns {Promise<Object>} Updated resignation
 */
export const approveResignation = async (resignationId, data = {}) => {
  try {
    const response = await API.post(
      RESIGNATION_ENDPOINTS.approve(resignationId),
      {
        approvalNotes: data.approvalNotes || '',
        approvedLastDayOfWork: data.approvedLastDayOfWork,
      }
    );

    const payload = toPayload(response);
    return {
      success: true,
      data: formatResignationForDisplay(payload),
      message: 'Resignation approved successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error),
      details: error?.response?.data,
    };
  }
};

/**
 * Reject a resignation request
 * @param {string} resignationId - Resignation ID
 * @param {string} rejectionReason - Reason for rejection
 * @returns {Promise<Object>} Updated resignation
 */
export const rejectResignation = async (resignationId, rejectionReason = '') => {
  try {
    const response = await API.post(
      RESIGNATION_ENDPOINTS.reject(resignationId),
      { rejectionReason }
    );

    const payload = toPayload(response);
    return {
      success: true,
      data: formatResignationForDisplay(payload),
      message: 'Resignation rejected successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error),
      details: error?.response?.data,
    };
  }
};

// ============================================================================
// STATISTICS & REPORTING
// ============================================================================

/**
 * Get resignation statistics
 * @returns {Promise<Object>} Statistics summary
 */
export const getResignationStats = async () => {
  try {
    const response = await API.get(RESIGNATION_ENDPOINTS.stats);
    const payload = toPayload(response);

    return {
      success: true,
      data: payload,
      stats: {
        total: payload.total || 0,
        pending: payload.pending || 0,
        approved: payload.approved || 0,
        completed: payload.completed || 0,
        rejected: payload.rejected || 0,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error),
      stats: {
        total: 0,
        pending: 0,
        approved: 0,
        completed: 0,
        rejected: 0,
      },
    };
  }
};

// ============================================================================
// REFERENCE DATA
// ============================================================================

export const getResignationReasons = () => RESIGNATION_REASONS;
export const getStatusLabel = (status) => STATUS_LABELS[status] || status;
export const getStatusColor = (status) => STATUS_COLORS[status] || 'bg-gray-100';

const resignationApi = {
  createResignation,
  getMyResignations,
  getTeamResignations,
  getAllResignations,
  updateResignation,
  approveResignation,
  rejectResignation,
  cancelResignation,
  getResignationStats,
  getResignationReasons,
  getStatusLabel,
  getStatusColor,
};

export default resignationApi;
