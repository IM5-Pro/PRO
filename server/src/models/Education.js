import mongoose from "mongoose";

const educationSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
  qualification: { type: String, required: true },
  degree: { type: String },
  university: { type: String },
  yearOfPassing: { type: Number },
  certifications: [{ type: String }],
}, { timestamps: true });

export default mongoose.model("Education", educationSchema);
