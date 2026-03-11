import mongoose from "mongoose";

const goalSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    targetValue: { type: String },
    currentProgress: { type: Number, default: 0, min: 0, max: 100 },
    goalType: {
      type: String,
      enum: ["PROFESSIONAL", "PERSONAL", "DEPARTMENTAL"],
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      default: "MEDIUM",
    },
    status: {
      type: String,
      enum: ["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "FAILED", "ON_HOLD"],
      default: "NOT_STARTED",
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    reviewNotes: { type: String },
    completionDate: { type: Date },
  },
  { timestamps: true },
);

export default mongoose.model("Goal", goalSchema);
