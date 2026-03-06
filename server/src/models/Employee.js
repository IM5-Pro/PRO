import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const employeeSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true, default: uuidv4 },
    employeeCode: { type: String, unique: true, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    phone: { type: String },
    panNumber: { type: String },
    aadhaarNumber: { type: String },
    departmentId: { type: String, required: true },
    designation: { type: String },
    joiningDate: { type: Date, required: true },
    employmentType: {
      type: String,
      enum: ["FULL_TIME", "PART_TIME", "CONTRACT"],
      required: true,
    },
    salaryTemplateId: { type: String },
    status: {
      type: String,
      enum: ["ACTIVE", "RESIGNED", "TERMINATED"],
      default: "ACTIVE",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Employee", employeeSchema);
