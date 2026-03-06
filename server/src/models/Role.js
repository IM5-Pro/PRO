import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const roleSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true, default: uuidv4 },
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
