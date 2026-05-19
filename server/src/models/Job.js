import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    department: { type: String, required: true },
    designationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Designation",
      default: null,
    },
    location: { type: String, required: true },
    jobType: {
      type: String,
      enum: ["FULL_TIME", "PART_TIME", "CONTRACT", "TEMPORARY"],
      required: true,
    },
    salaryRange: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
    },
    requiredSkills: [{ type: String }],
    requirements: { type: String },
    experience: { type: String },
    qualifications: { type: String },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["OPEN", "CLOSED", "ON_HOLD"],
      default: "OPEN",
    },
    closingDate: { type: Date },
    vacancies: { type: Number, default: 1 },
  },
  { timestamps: true },
);

export default mongoose.model("Job", jobSchema);
