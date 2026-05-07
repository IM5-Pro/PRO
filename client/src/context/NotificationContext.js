/**
 * NotificationContext
 * Global state management for notifications with role-based filtering
 * Provides notification data and actions to all components
 * 
 * supports role-based filtering:
 * - EMPLOYEE: Personal leave status, attendance, payroll
 * - MANAGER: Team leave approvals, team updates
 * - HR_ADMIN: All pending approvals, system alerts
 * - SUPER_ADMIN: Complete notification access
 * 
 * @module NotificationContext
 * @author HR Team
 * @version 1.0.0
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import {
  fetchNotificationsByRole,
  fetchUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,
  getTimeAgo,
} from '../services/notificationApi';
import { getCookie } from '../utils/cookies';

/**
 * Create NotificationContext
 */
const NotificationContext = createContext();

/**
 * NotificationProvider Component
 * Manages notification state and provides actions to child components
 * Automatically detects user role for role-based notifications
 * 
 * @component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @param {string} [props.userRole] - Optional user role (defaults to 'employee')
 * @returns {React.ReactNode} Provider wrapper with notification context
 */
export const NotificationProvider = ({ children, userRole = 'employee' }) => {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [summary, setSummary] = useState({
    total: 0,
    unread: 0,
    byType: {
      approvals: 0,
      leaves: 0,
      attendance: 0,
      payroll: 0,
      announcements: 0,
      system: 0,
    },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedNotifications, setSelectedNotifications] = useState(new Set());
  const [currentUserRole, setCurrentUserRole] = useState(userRole);
  
  // Refs for polling and timer management
  const pollIntervalRef = useRef(null);
  const isMountedRef = useRef(true);
  const isFetchingRef = useRef(false);

  // ============================================================================
  // FETCH NOTIFICATIONS
  // ============================================================================

  /**
   * Fetch all notifications based on user role
   * Different roles get different notification types:
   * - EMPLOYEE: Personal leave, attendance, payroll
   * - MANAGER: Team leave approvals pending
   * - HR_ADMIN: All approvals, system alerts, payroll
   * - SUPER_ADMIN: All notifications
   * 
   * @param {boolean} silent - If true, don't update loading state
   */
  const fetchNotificationsData = useCallback(async (silent = false) => {
    if (!isMountedRef.current) return;
    if (isFetchingRef.current) return;

    if (!silent) {
      setLoading(true);
      setError(null);
    }

    try {
      isFetchingRef.current = true;
      // Use fetchNotificationsByRole to get role-specific notifications
      const data = await fetchNotificationsByRole(currentUserRole);
      
      if (isMountedRef.current) {
        const enrichedNotifications = data.notifications.map((notif) => ({
          ...notif,
          timeAgo: getTimeAgo(notif.timestamp),
        }));

        setNotifications(enrichedNotifications);
        setSummary(data.summary);
        setUnreadCount(data.summary?.unread || 0);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message || 'Failed to fetch notifications');
        console.error('Notification fetch error:', err);
      }
    } finally {
      isFetchingRef.current = false;
      if (isMountedRef.current && !silent) {
        setLoading(false);
      }
    }
  }, [currentUserRole]);

  /**
   * Fetch only unread count (lightweight)
   */
  const fetchUnreadCountData = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      const count = await fetchUnreadCount();
      if (isMountedRef.current) {
        setUnreadCount(count);
      }
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  }, []);

  // ============================================================================
  // NOTIFICATION ACTIONS
  // ============================================================================

  /**
   * Mark single notification as read
   * @param {string} notificationId - ID of notification
   */
  const markAsRead = useCallback(
    async (notificationId) => {
      if (!isMountedRef.current) return;

      try {
        const success = await markNotificationAsRead(notificationId);
        
        if (success && isMountedRef.current) {
          setNotifications((prev) =>
            prev.map((notif) =>
              notif.id === notificationId ? { ...notif, read: true } : notif
            )
          );
          
          setUnreadCount((prev) => Math.max(0, prev - 1));
          setSummary((prev) => ({
            ...prev,
            unread: Math.max(0, prev.unread - 1),
          }));
        }
      } catch (err) {
        console.error('Error marking notification as read:', err);
      }
    },
    []
  );

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      const success = await markAllNotificationsAsRead();
      
      if (success && isMountedRef.current) {
        setNotifications((prev) =>
          prev.map((notif) => ({ ...notif, read: true }))
        );
        
        setUnreadCount(0);
        setSummary((prev) => ({
          ...prev,
          unread: 0,
        }));
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  }, []);

  /**
   * Delete a single notification
   * @param {string} notificationId - ID of notification to delete
   */
  const removeNotification = useCallback(async (notificationId) => {
    if (!isMountedRef.current) return;

    try {
      const success = await deleteNotification(notificationId);
      
      if (success && isMountedRef.current) {
        const wasUnread = notifications.find((n) => n.id === notificationId)?.read === false;
        
        setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId));
        
        if (wasUnread) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
          setSummary((prev) => ({
            ...prev,
            unread: Math.max(0, prev.unread - 1),
          }));
        }
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  }, [notifications]);

  /**
   * Delete all notifications
   */
  const clearAllNotifications = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      const success = await deleteAllNotifications();
      
      if (success && isMountedRef.current) {
        setNotifications([]);
        setUnreadCount(0);
        setSummary({
          total: 0,
          unread: 0,
          byType: {
            approvals: 0,
            leaves: 0,
            attendance: 0,
            payroll: 0,
            announcements: 0,
            system: 0,
          },
        });
      }
    } catch (err) {
      console.error('Error clearing all notifications:', err);
    }
  }, []);

  /**
   * Toggle notification selection
   * @param {string} notificationId - ID of notification
   */
  const toggleNotificationSelection = useCallback((notificationId) => {
    setSelectedNotifications((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(notificationId)) {
        newSet.delete(notificationId);
      } else {
        newSet.add(notificationId);
      }
      return newSet;
    });
  }, []);

  /**
   * Clear selection
   */
  const clearSelection = useCallback(() => {
    setSelectedNotifications(new Set());
  }, []);

  /**
   * Delete selected notifications
   */
  const deleteSelectedNotifications = useCallback(async () => {
    const notifIds = Array.from(selectedNotifications);
    
    for (const id of notifIds) {
      await removeNotification(id);
    }
    
    clearSelection();
  }, [selectedNotifications, removeNotification, clearSelection]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * Initial load on component mount
   * Set up polling interval for notification updates
   * Only fetch if user is authenticated
   */
  useEffect(() => {
    isMountedRef.current = true;

    // Check if user is authenticated by checking for auth token in cookies
    // The API client looks for 'authToken' cookie
    const token = getCookie('authToken');
    
    if (token) {
      // Initial fetch only if authenticated
      fetchNotificationsData();

      // Set up lightweight polling for unread-count updates.
      pollIntervalRef.current = setInterval(() => {
        fetchUnreadCountData();
      }, 60000);
    } else {
      // User not authenticated, clear notifications
      setNotifications([]);
      setUnreadCount(0);
      setSummary({
        total: 0,
        unread: 0,
        byType: {
          approvals: 0,
          leaves: 0,
          attendance: 0,
          payroll: 0,
          announcements: 0,
          system: 0,
        },
      });
    }

    // Clean up on unmount
    return () => {
      isMountedRef.current = false;
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [fetchNotificationsData, fetchUnreadCountData]);

  /**
   * Update notifications when user role changes
   * Ensures notifications are filtered based on user's role
   */
  useEffect(() => {
    if (userRole && userRole !== currentUserRole) {
      setCurrentUserRole(userRole);
    }
  }, [userRole, currentUserRole]);

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const value = {
    // State
    notifications,
    unreadCount,
    summary,
    loading,
    error,
    selectedNotifications,

    // Actions
    fetchNotifications: fetchNotificationsData,
    fetchUnreadCount: fetchUnreadCountData,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    toggleNotificationSelection,
    clearSelection,
    deleteSelectedNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

/**
 * Hook to use NotificationContext
 * Must be used within NotificationProvider
 * 
 * @returns {Object} Notification context value
 * @throws {Error} If used outside NotificationProvider
 */
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  
  if (!context) {
    throw new Error(
      'useNotifications must be used within a NotificationProvider'
    );
  }
  
  return context;
};

export default NotificationContext;
export { NotificationContext };
