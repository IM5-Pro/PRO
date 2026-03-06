import mongoose from "mongoose";

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      enum: ["SUPER_ADMIN", "HR", "MANAGER", "EMPLOYEE"],
      required: true,
    },
    description: { type: String },
  },
  { timestamps: true },
);

export default mongoose.model("Role", roleSchema);
