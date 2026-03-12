import mongoose from "mongoose";

const payrollComponentSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    reason: { type: String, default: "", trim: true },
    source: { type: String, default: "MANUAL", trim: true },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const salarySnapshotSchema = new mongoose.Schema(
  {
    employeeSalary: { type: Number, default: 0, min: 0 },
    templateId: { type: mongoose.Schema.Types.ObjectId, ref: "SalaryTemplate" },
    templateName: { type: String, default: "", trim: true },
    templateBasic: { type: Number, default: 0, min: 0 },
    templateHra: { type: Number, default: 0, min: 0 },
    templateAllowance: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const payrollDetailSchema = new mongoose.Schema(
  {
    payrollRunId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PayrollRun",
      required: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    basicSalary: { type: Number, required: true, default: 0, min: 0 },
    earnings: { type: [payrollComponentSchema], default: [] },
    bonuses: { type: [payrollComponentSchema], default: [] },
    deductions: { type: [payrollComponentSchema], default: [] },
    tax: { type: Number, required: true, default: 0, min: 0 },
    pf: { type: Number, required: true, default: 0, min: 0 },
    esi: { type: Number, required: true, default: 0, min: 0 },
    grossSalary: { type: Number, required: true, default: 0, min: 0 },
    totalDeductions: { type: Number, required: true, default: 0, min: 0 },
    netSalary: { type: Number, required: true, default: 0, min: 0 },
    salarySnapshot: { type: salarySnapshotSchema, default: () => ({}) },
  },
  { timestamps: true },
);

payrollDetailSchema.index({ payrollRunId: 1, employeeId: 1 }, { unique: true });

export default mongoose.model("PayrollDetail", payrollDetailSchema);
