import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const salaryTemplateSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true, default: uuidv4 },
    name: { type: String, required: true },
    basic: { type: Number, required: true },
    hra: { type: Number, required: true },
    allowance: { type: Number, required: true },
  },
  { timestamps: true },
);

export default mongoose.model("SalaryTemplate", salaryTemplateSchema);
