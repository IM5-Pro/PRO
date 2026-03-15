import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityType: { type: String },
    entityId: { type: String, required: true },
    description: { type: String },
    changes: { type: mongoose.Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

auditLogSchema.pre("validate", function syncEntityFields() {
  if (!this.entity && this.entityType) {
    this.entity = this.entityType;
  }

  if (!this.entityType && this.entity) {
    this.entityType = this.entity;
  }
});

auditLogSchema.index({ entity: 1, entityId: 1, createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("AuditLog", auditLogSchema);
