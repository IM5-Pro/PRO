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

  // Additional fields for audit provenance
  auditLogSchema.add({
    actorIp: { type: String },
    actorAgent: { type: String },
  });

  // Prevent accidental updates/deletes to audit records via Mongoose queries
  const immutableError = function (next) {
    const err = new Error('AuditLog is immutable and cannot be modified or deleted');
    err.status = 403;
    return next(err);
  };

  auditLogSchema.pre('updateOne', immutableError);
  auditLogSchema.pre('findOneAndUpdate', immutableError);
  auditLogSchema.pre('updateMany', immutableError);
  auditLogSchema.pre('findOneAndDelete', immutableError);
  auditLogSchema.pre('deleteOne', immutableError);
  auditLogSchema.pre('deleteMany', immutableError);

  // Ensure entity/entityType sync before validation (keep existing behaviour)

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
