import mongoose from "mongoose";

const employeeProfileChangeRequestSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["DRAFT", "PENDING", "APPROVED", "REJECTED"],
      default: "DRAFT",
      index: true,
    },
    requestType: {
      type: String,
      enum: ["ONBOARDING", "UPDATE"],
      default: "UPDATE",
    },
    proposedChanges: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    previousSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: { type: Date, default: null },
    reviewRemarks: { type: String, default: "" },
    submittedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

employeeProfileChangeRequestSchema.index(
  { employee: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ["DRAFT", "PENDING"] } },
  },
);

export default mongoose.model("EmployeeProfileChangeRequest", employeeProfileChangeRequestSchema);
