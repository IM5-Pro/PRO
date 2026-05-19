import mongoose from "mongoose";

const projectToolSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    notes: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true, uppercase: true, sparse: true },
    requiredTools: { type: [projectToolSchema], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

projectSchema.index({ name: 1 });
projectSchema.index({ isActive: 1 });

export default mongoose.model("Project", projectSchema);
