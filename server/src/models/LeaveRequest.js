import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const leaveRequestSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true, default: uuidv4 },
    employeeId: { type: String, required: true },
    leaveTypeId: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
  },
  { timestamps: true },
);

export default mongoose.model("LeaveRequest", leaveRequestSchema);
