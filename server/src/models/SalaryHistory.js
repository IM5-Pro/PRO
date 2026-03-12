import mongoose from "mongoose";

const salaryHistorySchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
      uppercase: true,
      trim: true,
    },
    effectiveFrom: {
      type: Date,
      required: true,
      default: Date.now,
    },
    effectiveTo: {
      type: Date,
      default: null,
    },
    reason: {
      type: String,
      default: "INITIAL",
      trim: true,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);

salaryHistorySchema.index({ employeeId: 1, effectiveFrom: -1 });
salaryHistorySchema.index({ employeeId: 1, effectiveTo: 1 });

export default mongoose.model("SalaryHistory", salaryHistorySchema);
