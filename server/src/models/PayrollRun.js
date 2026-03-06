import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const payrollRunSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true, default: uuidv4 },
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
