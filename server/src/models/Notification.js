import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    // User receiving the notification
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Notification content
    type: {
      type: String,
      enum: [
        // Leave Management
        "leave_request",
        "leave_approval",
        "leave_rejection",

        // Attendance & Timekeeping
        "attendance_alert",
        "attendance_late_arrival",
        "attendance_absent",
        "attendance_correction",
        "attendance_correction_approval",
        "attendance_correction_rejection",
        "attendance_overtime",
        "attendance_shift_change",

        // Payroll & Compensation
        "payroll_ready",
        "payroll_processed",
        "salary_slip_generated",
        "reimbursement_request",
        "reimbursement_approval",
        "reimbursement_rejection",
        "bonus_notification",
        "incentive_notification",
        "tax_filing_reminder",
        "payment_delay_alert",

        // Performance Management
        "performance_review_request",
        "performance_feedback_request",
        "performance_review_complete",
        "performance_rating",
        "goal_setting",
        "okr_update",

        // Employee Development
        "training_assigned",
        "training_completed",
        "certification_expiry",
        "skill_recommendation",
        "promotion_eligible",

        // HR Operations
        "onboarding_task",
        "offboarding_notification",
        "role_change",
        "designation_change",
        "department_transfer",
        "team_membership_change",

        // Meetings & Calendar
        "meeting_invitation",
        "meeting_reminder",
        "meeting_rescheduled",
        "one_on_one_scheduled",

        // Asset Management
        "asset_assigned",
        "asset_return_request",
        "asset_expiry",
        "asset_maintenance",
        "system_access_grant",
        "system_access_revoke",
        "tool_provisioning_manager_review",
        "tool_provisioning_it_awareness",
        "tool_provisioning_it_install",

        // Documents & Compliance
        "document_request",
        "document_uploaded",
        "document_expiry",
        "document_approval",
        "document_rejection",
        "compliance_alert",

        // Administrative & General
        "announcement",
        "policy_update",
        "system_alert",
        "system_maintenance",
        "holiday_update",
        "birthday_reminder",
        "work_anniversary",
        "probation_end",
        "contract_renewal",

        // Manager Specific
        "manager_assignment",
        "team_performance_summary",
        "pending_approvals",
        "direct_report_milestone",
      ],
      required: true,
      index: true,
    },

    // Notification message
    title: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    // Priority level
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
      index: true,
    },

    // Reference data (link notification to related entity)
    referenceType: {
      type: String,
      enum: [
        "leave",
        "attendance",
        "payroll",
        "performance",
        "training",
        "employee",
        "meeting",
        "asset",
        "document",
        "announcement",
        "system",
        "provisioning_ticket",
      ],
    },

    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
    },

    // Action URL (link to take action on notification)
    actionUrl: {
      type: String,
    },

    // Additional metadata
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Read status
    read: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Read timestamp
    readAt: {
      type: Date,
      default: null,
    },

    // Sender information (who triggered the notification)
    triggeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Notification category for filtering
    category: {
      type: String,
      enum: [
        "approval",
        "reminder",
        "update",
        "alert",
        "achievement",
        "administrative",
      ],
      default: "update",
      index: true,
    },

    // For bulk operations (batch notifications)
    batchId: {
      type: String,
    },

    // Expiry date (for time-sensitive notifications)
    expiresAt: {
      type: Date,
    },

    // Soft delete
    deleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, deleted: 1, createdAt: -1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // Auto delete after 30 days if needed

// TTL Index - Auto delete expired notifications (optional)
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Export model
export default mongoose.model("Notification", notificationSchema);
