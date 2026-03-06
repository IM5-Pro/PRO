import mongoose from "mongoose";

const leaveTypeSchema = new mongoose.Schema(
  {
    name: { type: String, enum: ["CL", "SL", "EL", "LOP"], required: true },
    totalDays: { type: Number, required: true },
  },
  { timestamps: true },
);

export default mongoose.model("LeaveType", leaveTypeSchema);
