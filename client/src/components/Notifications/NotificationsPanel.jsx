/**
 * NotificationsPanel Component
 * Displays comprehensive notifications with filtering, sorting, and actions
 */

import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FiBell,
  FiX,
  FiTrash2,
  FiCheck,
  FiRefreshCw,
  FiFilter,
  FiInbox,
} from 'react-icons/fi';
import { useNotifications } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';
import { getPageIdForNotificationType } from '../../utils/notificationNavigation';

const NotificationBadge = ({ count, highlight = false }) => {
  if (count === 0) return null;

  return (
    <span
      className={`inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full px-1.5 text-xs font-bold text-white ${
        highlight ? 'animate-pulse-soft bg-red-600' : 'bg-indigo-600'
      }`}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
};

const getNavigationPath = (notification) => {
  const pageId = getPageIdForNotificationType(notification?.type);
  return pageId === 'dashboard' ? '/' : `/?page=${pageId}`;
};

const NotificationItem = ({ notification, onMarkAsRead, onDelete, onClose, isNavigatingRef, colors }) => {
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
    if (isNavigatingRef.current) return;

    isNavigatingRef.current = true;

    const targetPath = getNavigationPath(notification);
    const currentPage = searchParams.get('page') || 'dashboard';
    const targetPage = new URLSearchParams(targetPath.split('?')[1]).get('page') || 'dashboard';

    if (!notification.read) {
      onMarkAsRead(notification.id);
    }

    if (onClose) onClose();

    if (currentPage !== targetPage) {
      setTimeout(() => {
        navigate(targetPath);
        isNavigatingRef.current = false;
      }, 100);
    } else {
      isNavigatingRef.current = false;
    }
  };

  const itemClass = notification.read
    ? 'border-im5-border-soft bg-slate-50/90 hover:border-im5-border hover:bg-white'
    : 'border-indigo-200 bg-indigo-50/60 hover:border-indigo-300 hover:bg-indigo-50';

  const priorityClass =
    notification.priority === 'urgent'
      ? 'border-red-200 bg-red-50/80 hover:bg-red-50'
      : notification.priority === 'high'
        ? 'border-amber-200 bg-amber-50/80 hover:bg-amber-50'
        : '';

  return (
    <div
      onClick={handleNotificationClick}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      className={`group cursor-pointer rounded-xl border p-4 transition-all duration-200 ${priorityClass || itemClass}`}
    >
      <div className="flex items-start gap-3">
        <div className="icon-box mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center bg-gradient-to-br from-indigo-500 to-blue-600 p-0 text-lg text-white">
          {notification.icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h4 className={`truncate text-sm font-semibold ${colors.text.primary}`}>{notification.title}</h4>
              <p className={`mt-1 line-clamp-2 text-xs ${colors.text.secondary}`}>{notification.message}</p>
            </div>
            {!notification.read && (
              <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-600" aria-hidden />
            )}
          </div>

          <div className="mt-2 flex items-center justify-between gap-2">
            <span className={`text-xs ${colors.text.tertiary}`}>{notification.timeAgo}</span>
            {notification.priority && notification.priority !== 'medium' && (
              <span
                className={`badge shrink-0 ${
                  notification.priority === 'urgent'
                    ? 'badge-danger'
                    : notification.priority === 'high'
                      ? 'badge-warning'
                      : 'badge-info'
                }`}
              >
                {notification.priority.charAt(0).toUpperCase() + notification.priority.slice(1)}
              </span>
            )}
          </div>
        </div>

        {hovering && (
          <div className="flex shrink-0 items-center gap-1">
            {!notification.read && (
              <button
                type="button"
                onClick={handleMarkAsRead}
                className="rounded-lg p-1.5 text-indigo-600 transition-colors hover:bg-indigo-100"
                title="Mark as read"
              >
                <FiCheck size={16} />
              </button>
            )}
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-lg p-1.5 text-red-600 transition-colors hover:bg-red-100"
              title="Delete notification"
            >
              <FiTrash2 size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const NotificationTypeFilter = ({ filterType, onFilterChange, summary, colors }) => {
  const filterOptions = [
    { key: 'approvals', label: 'Approvals', count: summary?.byType?.approvals || 0 },
    { key: 'leaves', label: 'Leaves', count: summary?.byType?.leaves || 0 },
    { key: 'attendance', label: 'Attendance', count: summary?.byType?.attendance || 0 },
    { key: 'payroll', label: 'Payroll', count: summary?.byType?.payroll || 0 },
    { key: 'announcements', label: 'Announcements', count: summary?.byType?.announcements || 0 },
    { key: 'system', label: 'System', count: summary?.byType?.system || 0 },
  ];

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <FiFilter size={16} className={`shrink-0 ${colors.text.tertiary}`} aria-hidden />
      {filterOptions.map((option) => {
        const active = filterType === option.key;
        return (
          <button
            key={option.key}
            type="button"
            onClick={() => onFilterChange(option.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
              active
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'border border-im5-border-soft bg-white text-slate-700 hover:border-im5-border hover:bg-slate-50'
            }`}
          >
            {option.label}
            {option.count > 0 && <span className="ml-1 opacity-80">({option.count})</span>}
          </button>
        );
      })}
    </div>
  );
};

const NotificationsPanel = ({ isOpen, onClose }) => {
  const { colors } = useTheme();
  const {
    notifications,
    unreadCount,
    summary,
    loading,
    error,
    markAsRead,
    removeNotification,
    clearAllNotifications,
    markAllAsRead,
    fetchNotifications,
  } = useNotifications();

  const [filterType, setFilterType] = useState(null);
  const [sortBy, setSortBy] = useState('latest');
  const isNavigatingRef = useRef(false);

  const filteredNotifications = useMemo(() => {
    let filtered = [...notifications];

    if (filterType) {
      filtered = filtered.filter((notif) => {
        switch (filterType) {
          case 'approvals':
            return (
              notif.type === 'leave_approval' ||
              notif.category === 'approval' ||
              String(notif.type || '').startsWith('tool_provisioning')
            );
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

    if (sortBy === 'latest') {
      filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    } else if (sortBy === 'unread') {
      filtered.sort((a, b) => {
        if (a.read === b.read) return new Date(b.timestamp) - new Date(a.timestamp);
        return a.read ? 1 : -1;
      });
    }

    return filtered;
  }, [notifications, filterType, sortBy]);

  const handleFilterChange = useCallback((key) => {
    setFilterType((prev) => (prev === key ? null : key));
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const summaryStats = [
    { label: 'Total', value: summary?.total || 0, badgeClass: 'badge-info' },
    { label: 'Unread', value: unreadCount, badgeClass: 'badge-warning' },
    {
      label: 'Pending approvals',
      value: summary?.byType?.approvals || 0,
      badgeClass: 'badge-danger',
    },
  ];

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notifications-panel-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[min(85vh,calc(100vh-2rem))] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-im5-border-soft bg-white shadow-2xl animate-fadeInUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="glass shrink-0 rounded-none border-0 border-b border-im5-border-soft px-6 py-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2
              id="notifications-panel-title"
              className={`flex items-center gap-2 text-xl font-bold ${colors.text.primary}`}
            >
              <FiBell className="text-indigo-600" size={22} aria-hidden />
              Notifications
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-im5-border-soft p-2 text-slate-600 transition-colors hover:border-im5-border hover:bg-slate-50"
              aria-label="Close notifications"
            >
              <FiX size={20} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {summaryStats.map((stat) => (
              <div key={stat.label} className="stat-card !p-4">
                <p className={`mb-1 text-xs font-medium ${colors.text.tertiary}`}>{stat.label}</p>
                <p className={`text-2xl font-bold tabular-nums ${colors.text.primary}`}>{stat.value}</p>
                {stat.label === 'Unread' && stat.value > 0 && (
                  <span className={`badge mt-2 ${stat.badgeClass}`}>Needs attention</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-im5-border-soft px-6 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fetchNotifications({ forceFull: true })}
              disabled={loading}
              className="btn-secondary !px-3 !py-2"
              title="Refresh notifications"
            >
              <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            {unreadCount > 0 && (
              <button type="button" onClick={markAllAsRead} className="btn-primary !px-3 !py-2 text-sm">
                <FiCheck size={16} />
                Mark all read
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={clearAllNotifications}
            disabled={notifications.length === 0}
            className="btn-danger !px-3 !py-2 text-sm disabled:opacity-50"
          >
            <FiTrash2 size={16} />
            Clear all
          </button>
        </div>

        {/* Filters */}
        <div className="border-b border-im5-border-soft px-6 py-3">
          <NotificationTypeFilter
            filterType={filterType}
            onFilterChange={handleFilterChange}
            summary={summary}
            colors={colors}
          />
          <div className="flex items-center gap-2">
            <label className={`text-sm font-medium ${colors.text.secondary}`}>Sort</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-modern !py-2 text-sm"
            >
              <option value="latest">Latest first</option>
              <option value="oldest">Oldest first</option>
              <option value="unread">Unread first</option>
            </select>
          </div>
        </div>

        {/* List */}
        <div className="min-h-[200px] flex-1 overflow-y-auto bg-im5-page/30">
          {loading && filteredNotifications.length === 0 ? (
            <div className={`flex h-48 flex-col items-center justify-center gap-3 ${colors.text.tertiary}`}>
              <span className="spinner" aria-hidden />
              <p className="text-sm">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center p-6 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <FiInbox size={28} aria-hidden />
              </div>
              <p className={`mb-1 text-lg font-semibold ${colors.text.primary}`}>No notifications</p>
              <p className={`text-sm ${colors.text.tertiary}`}>
                {filterType ? 'No notifications match this filter.' : "You're all caught up!"}
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
                  colors={colors}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`shrink-0 border-t border-im5-border-soft bg-im5-panel px-6 py-3 text-center text-xs ${colors.text.tertiary}`}
        >
          Showing {filteredNotifications.length} of {notifications.length} notifications
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default NotificationsPanel;
export { NotificationBadge, NotificationItem };
