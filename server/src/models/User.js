import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const userSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true, default: uuidv4 },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    roleId: { type: String, required: true },
    employeeId: { type: String },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    refreshToken: { type: String },
    refreshTokenExpiresAt: { type: Date },
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);