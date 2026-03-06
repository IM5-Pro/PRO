import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const attendanceSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true, default: uuidv4 },
    employeeId: { type: String, required: true },
    checkIn: { type: Date },
    checkOut: { type: Date },
    status: { type: String, enum: ["PRESENT", "ABSENT", "HALF_DAY", "WFH"] },
    deviceId: { type: String },
    punchTime: { type: Date },
  },
  { timestamps: true },
);

export default mongoose.model("Attendance", attendanceSchema);
