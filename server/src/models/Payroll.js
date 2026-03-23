import mongoose from "mongoose";

const payrollSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
  ctc: { type: Number },
  basic: { type: Number },
  hra: { type: Number },
  bankName: { type: String },
  bankAccountNumber: { type: String },
  ifscCode: { type: String },
  pfNumber: { type: String },
  uan: { type: String },
  esiDetails: { type: String },
  taxInfo: { type: String },
}, { timestamps: true });

export default mongoose.model("Payroll", payrollSchema);
