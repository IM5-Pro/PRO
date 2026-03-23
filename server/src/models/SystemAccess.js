import mongoose from "mongoose";

const systemAccessSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
  officialEmail: { type: String, required: true },
  username: { type: String, required: true },
  role: { type: String, enum: ["Admin", "HR", "Employee"], required: true },
  permissions: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model("SystemAccess", systemAccessSchema);
