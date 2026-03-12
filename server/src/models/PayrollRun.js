import mongoose from "mongoose";

const payrollRunSchema = new mongoose.Schema(
  {
    month: { type: String, required: true },
    totalPayout: { type: Number, required: true },
    status: {
      type: String,
      enum: ["DRAFT", "PROCESSED", "PAID", "LOCKED"],
      default: "DRAFT",
    },
    rejectionReason: { type: String, default: "" },
    processedAt: { type: Date },
    approvedAt: { type: Date },
    lockedAt: { type: Date },
  },
  { timestamps: true },
);

export default mongoose.model("PayrollRun", payrollRunSchema);
