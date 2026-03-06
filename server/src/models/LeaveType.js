import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const leaveTypeSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true, default: uuidv4 },
    name: { type: String, enum: ["CL", "SL", "EL", "LOP"], required: true },
    totalDays: { type: Number, required: true },
  },
  { timestamps: true },
);

export default mongoose.model("LeaveType", leaveTypeSchema);
