import mongoose from "mongoose";

const salaryTemplateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    basic: { type: Number, required: true },
    hra: { type: Number, required: true },
    allowance: { type: Number, required: true },
  },
  { timestamps: true },
);

export default mongoose.model("SalaryTemplate", salaryTemplateSchema);
