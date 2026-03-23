import mongoose from "mongoose";

const performanceSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
  kpis: [{ type: String }],
  goals: [{ type: String }],
  ratings: [{
    year: Number,
    rating: Number,
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    feedback: String,
    createdAt: { type: Date, default: Date.now }
  }],
  appraisalHistory: [{
    year: Number,
    details: String,
    createdAt: { type: Date, default: Date.now }
  }],
  managerFeedback: [{
    manager: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    feedback: String,
    createdAt: { type: Date, default: Date.now }
  }],
}, { timestamps: true });

export default mongoose.model("Performance", performanceSchema);
