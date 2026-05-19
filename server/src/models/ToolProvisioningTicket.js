import mongoose from "mongoose";

const toolSnapshotSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    notes: { type: String, default: "" },
  },
  { _id: false },
);

const toolProvisioningTicketSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    reportingManagerEmployeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    requiredToolsSnapshot: { type: [toolSnapshotSchema], default: [] },
    status: {
      type: String,
      enum: ["PENDING_MANAGER_APPROVAL", "APPROVED", "REJECTED", "FULFILLED"],
      default: "PENDING_MANAGER_APPROVAL",
      index: true,
    },
    approvedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    approvedAt: { type: Date, default: null },
    rejectedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    rejectedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: "" },
  },
  { timestamps: true },
);

toolProvisioningTicketSchema.index({ employeeId: 1, status: 1 });
toolProvisioningTicketSchema.index({ reportingManagerEmployeeId: 1, status: 1 });

export default mongoose.model("ToolProvisioningTicket", toolProvisioningTicketSchema);
