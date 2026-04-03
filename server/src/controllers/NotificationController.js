import Notification from "../models/Notification.js";
import User from "../models/User.js";

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

    console.log('[NotificationController] getNotifications called');
    console.log('  userId:', userId);
    console.log('  limit:', limit, 'skip:', skip);

    // Build filter
    let filter = {
      userId,
      deleted: false,
    };

    if (type) filter.type = type;
    if (read !== undefined) filter.read = read === "true";
    if (category) filter.category = category;

    console.log('  Filter:', JSON.stringify(filter));

    const total = await Notification.countDocuments(filter);
    console.log('  Total notifications matching filter:', total);

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .populate("triggeredBy", "firstName lastName email")
      .lean();

    console.log('  Notifications returned:', notifications.length);
    console.log('  Notifications data:', notifications.map(n => ({ 
      id: n._id, 
      userId: n.userId,
      type: n.type, 
      title: n.title,
      read: n.read,
      deleted: n.deleted
    })));

    const unreadCount = await Notification.countDocuments({
      ...filter,
      read: false,
    });

    res.status(200).json({
      success: true,
      notifications,
      total,
      unread: unreadCount,
      hasMore: skip + parseInt(limit) < total,
    });
  } catch (error) {
    console.error('[NotificationController] Error in getNotifications:', error);
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

    const notifications = await Notification.find({
      userId,
      read: false,
      deleted: false,
    })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate("triggeredBy", "firstName lastName email")
      .lean();

    const unreadCount = await Notification.countDocuments({
      userId,
      read: false,
      deleted: false,
    });

    res.status(200).json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
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

    const unreadCount = await Notification.countDocuments({
      userId,
      read: false,
      deleted: false,
    });

    res.status(200).json({
      success: true,
      unreadCount,
    });
  } catch (error) {
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

    res.status(200).json({
      success: true,
      notifications,
      total,
    });
  } catch (error) {
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

    res.status(200).json({
      success: true,
      summary: {
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
      },
    });
  } catch (error) {
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

    res.status(200).json({
      success: true,
      notifications,
      total,
      pendingCount: await Notification.countDocuments({
        userId,
        type: { $in: approvalTypes },
        read: false,
        deleted: false,
      }),
    });
  } catch (error) {
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

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      {
        read: true,
        readAt: new Date(),
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
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

    const result = await Notification.updateMany(
      { userId, read: false, deleted: false },
      {
        read: true,
        readAt: new Date(),
      }
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
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

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      {
        deleted: true,
        deletedAt: new Date(),
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error) {
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

    const result = await Notification.updateMany(
      { userId, deleted: false },
      {
        deleted: true,
        deletedAt: new Date(),
      }
    );

    res.status(200).json({
      success: true,
      message: "All notifications deleted",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
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
 * @returns {Promise<Object>} Created notification
 */
export const createNotification = async (notificationData) => {
  try {
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
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

/**
 * Create bulk notifications
 * @param {Array} notificationsData - Array of notification objects
 * @returns {Promise<Array>} Created notifications
 */
export const createBulkNotifications = async (notificationsData) => {
  try {
    const notifications = await Notification.insertMany(notificationsData);
    return notifications;
  } catch (error) {
    console.error("Error creating bulk notifications:", error);
    throw error;
  }
};

/**
 * Create notification for specific roles
 * @param {Array} roles - Array of role IDs or names
 * @param {Object} notificationData - Notification content
 * @returns {Promise<Array>} Created notifications
 */
export const createNotificationForRoles = async (roles, notificationData) => {
  try {
    const users = await User.find({ role: { $in: roles } }).select("_id");
    const userIds = users.map((user) => user._id);

    const notificationsData = userIds.map((userId) => ({
      ...notificationData,
      userId,
    }));

    return await createBulkNotifications(notificationsData);
  } catch (error) {
    console.error("Error creating notifications for roles:", error);
    throw error;
  }
};

/**
 * Notify specific users
 * @param {Array} userIds - Array of user IDs
 * @param {Object} notificationData - Notification content
 * @returns {Promise<Array>} Created notifications
 */
export const notifyUsers = async (userIds, notificationData) => {
  try {
    const notificationsData = userIds.map((userId) => ({
      ...notificationData,
      userId,
    }));

    return await createBulkNotifications(notificationsData);
  } catch (error) {
    console.error("Error notifying users:", error);
    throw error;
  }
};
