import mongoose from "mongoose";

const candidateSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    resume: { type: String },
    coverLetter: { type: String },
    experience: { type: String },
    qualifications: { type: String },
    skills: [{ type: String }],
    currentCompany: { type: String },
    currentDesignation: { type: String },
    expectedSalary: { type: Number },
    noticePeriod: { type: String },
    status: {
      type: String,
      enum: ["APPLIED", "SHORTLISTED", "REJECTED", "HIRED"],
      default: "APPLIED",
    },
    appliedDate: { type: Date, default: Date.now },
    appliedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    score: { type: Number, default: 0 },
    notes: { type: String },
  },
  { timestamps: true },
);

export default mongoose.model("Candidate", candidateSchema);
