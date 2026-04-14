/**
 * Notifications API Service
 * Comprehensive service for managing all types of notifications for all user roles
 * Handles: leave approvals, attendance issues, payroll updates, announcements, system alerts
 * 
 * ✅ ROLE-BASED NOTIFICATIONS:
 * - Employees: Get notifications for their leave approvals/rejections, attendance issues, payroll updates
 * - Managers: Get notifications for pending approvals from their team, team announcements
 * - HR Admins: Get notifications for all pending approvals, system issues, payroll status
 * - Super Admins: Get all notifications including system alerts and critical updates
 * 
 * @module notificationApi
 * @author HR Team
 * @version 1.0.0
 */

import API from '../api/client';
import { NOTIFICATION_ENDPOINTS } from '../api/endpoints';

// ============================================================================
// CONSTANTS
// ============================================================================

const NOTIFICATION_TYPES = {
  // Leave Management
  LEAVE_REQUEST: 'leave_request',
  LEAVE_APPROVAL: 'leave_approval',
  LEAVE_REJECTION: 'leave_rejection',
  
  // Attendance & Timekeeping
  ATTENDANCE_ALERT: 'attendance_alert',
  ATTENDANCE_LATE_ARRIVAL: 'attendance_late_arrival',
  ATTENDANCE_ABSENT: 'attendance_absent',
  ATTENDANCE_CORRECTION: 'attendance_correction',
  ATTENDANCE_CORRECTION_APPROVAL: 'attendance_correction_approval',
  ATTENDANCE_CORRECTION_REJECTION: 'attendance_correction_rejection',
  ATTENDANCE_OVERTIME: 'attendance_overtime',
  ATTENDANCE_SHIFT_CHANGE: 'attendance_shift_change',
  
  // Payroll & Compensation
  PAYROLL_READY: 'payroll_ready',
  PAYROLL_PROCESSED: 'payroll_processed',
  SALARY_SLIP_GENERATED: 'salary_slip_generated',
  REIMBURSEMENT_REQUEST: 'reimbursement_request',
  REIMBURSEMENT_APPROVAL: 'reimbursement_approval',
  REIMBURSEMENT_REJECTION: 'reimbursement_rejection',
  BONUS_NOTIFICATION: 'bonus_notification',
  INCENTIVE_NOTIFICATION: 'incentive_notification',
  TAX_FILING_REMINDER: 'tax_filing_reminder',
  PAYMENT_DELAY_ALERT: 'payment_delay_alert',
  
  // Performance Management
  PERFORMANCE_REVIEW_REQUEST: 'performance_review_request',
  PERFORMANCE_FEEDBACK_REQUEST: 'performance_feedback_request',
  PERFORMANCE_REVIEW_COMPLETE: 'performance_review_complete',
  PERFORMANCE_RATING: 'performance_rating',
  GOAL_SETTING: 'goal_setting',
  OKR_UPDATE: 'okr_update',
  
  // Employee Development
  TRAINING_ASSIGNED: 'training_assigned',
  TRAINING_COMPLETED: 'training_completed',
  CERTIFICATION_EXPIRY: 'certification_expiry',
  SKILL_RECOMMENDATION: 'skill_recommendation',
  PROMOTION_ELIGIBLE: 'promotion_eligible',
  
  // HR Operations
  ONBOARDING_TASK: 'onboarding_task',
  OFFBOARDING_NOTIFICATION: 'offboarding_notification',
  ROLE_CHANGE: 'role_change',
  DESIGNATION_CHANGE: 'designation_change',
  DEPARTMENT_TRANSFER: 'department_transfer',
  TEAM_MEMBERSHIP_CHANGE: 'team_membership_change',
  
  // Meetings & Calendar
  MEETING_INVITATION: 'meeting_invitation',
  MEETING_REMINDER: 'meeting_reminder',
  MEETING_RESCHEDULED: 'meeting_rescheduled',
  ONE_ON_ONE_SCHEDULED: 'one_on_one_scheduled',
  
  // Asset Management
  ASSET_ASSIGNED: 'asset_assigned',
  ASSET_RETURN_REQUEST: 'asset_return_request',
  ASSET_EXPIRY: 'asset_expiry',
  ASSET_MAINTENANCE: 'asset_maintenance',
  SYSTEM_ACCESS_GRANT: 'system_access_grant',
  SYSTEM_ACCESS_REVOKE: 'system_access_revoke',
  
  // Documents & Compliance
  DOCUMENT_REQUEST: 'document_request',
  DOCUMENT_UPLOADED: 'document_uploaded',
  DOCUMENT_EXPIRY: 'document_expiry',
  DOCUMENT_APPROVAL: 'document_approval',
  DOCUMENT_REJECTION: 'document_rejection',
  COMPLIANCE_ALERT: 'compliance_alert',
  
  // Administrative & General
  ANNOUNCEMENT: 'announcement',
  POLICY_UPDATE: 'policy_update',
  SYSTEM_ALERT: 'system_alert',
  SYSTEM_MAINTENANCE: 'system_maintenance',
  HOLIDAY_UPDATE: 'holiday_update',
  BIRTHDAY_REMINDER: 'birthday_reminder',
  WORK_ANNIVERSARY: 'work_anniversary',
  PROBATION_END: 'probation_end',
  CONTRACT_RENEWAL: 'contract_renewal',
  
  // Manager Specific
  MANAGER_ASSIGNMENT: 'manager_assignment',
  TEAM_PERFORMANCE_SUMMARY: 'team_performance_summary',
  PENDING_APPROVALS: 'pending_approvals',
  DIRECT_REPORT_MILESTONE: 'direct_report_milestone',
};

