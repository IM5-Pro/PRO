import mongoose from "mongoose";

const designationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    // Level hierarchy (1=Entry, 10=Executive)
    level: {
      type: Number,
      min: 1,
      max: 10,
      default: 1,
    },
    // Expected salary range
    salary: {
      type: Number,
      default: 0,
    },
    // Department this designation belongs to
    department: {
      type: String,
      default: "",
    },
    // Reporting hierarchy
    reportingTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Designation",
      default: null,
    },
    // Number of employees in this designation
    employeeCount: {
      type: Number,
      default: 0,
    },
    // Whether this designation is currently available for hiring
    isActive: {
      type: Boolean,
      default: true,
    },
    // Created/Updated tracking
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

// Index for faster queries
designationSchema.index({ name: 1 });
designationSchema.index({ department: 1 });
designationSchema.index({ level: 1 });
designationSchema.index({ isActive: 1 });

const Designation = mongoose.model("Designation", designationSchema);

export default Designation;
