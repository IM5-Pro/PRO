import mongoose from "mongoose";

const roleTransferSchema = new mongoose.Schema(
  {
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    toUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    reason: { type: String, default: "" },
    completedAt: { type: Date, default: Date.now },
    auditLogId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AuditLog",
    },
  },
  { timestamps: true },
);

roleTransferSchema.index({ completedAt: -1 });

export default mongoose.model("RoleTransfer", roleTransferSchema);
