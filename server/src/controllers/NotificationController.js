import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { appLogger } from "../utils/logger.js";

/**
 * NotificationController - Handles all notification operations
 * Provides CRUD operations and role-based filtering for notifications
 */

// ============================================================================
// FETCH NOTIFICATIONS
// ============================================================================

/**
 * Get all notifications for current user with pagination
 * GET /api/notifications
 */
export const getNotifications = async (req, res) => {
  try {
    const { limit = 10, skip = 0, type, read, category } = req.query;
    const userId = req.user.id || req.user._id;  // Use id or _id whichever is available

    appLogger.logRequest(req, 'getNotifications called', {
      queryParams: { limit, skip, type, read, category },
    });

    // Build filter
    let filter = {
      userId,
      deleted: false,
    };

    if (type) filter.type = type;
    if (read !== undefined) filter.read = read === "true";
    if (category) filter.category = category;

    appLogger.debug('Notification filter built', {
      userId: req.user.id,
      userName: `${req.user.firstName} ${req.user.lastName}`,
      userRole: req.user.role,
      filter: JSON.stringify(filter),
    });

    const total = await Notification.countDocuments(filter);
    
    appLogger.logDatabaseOperation('READ', 'Notification', req.user, {
      operation: 'countDocuments',
      totalFound: total,
      filter: JSON.stringify(filter),
    });

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .populate("triggeredBy", "firstName lastName email")
      .lean();

    appLogger.debug('Notifications fetched from database', {
      userId: req.user.id,
      userName: `${req.user.firstName} ${req.user.lastName}`,
      userRole: req.user.role,
      notificationsCount: notifications.length,
      limit,
      skip,
    });

    const unreadCount = await Notification.countDocuments({
      ...filter,
      read: false,
    });

    appLogger.logResponse(req, 200, 'Notifications retrieved successfully', {
      total,
      returned: notifications.length,
      unread: unreadCount,
    });

    res.status(200).json({
      success: true,
      notifications,
      total,
      unread: unreadCount,
      hasMore: skip + parseInt(limit) < total,
    });
  } catch (error) {
    appLogger.error(
      'Error in getNotifications',
      error,
      {
        userId: req.user?.id,
        userName: req.user ? `${req.user.firstName} ${req.user.lastName}` : 'unknown',
        userRole: req.user?.role,
        queryParams: req.query,
      }
    );
    res.status(500).json({
      success: false,
      message: "Error fetching notifications",
      error: error.message,
    });
  }
};

/**
 * Get all unread notifications for current user
 * GET /api/notifications/unread
 */
export const getUnreadNotifications = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const limit = req.query.limit || 10;

    appLogger.logRequest(req, 'getUnreadNotifications called', {
      limit,
    });

    const notifications = await Notification.find({
      userId,
      read: false,
      deleted: false,
    })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate("triggeredBy", "firstName lastName email")
      .lean();

    appLogger.logDatabaseOperation('READ', 'Notification', req.user, {
      operation: 'getUnreadNotifications',
      notificationsFound: notifications.length,
    });

    const unreadCount = await Notification.countDocuments({
      userId,
      read: false,
      deleted: false,
    });

    appLogger.logResponse(req, 200, 'Unread notifications retrieved', {
      unreadCount,
      returned: notifications.length,
    });

    res.status(200).json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    appLogger.error(
      'Error in getUnreadNotifications',
      error,
      {
        userId: req.user?.id,
        userName: req.user ? `${req.user.firstName} ${req.user.lastName}` : 'unknown',
        userRole: req.user?.role,
      }
    );
    res.status(500).json({
      success: false,
      message: "Error fetching unread notifications",
      error: error.message,
    });
  }
};

/**
 * Get unread count only
 * GET /api/notifications/unread-count
 */
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    appLogger.logRequest(req, 'getUnreadCount called');

    const unreadCount = await Notification.countDocuments({
      userId,
      read: false,
      deleted: false,
    });

    appLogger.debug('Unread count retrieved', {
      userId: req.user.id,
      userName: `${req.user.firstName} ${req.user.lastName}`,
      userRole: req.user.role,
      unreadCount,
    });

    appLogger.logResponse(req, 200, 'Unread count retrieved', { unreadCount });

    res.status(200).json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    appLogger.error(
      'Error in getUnreadCount',
      error,
      {
        userId: req.user?.id,
        userName: req.user ? `${req.user.firstName} ${req.user.lastName}` : 'unknown',
        userRole: req.user?.role,
      }
    );
    res.status(500).json({
      success: false,
      message: "Error fetching unread count",
      error: error.message,
    });
  }
};

/**
 * Get notifications by type
 * GET /api/notifications/by-type/:type
 */
