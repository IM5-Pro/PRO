import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, unique: true, required: true },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  },
  { timestamps: true },
);

export default mongoose.model("Department", departmentSchema);
