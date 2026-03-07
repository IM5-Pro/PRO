import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    role: String,
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    refreshToken: { type: String },
    refreshTokenExpiresAt: { type: Date },
  },
  { timestamps: true },
);

// Index for better query performance
userSchema.index({ role: 1 });
userSchema.index({ createdBy: 1 });

export default mongoose.model("User", userSchema);