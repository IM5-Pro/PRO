import mongoose from "mongoose";

const interviewSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    interviewType: {
      type: String,
      enum: ["PHONE_SCREEN", "TECHNICAL", "HR", "FINAL"],
      required: true,
    },
    scheduledDate: { type: Date, required: true },
    scheduledTime: { type: String },
    interviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    location: { type: String },
    meetingLink: { type: String },
    status: {
      type: String,
      enum: ["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"],
      default: "SCHEDULED",
    },
    rating: { type: Number, min: 1, max: 5 },
    feedback: { type: String },
    result: {
      type: String,
      enum: ["PASS", "FAIL", "PENDING"],
      default: "PENDING",
    },
    notes: { type: String },
  },
  { timestamps: true },
);

export default mongoose.model("Interview", interviewSchema);
