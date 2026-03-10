import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    // Employee reference
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    // Check-in details
    checkInTime: {
      type: Date,
      default: null,
    },
    checkInLocation: {
      type: String,
      default: "Office",
    },

    // Check-out details
    checkOutTime: {
      type: Date,
      default: null,
    },
    checkOutLocation: {
      type: String,
      default: "Office",
    },

    // Attendance date
    attendanceDate: {
      type: Date,
      required: true,
      index: true,
    },

    // Status: Present, Absent, Late, LateCheckout, EarlyCheckout, HalfDay, Leave
    status: {
      type: String,
      enum: ["Present", "Absent", "Late", "LateCheckout", "EarlyCheckout", "HalfDay", "Leave", "OnLeave", "WFH"],
      default: "Absent",
    },

    // Working hours (calculated)
    workingHours: {
      type: Number,
      default: 0,
    },

    // Shift details
    shift: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shift",
      default: null,
    },

    // Assigned shift time (if employee has a custom shift)
    assignedShiftStart: {
      type: String, // HH:MM format
      default: "09:00",
    },
    assignedShiftEnd: {
      type: String, // HH:MM format
      default: "18:00",
    },

    // Notes/remarks (e.g., for late arrival, early departure)
    remarks: {
      type: String,
      default: "",
    },

    // Approval status: Pending, Approved, Rejected
    approvalStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    // Approved/Rejected by
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Approval date
    approvalDate: {
      type: Date,
      default: null,
    },

    // Approval remarks
    approvalRemarks: {
      type: String,
      default: "",
    },

    // Is archived (soft delete)
    isArchived: {
      type: Boolean,
      default: false,
    },

    // Created/Updated tracking
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

// Compound index for employee and date
attendanceSchema.index({ employee: 1, attendanceDate: 1 }, { unique: true });

// Index for queries
attendanceSchema.index({ attendanceDate: 1 });
attendanceSchema.index({ approvalStatus: 1 });
attendanceSchema.index({ status: 1 });

const Attendance = mongoose.model("Attendance", attendanceSchema);

export default Attendance;
