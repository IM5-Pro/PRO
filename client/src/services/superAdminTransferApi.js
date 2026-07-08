/**
 * Super Admin Role Transfer API Service
 * Handles all API calls for transferring super admin credentials
 *
 * @module services/superAdminTransferApi
 */

import API from '../api/client';
import { ADMIN_ENDPOINTS } from '../api/endpoints';

/**
 * Transfer super admin role from current user to another employee
 */
export const transferRole = async (transferData) => {
  try {
    const response = await API.post(ADMIN_ENDPOINTS.transferRole, {
      recipientUserId: transferData.recipientUserId,
      recipientEmail: transferData.recipientEmail,
      reason: transferData.reason || 'Manual role transfer',
    });

    return {
      success: true,
      message: response.data?.message || 'Role transfer initiated',
      auditLogId: response.data?.auditLogId,
      transferredAt: response.data?.transferredAt,
    };
  } catch (error) {
    console.error('Error transferring role:', error);
    const apiError =
      error.response?.data?.errors?.error ||
      error.response?.data?.message ||
      'Failed to transfer role';
    throw new Error(apiError);
  }
};

/**
 * Get all employees for role transfer, grouped by department
 */
export const getEligibleRecipients = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.department) params.append('department', filters.department);

    const query = params.toString();
    const response = await API.get(
      `${ADMIN_ENDPOINTS.eligibleRecipients}${query ? `?${query}` : ''}`,
    );

    return {
      employees: response.data?.employees || [],
      departments: response.data?.departments || [],
      departmentOptions: response.data?.departmentOptions || [],
      total: response.data?.total || 0,
    };
  } catch (error) {
    console.error('Error fetching eligible recipients:', error);
    const apiError =
      error.response?.data?.errors?.error ||
      error.response?.data?.message ||
      'Failed to fetch recipients';
    throw new Error(apiError);
  }
};

/**
 * Get transfer history/audit log
 */
export const getTransferHistory = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);

    const query = params.toString();
    const response = await API.get(
      `${ADMIN_ENDPOINTS.transferHistory}${query ? `?${query}` : ''}`,
    );

    return response.data?.transfers || [];
  } catch (error) {
    console.error('Error fetching transfer history:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch transfer history');
  }
};

const superAdminTransferApi = {
  transferRole,
  getEligibleRecipients,
  getTransferHistory,
};

export default superAdminTransferApi;
