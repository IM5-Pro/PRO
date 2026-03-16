import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, unique: true, required: true, trim: true },
    code: { type: String, unique: true, required: true, trim: true, uppercase: true },
    parentDepartmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department", default: null },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

departmentSchema.index({ parentDepartmentId: 1 });

export default mongoose.model("Department", departmentSchema);
