import mongoose from "mongoose";

const employeeLeaveBalanceSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },
    leaveTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LeaveType",
      required: true,
      index: true,
    },
    totalDays: {
      type: Number,
      required: true,
      min: 0,
    },
    usedDays: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    remainingDays: {
      type: Number,
      required: true,
      min: 0,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

employeeLeaveBalanceSchema.index({ employeeId: 1, leaveTypeId: 1 }, { unique: true });

export default mongoose.model("EmployeeLeaveBalance", employeeLeaveBalanceSchema);