const NOTIFICATION_ICONS = {
  // Leave
  [NOTIFICATION_TYPES.LEAVE_REQUEST]: '📝',
  [NOTIFICATION_TYPES.LEAVE_APPROVAL]: '✅',
  [NOTIFICATION_TYPES.LEAVE_REJECTION]: '❌',
  
  // Attendance
  [NOTIFICATION_TYPES.ATTENDANCE_ALERT]: '⏰',
  [NOTIFICATION_TYPES.ATTENDANCE_LATE_ARRIVAL]: '⏳',
  [NOTIFICATION_TYPES.ATTENDANCE_ABSENT]: '❌',
  [NOTIFICATION_TYPES.ATTENDANCE_CORRECTION]: '📋',
  [NOTIFICATION_TYPES.ATTENDANCE_CORRECTION_APPROVAL]: '✅📋',
  [NOTIFICATION_TYPES.ATTENDANCE_CORRECTION_REJECTION]: '❌📋',
  [NOTIFICATION_TYPES.ATTENDANCE_OVERTIME]: '⚡',
  [NOTIFICATION_TYPES.ATTENDANCE_SHIFT_CHANGE]: '🔄',
  
  // Payroll
  [NOTIFICATION_TYPES.PAYROLL_READY]: '💰',
  [NOTIFICATION_TYPES.PAYROLL_PROCESSED]: '✓💰',
  [NOTIFICATION_TYPES.SALARY_SLIP_GENERATED]: '💵',
  [NOTIFICATION_TYPES.REIMBURSEMENT_REQUEST]: '🧾',
  [NOTIFICATION_TYPES.REIMBURSEMENT_APPROVAL]: '✅🧾',
  [NOTIFICATION_TYPES.REIMBURSEMENT_REJECTION]: '❌🧾',
  [NOTIFICATION_TYPES.BONUS_NOTIFICATION]: '🎁',
  [NOTIFICATION_TYPES.INCENTIVE_NOTIFICATION]: '🏆',
  [NOTIFICATION_TYPES.TAX_FILING_REMINDER]: '📊',
  [NOTIFICATION_TYPES.PAYMENT_DELAY_ALERT]: '⚠️💰',
  
  // Performance
  [NOTIFICATION_TYPES.PERFORMANCE_REVIEW_REQUEST]: '📊',
  [NOTIFICATION_TYPES.PERFORMANCE_FEEDBACK_REQUEST]: '💬',
  [NOTIFICATION_TYPES.PERFORMANCE_REVIEW_COMPLETE]: '✅📊',
  [NOTIFICATION_TYPES.PERFORMANCE_RATING]: '⭐',
  [NOTIFICATION_TYPES.GOAL_SETTING]: '🎯',
  [NOTIFICATION_TYPES.OKR_UPDATE]: '📈',
  
  // Development
  [NOTIFICATION_TYPES.TRAINING_ASSIGNED]: '📚',
  [NOTIFICATION_TYPES.TRAINING_COMPLETED]: '✅📚',
  [NOTIFICATION_TYPES.CERTIFICATION_EXPIRY]: '⏰📜',
  [NOTIFICATION_TYPES.SKILL_RECOMMENDATION]: '💡',
  [NOTIFICATION_TYPES.PROMOTION_ELIGIBLE]: '🚀',
  
  // HR Operations
  [NOTIFICATION_TYPES.ONBOARDING_TASK]: '🆕',
  [NOTIFICATION_TYPES.OFFBOARDING_NOTIFICATION]: '👋',
  [NOTIFICATION_TYPES.ROLE_CHANGE]: '👤',
  [NOTIFICATION_TYPES.DESIGNATION_CHANGE]: '🎖️',
  [NOTIFICATION_TYPES.DEPARTMENT_TRANSFER]: '🔄',
  [NOTIFICATION_TYPES.TEAM_MEMBERSHIP_CHANGE]: '👥',
  
  // Meetings
  [NOTIFICATION_TYPES.MEETING_INVITATION]: '📅',
  [NOTIFICATION_TYPES.MEETING_REMINDER]: '🔔📅',
  [NOTIFICATION_TYPES.MEETING_RESCHEDULED]: '🔄📅',
  [NOTIFICATION_TYPES.ONE_ON_ONE_SCHEDULED]: '💼',
  
  // Asset Management
  [NOTIFICATION_TYPES.ASSET_ASSIGNED]: '📦',
  [NOTIFICATION_TYPES.ASSET_RETURN_REQUEST]: '📤',
  [NOTIFICATION_TYPES.ASSET_EXPIRY]: '⏰📦',
  [NOTIFICATION_TYPES.ASSET_MAINTENANCE]: '🔧',
  [NOTIFICATION_TYPES.SYSTEM_ACCESS_GRANT]: '🔓',
  [NOTIFICATION_TYPES.SYSTEM_ACCESS_REVOKE]: '🔒',
  
  // Documents
  [NOTIFICATION_TYPES.DOCUMENT_REQUEST]: '📄',
  [NOTIFICATION_TYPES.DOCUMENT_UPLOADED]: '📤📄',
  [NOTIFICATION_TYPES.DOCUMENT_EXPIRY]: '⏰📄',
  [NOTIFICATION_TYPES.DOCUMENT_APPROVAL]: '✅📄',
  [NOTIFICATION_TYPES.DOCUMENT_REJECTION]: '❌📄',
  [NOTIFICATION_TYPES.COMPLIANCE_ALERT]: '⚖️',
  
  // Administrative
  [NOTIFICATION_TYPES.ANNOUNCEMENT]: '📢',
  [NOTIFICATION_TYPES.POLICY_UPDATE]: '📖',
  [NOTIFICATION_TYPES.SYSTEM_ALERT]: '⚠️',
  [NOTIFICATION_TYPES.SYSTEM_MAINTENANCE]: '🔧⚙️',
  [NOTIFICATION_TYPES.HOLIDAY_UPDATE]: '🎉',
  [NOTIFICATION_TYPES.BIRTHDAY_REMINDER]: '🎂',
  [NOTIFICATION_TYPES.WORK_ANNIVERSARY]: '🎊',
  [NOTIFICATION_TYPES.PROBATION_END]: '✅🆕',
  [NOTIFICATION_TYPES.CONTRACT_RENEWAL]: '📝',
  
  // Manager
  [NOTIFICATION_TYPES.MANAGER_ASSIGNMENT]: '👔',
  [NOTIFICATION_TYPES.TEAM_PERFORMANCE_SUMMARY]: '📈👥',
  [NOTIFICATION_TYPES.PENDING_APPROVALS]: '⏳✅',
  [NOTIFICATION_TYPES.DIRECT_REPORT_MILESTONE]: '🏅',
};

