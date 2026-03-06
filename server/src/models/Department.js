import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const departmentSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true, default: uuidv4 },
    name: { type: String, unique: true, required: true },
    managerId: { type: String },
  },
  { timestamps: true },
);

export default mongoose.model("Department", departmentSchema);
