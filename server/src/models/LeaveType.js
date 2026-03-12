import mongoose from "mongoose";

const leaveTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true, uppercase: true, default: "" },
    totalDays: { type: Number, required: true },
    reasonRequired: { type: Boolean, default: false },
  },
  { timestamps: true },
);

leaveTypeSchema.index({ name: 1 }, { unique: true });
leaveTypeSchema.index({ code: 1 }, { unique: true, sparse: true });

export default mongoose.model("LeaveType", leaveTypeSchema);
