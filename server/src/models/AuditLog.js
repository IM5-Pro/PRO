const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const auditLogSchema = new mongoose.Schema({
  id: { type: String, unique: true, default: uuidv4 },
  userId: { type: String, required: true },
  action: { type: String, required: true },
  entity: { type: String, required: true },
  entityId: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("AuditLog", auditLogSchema);