export const getNotificationsByType = async (req, res) => {
  try {
    const { type } = req.params;
    const { limit = 10, skip = 0 } = req.query;
    const userId = req.user.id || req.user._id;

    appLogger.logRequest(req, 'getNotificationsByType called', {
      type,
      limit,
      skip,
    });

    const notifications = await Notification.find({
      userId,
      type,
      deleted: false,
    })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .populate("triggeredBy", "firstName lastName email")
      .lean();

    const total = await Notification.countDocuments({
      userId,
      type,
      deleted: false,
    });

    appLogger.logDatabaseOperation('READ', 'Notification', req.user, {
      operation: 'getNotificationsByType',
      type,
      totalFound: total,
      returned: notifications.length,
    });

    appLogger.logResponse(req, 200, 'Notifications by type retrieved', {
      type,
      total,
      returned: notifications.length,
    });

    res.status(200).json({
      success: true,
      notifications,
      total,
    });
  } catch (error) {
    appLogger.error(
      'Error in getNotificationsByType',
      error,
      {
        userId: req.user?.id,
        userName: req.user ? `${req.user.firstName} ${req.user.lastName}` : 'unknown',
        userRole: req.user?.role,
        type: req.params.type,
      }
    );
    res.status(500).json({
      success: false,
      message: "Error fetching notifications by type",
      error: error.message,
    });
  }
};

/**
 * Get notification summary (counts by type and status)
 * GET /api/notifications/summary
 */
export const getNotificationSummary = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    appLogger.logRequest(req, 'getNotificationSummary called');

    const [total, unread, byType] = await Promise.all([
      Notification.countDocuments({ userId, deleted: false }),
      Notification.countDocuments({ userId, read: false, deleted: false }),
      Notification.aggregate([
        { $match: { userId, deleted: false } },
        { $group: { _id: "$type", count: { $sum: 1 } } },
      ]),
    ]);

    const byCategory = await Notification.aggregate([
      { $match: { userId, deleted: false } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    const byPriority = await Notification.aggregate([
      { $match: { userId, deleted: false } },
      { $group: { _id: "$priority", count: { $sum: 1 } } },
    ]);

    const summary = {
      total,
      unread,
      byType: byType.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byCategory: byCategory.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byPriority: byPriority.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
    };

    appLogger.debug('Notification summary generated', {
      userId: req.user.id,
      userName: `${req.user.firstName} ${req.user.lastName}`,
      userRole: req.user.role,
      summary,
    });

    appLogger.logResponse(req, 200, 'Notification summary retrieved', summary);

    res.status(200).json({
      success: true,
      summary,
    });
  } catch (error) {
    appLogger.error(
      'Error in getNotificationSummary',
      error,
      {
        userId: req.user?.id,
        userName: req.user ? `${req.user.firstName} ${req.user.lastName}` : 'unknown',
        userRole: req.user?.role,
      }
    );
    res.status(500).json({
      success: false,
      message: "Error fetching notification summary",
      error: error.message,
    });
  }
};

/**
 * Get pending approvals for manager
 * GET /api/notifications/pending-approvals
 */
export const getPendingApprovals = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { limit = 10, skip = 0 } = req.query;

    appLogger.logRequest(req, 'getPendingApprovals called', {
      limit,
      skip,
    });

    const approvalTypes = [
      "leave_request",
      "attendance_correction",
      "reimbursement_request",
      "document_request",
    ];

    const notifications = await Notification.find({
      userId,
      type: { $in: approvalTypes },
      read: false,
      deleted: false,
    })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .populate("triggeredBy", "firstName lastName email")
      .lean();

    const total = await Notification.countDocuments({
      userId,
      type: { $in: approvalTypes },
      deleted: false,
    });

    const pendingCount = await Notification.countDocuments({
      userId,
      type: { $in: approvalTypes },
      read: false,
      deleted: false,
    });

    appLogger.logDatabaseOperation('READ', 'Notification', req.user, {
      operation: 'getPendingApprovals',
      totalApprovals: total,
      pendingApprovals: pendingCount,
      returned: notifications.length,
    });

    appLogger.logResponse(req, 200, 'Pending approvals retrieved', {
      total,
      pending: pendingCount,
      returned: notifications.length,
    });

    res.status(200).json({
      success: true,
      notifications,
      total,
      pendingCount,
    });
  } catch (error) {
    appLogger.error(
      'Error in getPendingApprovals',
      error,
      {
        userId: req.user?.id,
        userName: req.user ? `${req.user.firstName} ${req.user.lastName}` : 'unknown',
        userRole: req.user?.role,
      }
    );
    res.status(500).json({
      success: false,
      message: "Error fetching pending approvals",
      error: error.message,
    });
  }
};

// ============================================================================
// MARK NOTIFICATIONS
// ============================================================================

/**
 * Mark single notification as read
 * PATCH /api/notifications/:id/read
 */
