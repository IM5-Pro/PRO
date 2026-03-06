import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const auditLogSchema = new mongoose.Schema({
  id: { type: String, unique: true, default: uuidv4 },
  userId: { type: String, required: true },
  action: { type: String, required: true },
  entity: { type: String, required: true },
  entityId: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model("AuditLog", auditLogSchema);
