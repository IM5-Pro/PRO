import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const payrollDetailSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true, default: uuidv4 },
    payrollRunId: { type: String, required: true },
    employeeId: { type: String, required: true },
    grossSalary: { type: Number, required: true },
    deductions: { type: Number, required: true },
    netSalary: { type: Number, required: true },
  },
  { timestamps: true },
);

export default mongoose.model("PayrollDetail", payrollDetailSchema);
