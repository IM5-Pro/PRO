import mongoose from "mongoose";

const experienceSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
  companyName: { type: String, required: true },
  jobTitle: { type: String, required: true },
  from: { type: Date },
  to: { type: Date },
  duration: { type: String },
  skills: [{ type: String }],
}, { timestamps: true });

export default mongoose.model("Experience", experienceSchema);
