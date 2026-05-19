/**
 * NotificationsPanel Component
 * Displays comprehensive notifications with filtering, sorting, and actions
 * Shows all notification types: leaves, attendance, payroll, announcements, system alerts
 * 
 * @component
 * @author HR Team
 * @version 1.0.0
 */

import React, { useMemo, useState, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FiX,
  FiTrash2,
  FiCheck,
  FiRefreshCw,
  FiFilter,
} from 'react-icons/fi';
import { useNotifications } from '../../context/NotificationContext';

/**
 * Notification badge component
 */
const NotificationBadge = ({ count, highlight = false }) => {
  if (count === 0) return null;

  return (
    <span
      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white ${
        highlight ? 'bg-red-600 animate-pulse' : 'bg-blue-600'
      }`}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
};

/**
 * Helper function to determine navigation path based on notification type
 */
const getNavigationPath = (notification) => {
  const { type } = notification;

  if (type && String(type).startsWith('tool_provisioning')) {
    return '/';
  }

  // Exact type matches (more precise than includes)
  const LEAVE_TYPES = ['leave_request', 'leave_approval', 'leave_rejection', 'leave_cancelled'];
  const ATTENDANCE_TYPES = ['attendance_alert', 'attendance_late_arrival', 'attendance_absent', 'attendance_correction', 'attendance_overtime', 'attendance_shift_change'];
  const PAYROLL_TYPES = ['payroll_ready', 'payroll_processed', 'salary_slip_generated', 'reimbursement_request', 'reimbursement_approval', 'reimbursement_rejection', 'bonus_notification', 'incentive_notification'];
  const PERFORMANCE_TYPES = ['performance_review_request', 'performance_feedback_request', 'performance_review_complete', 'performance_rating', 'goal_setting', 'okr_update'];
  
  // Check exact type matches first (highest priority)
  if (LEAVE_TYPES.includes(type)) {
    return `/?page=leaves`;
  }
  
  if (ATTENDANCE_TYPES.includes(type)) {
    return `/?page=attendance`;
  }
  
  if (PAYROLL_TYPES.includes(type)) {
    return `/?page=payroll`;
  }
  
  if (PERFORMANCE_TYPES.includes(type)) {
    return `/?page=performance`;
  }
  
  // Fall back to includes for other types
  if (type.includes('meeting') || type.includes('one_on_one')) {
    return `/?page=team-collaboration`;
  }
  
  if (type.includes('asset') || type.includes('system_access')) {
    return `/?page=team-collaboration`;
  }
  
  if (type.includes('document')) {
    return `/?page=team-collaboration`;
  }
  
  if (type.includes('training') || type.includes('certification')) {
    return `/?page=team-collaboration`;
  }
  
  if (type === 'announcement') {
    return `/?page=announcements`;
  }
  
  if (type.includes('role') || type.includes('designation') || type.includes('department') || type.includes('team_membership')) {
    return `/?page=employee-profile`;
  }
  
  // Default fallback to dashboard
  console.warn('[getNavigationPath] Unknown notification type, defaulting to dashboard:', type);
  return `/`;
};

/**
 * Individual notification item
 */
const NotificationItem = ({ notification, onMarkAsRead, onDelete, onClose, isNavigatingRef }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [hovering, setHovering] = useState(false);

  const handleMarkAsRead = (e) => {
    e.stopPropagation();
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(notification.id);
  };

  const handleNotificationClick = () => {
    // Prevent multiple navigations using ref
    if (isNavigatingRef.current) {
      console.log('[NotificationItem] Navigation already in progress, ignoring click');
      return;
    }
    
    isNavigatingRef.current = true;

    // Get the target path
    const targetPath = getNavigationPath(notification);
    
    // Get current page from URL
    const currentPage = searchParams.get('page') || 'dashboard';
    const targetPage = new URLSearchParams(targetPath.split('?')[1]).get('page') || 'dashboard';
    
    console.log('[NotificationItem] Click detected', {
      type: notification.type,
      targetPath,
      currentPage,
      targetPage,
    });

    // Mark as read if not already
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }

    // Close panel immediately
    if (onClose) {
      onClose();
    }
    
    // Only navigate if not already on the target page
    if (currentPage !== targetPage) {
      setTimeout(() => {
        console.log('[NotificationItem] Navigating to:', targetPath);
        navigate(targetPath);
        isNavigatingRef.current = false;
      }, 100);
    } else {
      console.log('[NotificationItem] Already on target page, skipping navigation');
      isNavigatingRef.current = false;
    }
  };

  return (
    <div
      onClick={handleNotificationClick}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      className={`group p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
        notification.read
          ? 'bg-slate-50 border-slate-200 hover:bg-slate-100'
          : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
      } ${
        notification.priority === 'urgent'
          ? 'border-red-300 bg-red-50 hover:bg-red-100'
          : notification.priority === 'high'
          ? 'border-orange-300 bg-orange-50 hover:bg-orange-100'
          : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Notification Icon */}
        <div className="text-2xl flex-shrink-0 mt-1">{notification.icon}</div>

        {/* Notification Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-slate-900 truncate">
                {notification.title}
              </h4>
              <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                {notification.message}
              </p>
            </div>

            {/* Status Indicator */}
            {!notification.read && (
              <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-600 mt-1" />
            )}
          </div>

          {/* Metadata */}
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-slate-500">{notification.timeAgo}</span>
            
            {/* Priority Badge */}
            {notification.priority && notification.priority !== 'medium' && (
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium ${
                  notification.priority === 'urgent'
                    ? 'bg-red-200 text-red-800'
                    : notification.priority === 'high'
                    ? 'bg-orange-200 text-orange-800'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                {notification.priority.charAt(0).toUpperCase() +
                  notification.priority.slice(1)}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        {hovering && (
          <div className="flex items-center gap-1 flex-shrink-0">
            {!notification.read && (
              <button
                onClick={handleMarkAsRead}
                className="p-1 hover:bg-blue-200 rounded transition-colors"
                title="Mark as read"
              >
                <FiCheck size={16} className="text-blue-600" />
              </button>
            )}
            <button
              onClick={handleDelete}
              className="p-1 hover:bg-red-200 rounded transition-colors"
              title="Delete notification"
            >
              <FiTrash2 size={16} className="text-red-600" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Notification type filter
 */
const NotificationTypeFilter = ({ filters, onFilterChange, summary }) => {
  const filterOptions = [
    { key: 'approvals', label: 'Approvals', count: summary?.byType?.approvals || 0 },
    { key: 'leaves', label: 'Leaves', count: summary?.byType?.leaves || 0 },
    { key: 'attendance', label: 'Attendance', count: summary?.byType?.attendance || 0 },
    { key: 'payroll', label: 'Payroll', count: summary?.byType?.payroll || 0 },
    { key: 'announcements', label: 'Announcements', count: summary?.byType?.announcements || 0 },
    { key: 'system', label: 'System', count: summary?.byType?.system || 0 },
  ];

  return (
    <div className="flex items-center gap-2 flex-wrap mb-4">
      <FiFilter size={16} className="text-slate-600" />
      {filterOptions.map((option) => (
        <button
          key={option.key}
          onClick={() => onFilterChange(option.key)}
          className={`px-3 py-1 text-xs rounded-full font-medium transition-all ${
            filters[option.key]
              ? 'bg-blue-600 text-white'
              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
          }`}
        >
          {option.label}
          {option.count > 0 && (
            <span className="ml-1">({option.count})</span>
          )}
        </button>
      ))}
    </div>
  );
};

/**
 * NotificationsPanel Component
 * Main component for displaying all notifications
 */
const NotificationsPanel = ({ isOpen, onClose }) => {
  const {
    notifications,
    unreadCount,
    summary,
    loading,
    markAsRead,
    removeNotification,
    clearAllNotifications,
    markAllAsRead,
    fetchNotifications,
  } = useNotifications();

  const [filterType, setFilterType] = useState(null);
  const [sortBy, setSortBy] = useState('latest');
  
  // Use ref to track navigation state across re-renders
  const isNavigatingRef = useRef(false);

  // ============================================================================
  // FILTER & SORT
  // ============================================================================

  const filters = useMemo(
    () => ({
      approvals: filterType === 'approvals',
      leaves: filterType === 'leaves',
      attendance: filterType === 'attendance',
      payroll: filterType === 'payroll',
      announcements: filterType === 'announcements',
      system: filterType === 'system',
    }),
    [filterType]
  );

  const filteredNotifications = useMemo(() => {
    let filtered = [...notifications];

    if (filterType) {
      filtered = filtered.filter((notif) => {
        switch (filterType) {
          case 'approvals':
            return notif.type === 'leave_approval';
          case 'leaves':
            return notif.type.includes('leave');
          case 'attendance':
            return notif.type.includes('attendance');
          case 'payroll':
            return notif.type.includes('payroll');
          case 'announcements':
            return notif.type === 'announcement';
          case 'system':
            return notif.type === 'system_alert';
          default:
            return true;
        }
      });
    }

    // Sort
    if (sortBy === 'latest') {
      filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    } else if (sortBy === 'unread') {
      filtered.sort((a, b) => {
        if (a.read === b.read) {
          return new Date(b.timestamp) - new Date(a.timestamp);
        }
        return a.read ? 1 : -1;
      });
    }

    return filtered;
  }, [notifications, filterType, sortBy]);

  const handleFilterChange = useCallback((key) => {
    setFilterType(filterType === key ? null : key);
  }, [filterType]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 border-b border-blue-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Notifications</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-blue-500 rounded transition-colors"
            >
              <FiX size={24} />
            </button>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-blue-200">Total</p>
              <p className="text-2xl font-bold">{summary?.total || 0}</p>
            </div>
            <div>
              <p className="text-blue-200">Unread</p>
              <p className="text-2xl font-bold text-yellow-300">{unreadCount}</p>
            </div>
            <div>
              <p className="text-blue-200">Pending Approvals</p>
              <p className="text-2xl font-bold text-orange-300">
                {summary?.byType?.approvals || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchNotifications()}
              disabled={loading}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh notifications"
            >
              <FiRefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            
            {unreadCount > 0 && (
              <>
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors font-medium"
                >
                  <FiCheck size={16} />
                  Mark all as read
                </button>
              </>
            )}
          </div>

          <button
            onClick={clearAllNotifications}
            disabled={notifications.length === 0}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors font-medium disabled:opacity-50"
          >
            <FiTrash2 size={16} />
            Clear all
          </button>
        </div>

        {/* Filters */}
        <div className="px-6 py-3 border-b border-slate-200">
          <NotificationTypeFilter
            filters={filters}
            onFilterChange={handleFilterChange}
            summary={summary}
          />

          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-700 font-medium">Sort:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="latest">Latest First</option>
              <option value="oldest">Oldest First</option>
              <option value="unread">Unread First</option>
            </select>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {loading && filteredNotifications.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-500">
              <p>Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 p-6">
              <p className="text-lg font-medium mb-2">No notifications</p>
              <p className="text-sm">
                {filterType ? 'No notifications found for this filter' : 'You\'re all caught up!'}
              </p>
            </div>
          ) : (
            <div className="space-y-3 p-6">
              {filteredNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                  onDelete={removeNotification}
                  onClose={onClose}
                  isNavigatingRef={isNavigatingRef}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-3 bg-slate-50 text-center text-xs text-slate-600">
          Showing {filteredNotifications.length} of {notifications.length} notifications
        </div>
      </div>
    </div>
  );
};

export default NotificationsPanel;
export { NotificationBadge, NotificationItem };
