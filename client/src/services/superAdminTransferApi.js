/**
 * Super Admin Role Transfer API Service
 * Handles all API calls for transferring super admin credentials
 * 
 * @module services/superAdminTransferApi
 */

import { apiClient } from '../api/client';

/**
 * Transfer super admin role from current user to another employee
 * Backend will:
 * - Change current user role from SUPER_ADMIN to EMPLOYEE
 * - Change recipient role to SUPER_ADMIN
 * - Transfer all permissions and API keys
 * - Log audit trail
 * - Invalidate current user's session
 * 
 * @param {Object} transferData
 * @param {string} transferData.recipientUserId - ID of the user receiving super admin role
 * @param {string} transferData.recipientEmail - Email of the recipient
 * @param {string} transferData.reason - Reason for the transfer
 * @returns {Promise<Object>} Transfer result with audit log ID
 * @throws {Error} If transfer fails
 * 
 * @example
 * const result = await superAdminTransferApi.transferRole({
 *   recipientUserId: 'user-123',
 *   recipientEmail: 'jane@company.com',
 *   reason: 'Planned succession'
 * });
 * console.log(result.auditLogId);
 */
export const transferRole = async (transferData) => {
  try {
    const response = await apiClient.post(
      '/api/admin/transfer-role',
      {
        recipientUserId: transferData.recipientUserId,
        recipientEmail: transferData.recipientEmail,
        reason: transferData.reason || 'Manual role transfer',
        timestamp: new Date().toISOString(),
      }
    );

    return {
      success: true,
      message: 'Role transfer initiated',
      auditLogId: response.data?.auditLogId,
      transferredAt: response.data?.transferredAt,
    };
  } catch (error) {
    console.error('Error transferring role:', error);
    throw new Error(error.response?.data?.message || 'Failed to transfer role');
  }
};

/**
 * Get list of eligible employees for role transfer
 * Only returns active employees (excluding current super admin)
 * 
 * @param {Object} filters
 * @param {string} filters.department - Optional department filter
 * @param {string} filters.status - Optional status filter (active, etc)
 * @returns {Promise<Array>} List of eligible employees for super admin transfer
 * @throws {Error} If fetch fails
 * 
 * @example
 * const employees = await superAdminTransferApi.getEligibleRecipients();
 */
export const getEligibleRecipients = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.department) params.append('department', filters.department);
    if (filters.status) params.append('status', filters.status);

    const response = await apiClient.get(
      `/api/admin/eligible-recipients${params.toString() ? '?' + params.toString() : ''}`
    );

    return response.data?.employees || [];
  } catch (error) {
    console.error('Error fetching eligible recipients:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch eligible recipients');
  }
};

/**
 * Verify super admin credentials before transfer
 * Ensures current user is actually super admin and has transfer permissions
 * 
 * @param {string} currentAdminPassword - Password to verify current admin
 * @returns {Promise<Object>} Verification result
 * @throws {Error} If verification fails
 * 
 * @example
 * const verified = await superAdminTransferApi.verifyAdminCredentials(adminPassword);
 */
export const verifyAdminCredentials = async (currentAdminPassword) => {
  try {
    const response = await apiClient.post('/api/admin/verify-transfer-permission', {
      password: currentAdminPassword,
    });

    return {
      verified: true,
      adminName: response.data?.adminName,
      adminEmail: response.data?.adminEmail,
    };
  } catch (error) {
    console.error('Error verifying credentials:', error);
    throw new Error('Invalid credentials or insufficient permissions');
  }
};

/**
 * Get transfer history/audit log
 * Shows all previous super admin role transfers
 * 
 * @param {Object} filters
 * @param {number} filters.limit - Max results to return
 * @param {number} filters.offset - Pagination offset
 * @returns {Promise<Array>} List of previous role transfers
 * @throws {Error} If fetch fails
 * 
 * @example
 * const history = await superAdminTransferApi.getTransferHistory({ limit: 10 });
 */
export const getTransferHistory = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);

    const response = await apiClient.get(
      `/api/admin/transfer-history${params.toString() ? '?' + params.toString() : ''}`
    );

    return response.data?.transfers || [];
  } catch (error) {
    console.error('Error fetching transfer history:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch transfer history');
  }
};

