import mongoose from "mongoose";

const designationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    // Level hierarchy (1=Entry, 10=Executive)
    level: {
      type: Number,
      min: 1,
      max: 10,
      default: 1,
    },
    // Salary band for this designation
    minSalary: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxSalary: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Department this designation belongs to
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
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
    maxHeadcount: {
      type: Number,
      default: null,
      min: 0,
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

designationSchema.pre("validate", function validateSalaryBand(next) {
  if (this.minSalary > this.maxSalary) {
    this.invalidate("maxSalary", "maxSalary must be greater than or equal to minSalary");
  }
  next();
});

// Indexes for faster queries
designationSchema.index({ department: 1 });
designationSchema.index({ level: 1 });
designationSchema.index({ reportingTo: 1 });
designationSchema.index({ isActive: 1 });
designationSchema.index({ maxHeadcount: 1 });

const Designation = mongoose.model("Designation", designationSchema);

export default Designation;