const NOTIFICATION_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
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
 * @param {Object} response - API response
 * @returns {Object} Normalized payload
 */
const toPayload = (response) => {
  return response?.data || {};
};

/**
 * Format notification for display
 * @param {Object} notification - Raw notification object
 * @returns {Object} Formatted notification
 */
const formatNotification = (notification) => {
  if (!notification) return null;

  
  return {
    id: notification._id || notification.id,
    type: notification.type || NOTIFICATION_TYPES.SYSTEM_ALERT,
    title: notification.title || notification.subject || 'Notification',
    message: notification.message || notification.description || '',
    icon: NOTIFICATION_ICONS[notification.type] || '🔔',
    priority: notification.priority || NOTIFICATION_PRIORITIES.MEDIUM,
    timestamp: notification.createdAt || new Date(),
    read: notification.read || false,
    actionUrl: notification.actionUrl || null,
    referenceId: notification.referenceId || null,
    referenceType: notification.referenceType || null,
    metadata: notification.metadata || {},
  };
};

/**
 * Calculate time ago string
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted time ago
 */
const getTimeAgo = (date) => {
  const now = new Date();
  const diffMs = now - new Date(date);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return new Date(date).toLocaleDateString();
};

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Get all notifications for current user with pagination
 * @param {number} limit - Number of notifications to fetch
 * @param {number} skip - Number of notifications to skip
 * @returns {Promise<Object>} Notifications list with metadata
 */
