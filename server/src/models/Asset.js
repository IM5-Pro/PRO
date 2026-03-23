import mongoose from "mongoose";

const assetSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
  assetType: { type: String, required: true },
  assetTag: { type: String },
  description: { type: String },
  assignedDate: { type: Date },
  returnedDate: { type: Date },
  status: { type: String, enum: ["Assigned", "Returned", "Lost", "Damaged"], default: "Assigned" },
}, { timestamps: true });

export default mongoose.model("Asset", assetSchema);
