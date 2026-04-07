import express from "express";
import {
  getNotifications,
  getUnreadNotifications,
  getUnreadCount,
  getNotificationsByType,
  getNotificationSummary,
  getPendingApprovals,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,
} from "../controllers/NotificationController.js";
import authGuard from "../middleware/authGuard.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(authGuard);

// ============================================================================
// GET ROUTES - FETCH NOTIFICATIONS
// ============================================================================

/**
 * Get all notifications
 * GET /api/notifications?limit=10&skip=0&type=leave_request&read=false&category=approval
 */
router.get("/", getNotifications);

/**
 * Get unread notifications
 * GET /api/notifications/unread
 */
router.get("/unread", getUnreadNotifications);

/**
 * Get unread count only (lightweight)
 * GET /api/notifications/unread-count
 */
router.get("/unread-count", getUnreadCount);

/**
 * Get notification summary
 * GET /api/notifications/summary
 */
router.get("/summary", getNotificationSummary);

/**
 * Get pending approvals for manager
 * GET /api/notifications/pending-approvals
 */
router.get("/pending-approvals", getPendingApprovals);

/**
 * Get notifications by type
 * GET /api/notifications/by-type/leave_request
 */
router.get("/by-type/:type", getNotificationsByType);

// ============================================================================
// PATCH ROUTES - UPDATE NOTIFICATIONS
// ============================================================================

/**
 * Mark all notifications as read
 * PATCH /api/notifications/mark-all-read
 */
router.patch("/mark-all-read", markAllNotificationsAsRead);

/**
 * Mark single notification as read
 * PATCH /api/notifications/:id/read
 */
router.patch("/:id/read", markNotificationAsRead);

// ============================================================================
// DELETE ROUTES
// ============================================================================

/**
 * Delete all notifications
 * DELETE /api/notifications
 */
router.delete("/", deleteAllNotifications);

/**
 * Delete single notification
 * DELETE /api/notifications/:id
 */
router.delete("/:id", deleteNotification);

export default router;