export const fetchNotifications = async (limit = 10, skip = 0) => {
  try {
    console.log('[notificationApi] Fetching notifications with limit:', limit, 'skip:', skip);
    const response = await API.get(NOTIFICATION_ENDPOINTS.list(limit), {
      params: { skip },
    });
    const data = toPayload(response);
    
    console.log('[notificationApi] API Response:', {
      total: data?.total,
      unread: data?.unread,
      notificationCount: data?.notifications?.length,
      notifications: data?.notifications,
    });
    
    return {
      notifications: (data?.notifications || []).map(formatNotification),
      total: data?.total || 0,
      unread: data?.unread || 0,
    };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
  }
};

/**
 * Get unread notifications count
 * @returns {Promise<number>} Count of unread notifications
 */
export const fetchUnreadCount = async () => {
  try {
    console.log('[notificationApi] Fetching unread count...');
    const response = await API.get(NOTIFICATION_ENDPOINTS.unread);
    const count = toPayload(response)?.unreadCount || 0;
    console.log('[notificationApi] Unread count result:', count);
    return count;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return 0;
  }
};

/**
 * Get notification summary with all types
 * @returns {Promise<Object>} Summary of all notification types
 */
export const fetchNotificationSummary = async () => {
  try {
    const response = await API.get(NOTIFICATION_ENDPOINTS.summary);
    const data = toPayload(response);
    
    return {
      total: data?.total || 0,
      unread: data?.unread || 0,
      pendingApprovals: data?.pendingApprovals || 0,
      attendanceIssues: data?.attendanceIssues || 0,
      payrollUpdates: data?.payrollUpdates || 0,
      announcements: data?.announcements || 0,
      systemAlerts: data?.systemAlerts || 0,
    };
  } catch (error) {
    console.error('Error fetching notification summary:', error);
    return { total: 0, unread: 0 };
  }
};

/**
 * Get pending leave and manager approvals
 * @returns {Promise<Array>} List of pending approval notifications
 */
export const fetchPendingApprovals = async () => {
  try {
    const response = await API.get(NOTIFICATION_ENDPOINTS.pendingApprovals);
    const data = toPayload(response);
    const approvals = data?.approvals || [];
    
    return approvals.map((approval) => ({
      id: approval._id || approval.id,
      type: NOTIFICATION_TYPES.LEAVE_APPROVAL,
      title: `${approval.employeeName} requested ${approval.leaveType} leave`,
      message: `${approval.description || 'Awaiting your approval'}`,
      icon: '📝',
      priority: NOTIFICATION_PRIORITIES.HIGH,
      timestamp: approval.createdAt,
      read: false,
      actionUrl: `/approvals/${approval.id}`,
      metadata: { employeeId: approval.employeeId, leaveId: approval.id },
    }));
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    return [];
  }
};

