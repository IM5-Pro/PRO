/**
 * Resignation Model
 * Manages employee resignation requests and exit processing
 * 
 * @module Resignation
 * @version 1.0.0
 * Features:
 * - Track resignation requests with comprehensive details
 * - Status workflow: Requested → Approved/Rejected → Completed
 * - Audit trail with timestamps and responsible parties
 * - Integration with exit clearance process
 */

import mongoose from "mongoose";

const resignationSchema = new mongoose.Schema(
  {
    // ========== EMPLOYEE INFORMATION ==========
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },
    employeeCode: { type: String, required: true },
    employeeName: { type: String, required: true },
    department: { type: String, required: true },
    designation: { type: String, required: true },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      index: true,
    },

    // ========== RESIGNATION DETAILS ==========
    reasonForLeaving: {
      type: String,
      required: true,
      enum: [
        "CAREER_GROWTH",
        "HIGHER_EDUCATION",
        "RELOCATION",
        "PERSONAL_REASONS",
        "HEALTH_ISSUES",
        "FAMILY_RESPONSIBILITIES",
        "BETTER_OPPORTUNITY",
        "WORKPLACE_DISSATISFACTION",
        "SALARY_EXPECTATIONS",
        "WORK_LIFE_BALANCE",
        "OTHER",
      ],
      default: "OTHER",
    },
    reasonDescription: {
      type: String,
      maxlength: 1000,
      trim: true,
    },

    // ========== RESIGNATION DATES ==========
    requestedLastDayOfWork: {
      type: Date,
      required: true,
      description: "Employee's intended last working date",
    },
    approvedLastDayOfWork: {
      type: Date,
      description: "HR/Manager approved last working date (may differ from requested)",
    },
    noticePeriodDays: {
      type: Number,
      default: 0,
      description: "Notice period in days as per employment agreement",
    },
    actualLastDayOfWork: {
      type: Date,
      description: "Actual last day worked by employee",
    },

    // ========== STATUS WORKFLOW ==========
    status: {
      type: String,
      enum: [
        "DRAFT",
        "SUBMITTED",
        "MANAGER_APPROVED",
        "MANAGER_REJECTED",
        "HR_APPROVED",
        "HR_REJECTED",
        "COMPLETED",
        "CANCELLED",
      ],
      default: "DRAFT",
      index: true,
    },
    submittedAt: { type: Date, description: "When resignation was formally submitted" },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      description: "User who submitted the resignation",
    },

    // ========== APPROVAL WORKFLOW ==========
    managerApprovalAt: { type: Date },
    managerApprovedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    managerApprovalNotes: { type: String, maxlength: 500 },

    hrApprovalAt: { type: Date },
    hrApprovedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    hrApprovalNotes: { type: String, maxlength: 500 },

    // ========== EXIT PROCESSING ==========
    exitClearanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExitClearance",
      description: "Link to exit clearance process",
    },
    fullSettlementCompleted: {
      type: Boolean,
      default: false,
      description: "Final settlement processed and approved",
    },
    settlementCompletedAt: { type: Date },
    settlementNotes: { type: String, maxlength: 500 },

    // ========== DOCUMENTS & ATTACHMENTS ==========
    attachments: [
      {
        fileName: { type: String },
        fileUrl: { type: String },
        documentType: {
          type: String,
          enum: ["RESIGNATION_LETTER", "RELIEVING_LETTER", "OTHER"],
        },
        uploadedAt: { type: Date, default: Date.now },
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],

    // ========== NOTIFICATIONS & HISTORY ==========
    notificationsSent: [
      {
        recipient: { type: String }, // 'manager', 'hr', 'employee', 'admin'
        sentAt: { type: Date, default: Date.now },
        status: { type: String, enum: ["SENT", "PENDING", "FAILED"] },
      },
    ],

    // ========== AUDIT & METADATA ==========
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    cancelledAt: { type: Date },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    cancellationReason: { type: String, maxlength: 500 },
  },
  {
    timestamps: true,
    collection: "resignations",
    virtuals: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ============================================================================
// INDEXES
// ============================================================================
resignationSchema.index({ employeeId: 1, createdAt: -1 });
resignationSchema.index({ status: 1, createdAt: -1 });
resignationSchema.index({ manager: 1, status: 1 });
resignationSchema.index({ requestedLastDayOfWork: 1 });

// ============================================================================
// VIRTUAL FIELDS
// ============================================================================
resignationSchema.virtual("isApproved").get(function () {
  return this.status === "HR_APPROVED";
});

resignationSchema.virtual("isPending").get(function () {
  return ["DRAFT", "SUBMITTED", "MANAGER_APPROVED"].includes(this.status);
});

resignationSchema.virtual("isRejected").get(function () {
  return this.status.includes("REJECTED");
});

resignationSchema.virtual("daysUntilLastDay").get(function () {
  if (!this.requestedLastDayOfWork) return null;
  const today = new Date();
  const lastDay = new Date(this.requestedLastDayOfWork);
  lastDay.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.ceil((lastDay - today) / (1000 * 60 * 60 * 24));
});

// ============================================================================
// STATIC METHODS
// ============================================================================
resignationSchema.statics.getResignationsByStatus = function (status) {
  return this.find({ status }).sort({ createdAt: -1 });
};

resignationSchema.statics.getPendingResignations = function () {
  return this.find({
    status: { $in: ["SUBMITTED", "MANAGER_APPROVED"] },
  }).sort({ createdAt: -1 });
};

resignationSchema.statics.getEmployeeResignationHistory = function (employeeId) {
  return this.find({ employeeId })
    .sort({ createdAt: -1 })
    .populate("manager", "firstName lastName employeeCode");
};

// ============================================================================
// INSTANCE METHODS
// ============================================================================
resignationSchema.methods.canApprove = function (userRole, userId) {
  if (userRole === "SUPER_ADMIN") return true;
  if (userRole === "HR_ADMIN" && this.status === "MANAGER_APPROVED")
    return true;
  if (userRole === "MANAGER" && this.status === "SUBMITTED" && this.manager?.equals(userId))
    return true;
  return false;
};

resignationSchema.methods.canReject = function (userRole, userId) {
  if (userRole === "SUPER_ADMIN") return true;
  if (userRole === "HR_ADMIN" && ["SUBMITTED", "MANAGER_APPROVED"].includes(this.status))
    return true;
  if (
    userRole === "MANAGER" &&
    this.status === "SUBMITTED" &&
    this.manager?.equals(userId)
  )
    return true;
  return false;
};

resignationSchema.methods.canCancel = function (userRole, userId) {
  if (this.status === "COMPLETED") return false;
  if (userRole === "SUPER_ADMIN") return true;
  if (userRole === "EMPLOYEE" && this.employeeId?.equals(userId)) return true;
  return false;
};

export default mongoose.model("Resignation", resignationSchema);
