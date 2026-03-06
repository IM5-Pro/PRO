import mongoose from "mongoose";

const payrollRunSchema = new mongoose.Schema(
  {
    month: { type: String, required: true },
    totalPayout: { type: Number, required: true },
    status: {
      type: String,
      enum: ["DRAFT", "PROCESSED", "PAID"],
      default: "DRAFT",
    },
  },
  { timestamps: true },
);

export default mongoose.model("PayrollRun", payrollRunSchema);
