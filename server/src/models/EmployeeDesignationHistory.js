import mongoose from "mongoose";

const employeeDesignationHistorySchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },
    designationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Designation",
      required: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
    effectiveFrom: {
      type: Date,
      required: true,
      default: Date.now,
    },
    effectiveTo: {
      type: Date,
      default: null,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reason: {
      type: String,
      default: "ASSIGNMENT",
      trim: true,
    },
  },
  { timestamps: true },
);

employeeDesignationHistorySchema.pre("validate", function validateDateRange(next) {
  if (this.effectiveTo && this.effectiveTo < this.effectiveFrom) {
    this.invalidate("effectiveTo", "effectiveTo must be greater than or equal to effectiveFrom");
  }
  next();
});

employeeDesignationHistorySchema.index({ employeeId: 1, effectiveFrom: -1 });
employeeDesignationHistorySchema.index({ employeeId: 1, effectiveTo: 1 });
employeeDesignationHistorySchema.index({ designationId: 1, effectiveTo: 1 });

export default mongoose.model("EmployeeDesignationHistory", employeeDesignationHistorySchema);