export const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;

    appLogger.logRequest(req, 'markNotificationAsRead called', {
      notificationId: id,
    });

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      {
        read: true,
        readAt: new Date(),
      },
      { new: true }
    );

    if (!notification) {
      appLogger.warn(
        'Notification not found for marking as read',
        {
          userId: req.user.id,
          userName: `${req.user.firstName} ${req.user.lastName}`,
          userRole: req.user.role,
          notificationId: id,
        }
      );
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    appLogger.logDatabaseOperation('UPDATE', 'Notification', req.user, {
      operation: 'markAsRead',
      notificationId: id,
    });

    appLogger.logResponse(req, 200, 'Notification marked as read', {
      notificationId: id,
    });

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    appLogger.error(
      'Error in markNotificationAsRead',
      error,
      {
        userId: req.user?.id,
        userName: req.user ? `${req.user.firstName} ${req.user.lastName}` : 'unknown',
        userRole: req.user?.role,
        notificationId: req.params.id,
      }
    );
    res.status(500).json({
      success: false,
      message: "Error marking notification as read",
      error: error.message,
    });
  }
};

/**
 * Mark all notifications as read
 * PATCH /api/notifications/mark-all-read
 */
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    appLogger.logRequest(req, 'markAllNotificationsAsRead called');

    const result = await Notification.updateMany(
      { userId, read: false, deleted: false },
      {
        read: true,
        readAt: new Date(),
      }
    );

    appLogger.logDatabaseOperation('UPDATE', 'Notification', req.user, {
      operation: 'markAllAsRead',
      modifiedCount: result.modifiedCount,
    });

    appLogger.logResponse(req, 200, 'All notifications marked as read', {
      modifiedCount: result.modifiedCount,
    });

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    appLogger.error(
      'Error in markAllNotificationsAsRead',
      error,
      {
        userId: req.user?.id,
        userName: req.user ? `${req.user.firstName} ${req.user.lastName}` : 'unknown',
        userRole: req.user?.role,
      }
    );
    res.status(500).json({
      success: false,
      message: "Error marking notifications as read",
      error: error.message,
    });
  }
};

// ============================================================================
// DELETE NOTIFICATIONS
// ============================================================================

/**
 * Soft delete single notification
 * DELETE /api/notifications/:id
 */
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;

    appLogger.logRequest(req, 'deleteNotification called', {
      notificationId: id,
    });

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      {
        deleted: true,
        deletedAt: new Date(),
      },
      { new: true }
    );

    if (!notification) {
      appLogger.warn(
        'Notification not found for deletion',
        {
          userId: req.user.id,
          userName: `${req.user.firstName} ${req.user.lastName}`,
          userRole: req.user.role,
          notificationId: id,
        }
      );
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    appLogger.logDatabaseOperation('DELETE', 'Notification', req.user, {
      operation: 'deleteNotification',
      notificationId: id,
    });

    appLogger.logResponse(req, 200, 'Notification deleted', {
      notificationId: id,
    });

    res.status(200).json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error) {
    appLogger.error(
      'Error in deleteNotification',
      error,
      {
        userId: req.user?.id,
        userName: req.user ? `${req.user.firstName} ${req.user.lastName}` : 'unknown',
        userRole: req.user?.role,
        notificationId: req.params.id,
      }
    );
    res.status(500).json({
      success: false,
      message: "Error deleting notification",
      error: error.message,
    });
  }
};

/**
 * Delete all notifications
 * DELETE /api/notifications
 */
export const deleteAllNotifications = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    appLogger.logRequest(req, 'deleteAllNotifications called');

    const result = await Notification.updateMany(
      { userId, deleted: false },
      {
        deleted: true,
        deletedAt: new Date(),
      }
    );

    appLogger.logDatabaseOperation('DELETE', 'Notification', req.user, {
      operation: 'deleteAllNotifications',
      modifiedCount: result.modifiedCount,
    });

    appLogger.logResponse(req, 200, 'All notifications deleted', {
      modifiedCount: result.modifiedCount,
    });

    res.status(200).json({
      success: true,
      message: "All notifications deleted",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    appLogger.error(
      'Error in deleteAllNotifications',
      error,
      {
        userId: req.user?.id,
        userName: req.user ? `${req.user.firstName} ${req.user.lastName}` : 'unknown',
        userRole: req.user?.role,
      }
    );
    res.status(500).json({
      success: false,
      message: "Error deleting notifications",
      error: error.message,
    });
  }
};

// ============================================================================
// HELPER FUNCTIONS (For use in other controllers)
// ============================================================================

/**
 * Create notification - Can be used by other controllers
 * @param {Object} notificationData
 * @param {Object} user - User object for logging
 * @returns {Promise<Object>} Created notification
 */