/**
 * Cancel pending transfer (if still in progress)
 * Only works if transfer hasn't been finalized yet
 * 
 * @param {string} transferId - ID of the transfer to cancel
 * @throws {Error} If cancellation fails or transfer already completed
 * 
 * @example
 * await superAdminTransferApi.cancelTransfer(transferId);
 */
export const cancelTransfer = async (transferId) => {
  try {
    const response = await apiClient.post(
      `/api/admin/cancel-transfer/${transferId}`
    );

    return {
      success: true,
      message: response.data?.message || 'Transfer cancelled successfully',
    };
  } catch (error) {
    console.error('Error cancelling transfer:', error);
    throw new Error(
      error.response?.data?.message || 'Failed to cancel transfer (may already be completed)'
    );
  }
};

/**
 * Get current transfer status
 * Checks if there's a pending or in-progress transfer
 * 
 * @returns {Promise<Object|null>} Transfer status if one exists, null otherwise
 * @throws {Error} If fetch fails
 * 
 * @example
 * const status = await superAdminTransferApi.getTransferStatus();
 * if (status?.inProgress) {
 *   console.log('Transfer in progress to:', status.recipientEmail);
 * }
 */
export const getTransferStatus = async () => {
  try {
    const response = await apiClient.get('/api/admin/transfer-status');
    return response.data?.transfer || null;
  } catch (error) {
    console.error('Error fetching transfer status:', error);
    return null;
  }
};

/**
 * Get what will be transferred
 * Returns detailed breakdown of all permissions, API keys, and access
 * 
 * @returns {Promise<Object>} Detailed transfer breakdown
 * @throws {Error} If fetch fails
 * 
 * @example
 * const transferDetails = await superAdminTransferApi.getTransferDetails();
 * console.log(transferDetails.permissions);
 * console.log(transferDetails.apiKeys);
 */
export const getTransferDetails = async () => {
  try {
    const response = await apiClient.get('/api/admin/transfer-details');

    return {
      permissions: response.data?.permissions || [],
      apiKeys: response.data?.apiKeys || [],
      databases: response.data?.databases || [],
      systems: response.data?.systems || [],
      accessLevel: response.data?.accessLevel || 'FULL',
    };
  } catch (error) {
    console.error('Error fetching transfer details:', error);
    throw new Error('Failed to fetch transfer details');
  }
};

/**
 * Validate if a user is eligible to receive super admin role
 * Checks department, clearance level, tenure, etc.
 * 
 * @param {string} userId - User ID to validate
 * @returns {Promise<Object>} Validation result with reasons if ineligible
 * @throws {Error} If validation fails
 * 
 * @example
 * const validation = await superAdminTransferApi.validateRecipient(userId);
 * if (!validation.eligible) {
 *   console.log('Not eligible:', validation.reasons);
 * }
 */
export const validateRecipient = async (userId) => {
  try {
    const response = await apiClient.get(`/api/admin/validate-recipient/${userId}`);

    return {
      eligible: response.data?.eligible || false,
      reasons: response.data?.reasons || [],
      warnings: response.data?.warnings || [],
    };
  } catch (error) {
    console.error('Error validating recipient:', error);
    throw new Error('Failed to validate recipient');
  }
};

/**
 * Create backup before transfer
 * Backs up current admin's important data and configurations
 * 
 * @returns {Promise<Object>} Backup result with backup ID
 * @throws {Error} If backup fails
 * 
 * @example
 * const backup = await superAdminTransferApi.createBackup();
 * console.log('Backup created:', backup.backupId);
 */
export const createBackup = async () => {
  try {
    const response = await apiClient.post('/api/admin/create-transfer-backup');

    return {
      success: true,
      backupId: response.data?.backupId,
      backupTime: response.data?.backupTime,
      backupSize: response.data?.backupSize,
    };
  } catch (error) {
    console.error('Error creating backup:', error);
    throw new Error('Failed to create backup before transfer');
  }
};

const superAdminTransferApi = {
  transferRole,
  getEligibleRecipients,
  verifyAdminCredentials,
  getTransferHistory,
  cancelTransfer,
  getTransferStatus,
  getTransferDetails,
  validateRecipient,
  createBackup,
};

export default superAdminTransferApi;
