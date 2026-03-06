import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    employeeCode: { type: String, unique: true, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    phone: { type: String },
    panNumber: { type: String },
    aadhaarNumber: { type: String },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    designation: { type: String },
    joiningDate: { type: Date, required: true },
    employmentType: {
      type: String,
      enum: ["FULL_TIME", "PART_TIME", "CONTRACT"],
      required: true,
    },
    salaryTemplateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SalaryTemplate",
    },
    status: {
      type: String,
      enum: ["ACTIVE", "RESIGNED", "TERMINATED"],
      default: "ACTIVE",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Employee", employeeSchema);
