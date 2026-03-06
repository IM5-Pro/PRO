import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    checkIn: { type: Date },
    checkOut: { type: Date },
    status: { type: String, enum: ["PRESENT", "ABSENT", "HALF_DAY", "WFH"] },
    deviceId: { type: String },
    punchTime: { type: Date },
  },
  { timestamps: true },
);

export default mongoose.model("Attendance", attendanceSchema);