/**
 * Get pending leave notifications - fetches from main notifications endpoint
 * Filter on frontend side
 * @returns {Promise<Array>} Pending leave notifications
 */
export const fetchLeavePendingNotifications = async () => {
  try {
    console.log('[notificationApi] Fetching leave pending notifications...');
    const response = await API.get(NOTIFICATION_ENDPOINTS.list());
    const data = toPayload(response);
    
    console.log('[notificationApi] Leave API Response - Total notifications:', data?.notifications?.length);
    
    const leaves = (data?.notifications || []).filter(
      n => n.type === NOTIFICATION_TYPES.LEAVE_REQUEST || n.type === 'leave_request'
    );
    
    console.log('[notificationApi] Filtered leave notifications:', leaves.length, 'Notifications:', leaves.map(l => ({ id: l._id, type: l.type, read: l.read })));
    
    return leaves.map((leave) => formatNotification(leave));
  } catch (error) {
    console.error('Error fetching leave notifications:', error);
    return [];
  }
};

/**
 * Get attendance issue notifications - fetches from main endpoint
 * @returns {Promise<Array>} Attendance alerts and issues
 */
export const fetchAttendanceNotifications = async () => {
  try {
    const response = await API.get(NOTIFICATION_ENDPOINTS.list());
    const data = toPayload(response);
    
    const attendance = (data?.notifications || []).filter(
      n => n.type && n.type.includes('attendance')
    );
    
    return attendance.map((issue) => formatNotification(issue));
  } catch (error) {
    console.error('Error fetching attendance notifications:', error);
    return [];
  }
};

/**
 * Get payroll update notifications - fetches from main endpoint
 * @returns {Promise<Array>} Payroll related notifications
 */
export const fetchPayrollNotifications = async () => {
  try {
    const response = await API.get(NOTIFICATION_ENDPOINTS.list());
    const data = toPayload(response);
    
    const payroll = (data?.notifications || []).filter(
      n => n.type && n.type.includes('payroll')
    );
    
    return payroll.map((update) => formatNotification(update));
  } catch (error) {
    console.error('Error fetching payroll notifications:', error);
    return [];
  }
};

/**
 * Get announcement notifications - fetches from main endpoint
 * @returns {Promise<Array>} Recent announcements
 */
export const fetchAnnouncementNotifications = async () => {
  try {
    const response = await API.get(NOTIFICATION_ENDPOINTS.list());
    const data = toPayload(response);
    
    const announcements = (data?.notifications || []).filter(
      n => n.type === NOTIFICATION_TYPES.ANNOUNCEMENT
    );
    
    return announcements.map((announcement) => formatNotification(announcement));
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return [];
  }
};

/**
 * Get system alert notifications - fetches from main endpoint
 * @returns {Promise<Array>} System alerts
 */
export const fetchSystemAlerts = async () => {
  try {
    const response = await API.get(NOTIFICATION_ENDPOINTS.list());
    const data = toPayload(response);
    
    const alerts = (data?.notifications || []).filter(
      n => n.type && (n.type.includes('system') || n.type.includes('alert'))
    );
    
    return alerts.map((alert) => formatNotification(alert));
  } catch (error) {
    console.error('Error fetching system alerts:', error);
    return [];
  }
};

/**
 * Fetch notifications specific to an employee's role
 * Ensures each role gets notifications relevant to them
 * 
 * EMPLOYEE: Leave status, attendance issues, payroll, general announcements
 * MANAGER: Team's pending leaves, team attendance issues, team updates, general announcements
 * HR_ADMIN: All pending approvals, all attendance issues, payroll, system alerts, announcements
 * SUPER_ADMIN: All notifications including system alerts and critical updates
 * 
 * @param {string} userRole - User's role (employee, manager, hr_admin, super_admin)
 * @returns {Promise<Object>} Role-specific notifications
 */