export const createNotification = async (notificationData, user = null) => {
  try {
    appLogger.info('Creating notification', {
      userId: user?.id || user?._id || 'system',
      userName: user ? `${user.firstName} ${user.lastName}` : 'system',
      userRole: user?.role || 'system',
      notificationType: notificationData.type,
      targetUserId: notificationData.userId,
    });

    const notification = new Notification({
      userId: notificationData.userId,
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      priority: notificationData.priority || "medium",
      category: notificationData.category || "update",
      referenceType: notificationData.referenceType,
      referenceId: notificationData.referenceId,
      actionUrl: notificationData.actionUrl,
      metadata: notificationData.metadata || {},
      triggeredBy: notificationData.triggeredBy,
      batchId: notificationData.batchId,
      expiresAt: notificationData.expiresAt,
    });

    await notification.save();

    appLogger.logDatabaseOperation('CREATE', 'Notification', user || {}, {
      operation: 'createNotification',
      notificationId: notification._id,
      type: notificationData.type,
    });

    return notification;
  } catch (error) {
    appLogger.error(
      "Error creating notification",
      error,
      {
        userId: user?.id || user?._id || 'system',
        userName: user ? `${user.firstName} ${user.lastName}` : 'system',
        userRole: user?.role || 'system',
        notificationType: notificationData.type,
      }
    );
    throw error;
  }
};

/**
 * Create bulk notifications
 * @param {Array} notificationsData - Array of notification objects
 * @param {Object} user - User object for logging
 * @returns {Promise<Array>} Created notifications
 */
export const createBulkNotifications = async (notificationsData, user = null) => {
  try {
    appLogger.info('Creating bulk notifications', {
      userId: user?.id || user?._id || 'system',
      userName: user ? `${user.firstName} ${user.lastName}` : 'system',
      userRole: user?.role || 'system',
      count: notificationsData.length,
    });

    const notifications = await Notification.insertMany(notificationsData);

    appLogger.logDatabaseOperation('CREATE', 'Notification', user || {}, {
      operation: 'createBulkNotifications',
      count: notifications.length,
    });

    return notifications;
  } catch (error) {
    appLogger.error(
      "Error creating bulk notifications",
      error,
      {
        userId: user?.id || user?._id || 'system',
        userName: user ? `${user.firstName} ${user.lastName}` : 'system',
        userRole: user?.role || 'system',
        count: notificationsData.length,
      }
    );
    throw error;
  }
};

/**
 * Create notification for specific roles
 * @param {Array} roles - Array of role IDs or names
 * @param {Object} notificationData - Notification content
 * @param {Object} user - User object for logging
 * @returns {Promise<Array>} Created notifications
 */
export const createNotificationForRoles = async (roles, notificationData, user = null) => {
  try {
    appLogger.info('Creating notifications for roles', {
      userId: user?.id || user?._id || 'system',
      userName: user ? `${user.firstName} ${user.lastName}` : 'system',
      userRole: user?.role || 'system',
      roles,
      messageType: notificationData.type,
    });

    const users = await User.find({ role: { $in: roles } }).select("_id");
    const userIds = users.map((u) => u._id);

    appLogger.debug('Found users for roles', {
      userId: user?.id || user?._id || 'system',
      roles,
      userCount: userIds.length,
    });

    const notificationsData = userIds.map((userId) => ({
      ...notificationData,
      userId,
    }));

    return await createBulkNotifications(notificationsData, user);
  } catch (error) {
    appLogger.error(
      "Error creating notifications for roles",
      error,
      {
        userId: user?.id || user?._id || 'system',
        userName: user ? `${user.firstName} ${user.lastName}` : 'system',
        userRole: user?.role || 'system',
        roles,
      }
    );
    throw error;
  }
};

/**
 * Notify specific users
 * @param {Array} userIds - Array of user IDs
 * @param {Object} notificationData - Notification content
 * @param {Object} user - User object for logging
 * @returns {Promise<Array>} Created notifications
 */
export const notifyUsers = async (userIds, notificationData, user = null) => {
  try {
    appLogger.info('Notifying users', {
      userId: user?.id || user?._id || 'system',
      userName: user ? `${user.firstName} ${user.lastName}` : 'system',
      userRole: user?.role || 'system',
      targetUserCount: userIds.length,
      messageType: notificationData.type,
    });

    const notificationsData = userIds.map((userId) => ({
      ...notificationData,
      userId,
    }));

    return await createBulkNotifications(notificationsData, user);
  } catch (error) {
    appLogger.error(
      "Error notifying users",
      error,
      {
        userId: user?.id || user?._id || 'system',
        userName: user ? `${user.firstName} ${user.lastName}` : 'system',
        userRole: user?.role || 'system',
        userCount: userIds.length,
      }
    );
    throw error;
  }
};