export const fetchNotificationsByRole = async (userRole = 'employee') => {
  try {
    const normalizedRole = String(userRole).toLowerCase();
    
    switch (normalizedRole) {
      case 'employee':
        // Employees get: their own leave decisions, attendance issues, payroll
        return await fetchEmployeeNotifications();
      
      case 'manager':
        // Managers get: team's pending leaves for approval, team announcements
        return await fetchManagerNotifications();
      
      case 'hr_admin':
      case 'hr admin':
        // HR gets: all pending approvals, system alerts, payroll status
        return await fetchHRNotifications();
      
      case 'super_admin':
      case 'super admin':
        // Super admin gets: everything
        return await fetchComprehensiveNotifications();
      
      default:
        // Default to employee notifications
        return await fetchEmployeeNotifications();
    }
  } catch (error) {
    console.error('Error fetching role-specific notifications:', error);
    return { notifications: [], summary: { total: 0, unread: 0 } };
  }
};

/**
 * Fetch notifications for employees
 * Includes: leave approvals/rejections, attendance alerts, payroll updates
 * @returns {Promise<Object>} Employee-specific notifications
 */
export const fetchEmployeeNotifications = async () => {
  try {
    const [leavePending, attendance, payroll, announcements] = await Promise.all([
      fetchLeavePendingNotifications().catch(() => []),
      fetchAttendanceNotifications().catch(() => []),
      fetchPayrollNotifications().catch(() => []),
      fetchAnnouncementNotifications().catch(() => []),
    ]);

    const allNotifications = [
      ...leavePending,
      ...attendance,
      ...payroll,
      ...announcements,
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return {
      notifications: allNotifications,
      summary: {
        total: allNotifications.length,
        unread: allNotifications.filter((n) => !n.read).length,
        byType: {
          leaves: leavePending.length,
          attendance: attendance.length,
          payroll: payroll.length,
          announcements: announcements.length,
        },
      },
    };
  } catch (error) {
    console.error('Error fetching employee notifications:', error);
    return { notifications: [], summary: { total: 0, unread: 0 } };
  }
};

/**
 * Fetch notifications for managers
 * Includes: team's pending leaves to approve, team announcements
 * @returns {Promise<Object>} Manager-specific notifications
 */
export const fetchManagerNotifications = async () => {
  try {
    console.log('[notificationApi] Fetching Manager notifications...');
    const [approvals, leavePending, announcements] = await Promise.all([
      fetchPendingApprovals().catch(() => []),
      fetchLeavePendingNotifications().catch(() => []),
      fetchAnnouncementNotifications().catch(() => []),
    ]);

    console.log('[notificationApi] Manager notification sources:', {
      approvalsCount: approvals.length,
      leavePendingCount: leavePending.length,
      announcementsCount: announcements.length,
    });

    const allNotifications = [
      ...approvals,
      ...leavePending,
      ...announcements,
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    console.log('[notificationApi] Total manager notifications:', allNotifications.length);

    return {
      notifications: allNotifications,
      summary: {
        total: allNotifications.length,
        unread: allNotifications.filter((n) => !n.read).length,
        byType: {
          approvals: approvals.length,
          leaves: leavePending.length,
          announcements: announcements.length,
        },
      },
    };
  } catch (error) {
    console.error('Error fetching manager notifications:', error);
    return { notifications: [], summary: { total: 0, unread: 0 } };
  }
};

/**
 * Fetch notifications for HR admins
 * Includes: all pending approvals, attendance issues, payroll, system alerts
 * @returns {Promise<Object>} HR admin-specific notifications
 */
export const fetchHRNotifications = async () => {
  try {
    const [approvals, attendance, payroll, systemAlerts, announcements] = await Promise.all([
      fetchPendingApprovals().catch(() => []),
      fetchAttendanceNotifications().catch(() => []),
      fetchPayrollNotifications().catch(() => []),
      fetchSystemAlerts().catch(() => []),
      fetchAnnouncementNotifications().catch(() => []),
    ]);

    const allNotifications = [
      ...approvals,
      ...attendance,
      ...payroll,
      ...systemAlerts,
      ...announcements,
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return {
      notifications: allNotifications,
      summary: {
        total: allNotifications.length,
        unread: allNotifications.filter((n) => !n.read).length,
        byType: {
          approvals: approvals.length,
          attendance: attendance.length,
          payroll: payroll.length,
          system: systemAlerts.length,
          announcements: announcements.length,
        },
      },
    };
  } catch (error) {
    console.error('Error fetching HR notifications:', error);
    return { notifications: [], summary: { total: 0, unread: 0 } };
  }
};

/**
 * Fetch comprehensive notifications from all sources
 * Combines all notification types into a single unified list
 * @returns {Promise<Object>} Aggregated notifications with summary
 */
export const fetchComprehensiveNotifications = async () => {
  try {
    const [
      approvals,
      leavePending,
      attendance,
      payroll,
      announcements,
      systemAlerts,
      summary,
    ] = await Promise.all([
      fetchPendingApprovals().catch(() => []),
      fetchLeavePendingNotifications().catch(() => []),
      fetchAttendanceNotifications().catch(() => []),
      fetchPayrollNotifications().catch(() => []),
      fetchAnnouncementNotifications().catch(() => []),
      fetchSystemAlerts().catch(() => []),
      fetchNotificationSummary().catch(() => ({})),
    ]);

    // Combine and sort all notifications by timestamp (newest first)
    const allNotifications = [
      ...approvals,
      ...leavePending,
      ...attendance,
      ...payroll,
      ...announcements,
      ...systemAlerts,
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return {
      notifications: allNotifications,
      summary: {
        total: allNotifications.length,
        unread: allNotifications.filter((n) => !n.read).length,
        byType: {
          approvals: approvals.length,
          leaves: leavePending.length,
          attendance: attendance.length,
          payroll: payroll.length,
          announcements: announcements.length,
          system: systemAlerts.length,
        },
        ...summary,
      },
    };
  } catch (error) {
    console.error('Error fetching comprehensive notifications:', error);
    return { notifications: [], summary: { total: 0, unread: 0 } };
  }
};

/**
 * Mark a notification as read
 * @param {string} notificationId - ID of notification to mark as read
 * @returns {Promise<boolean>} Success status
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    await API.patch(NOTIFICATION_ENDPOINTS.mark(notificationId));
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
};

/**
 * Mark all notifications as read
 * @returns {Promise<boolean>} Success status
 */
export const markAllNotificationsAsRead = async () => {
  try {
    await API.patch(NOTIFICATION_ENDPOINTS.markAll);
    return true;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }
};

/**
 * Delete a notification
 * @param {string} notificationId - ID of notification to delete
 * @returns {Promise<boolean>} Success status
 */
export const deleteNotification = async (notificationId) => {
  try {
    await API.delete(NOTIFICATION_ENDPOINTS.delete(notificationId));
    return true;
  } catch (error) {
    console.error('Error deleting notification:', error);
    return false;
  }
};

/**
 * Delete all notifications
 * @returns {Promise<boolean>} Success status
 */
export const deleteAllNotifications = async () => {
  try {
    await API.delete(NOTIFICATION_ENDPOINTS.deleteAll);
    return true;
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    return false;
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

export {
  NOTIFICATION_TYPES,
  NOTIFICATION_ICONS,
  NOTIFICATION_PRIORITIES,
  getTimeAgo,
};

const notificationApi = {
  // Core functions
  fetchNotifications,
  fetchUnreadCount,
  fetchNotificationSummary,
  fetchComprehensiveNotifications,
  
  // Role-specific functions
  fetchNotificationsByRole,
  fetchEmployeeNotifications,
  fetchManagerNotifications,
  fetchHRNotifications,
  
  // Type-specific functions
  fetchPendingApprovals,
  fetchLeavePendingNotifications,
  fetchAttendanceNotifications,
  fetchPayrollNotifications,
  fetchAnnouncementNotifications,
  fetchSystemAlerts,
  
  // Actions
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,
};

export default notificationApi;
