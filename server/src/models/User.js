import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    firstName: { type: String, default: "", trim: true },
    middleName: { type: String, default: "", trim: true },
    lastName: { type: String, default: "", trim: true },
    role: String,
    /** Preserved when account is downgraded to EMPLOYEE during resignation notice (audit only). */
    roleBeforeResignationNotice: { type: String, default: null },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isActive: { type: Boolean, default: true },
    mustChangePassword: { type: Boolean, default: false },
    lastLogin: { type: Date },
    refreshTokenHash: { type: String },
    refreshTokenExpiresAt: { type: Date },
    passwordResetTokenHash: { type: String },
    passwordResetTokenExpiresAt: { type: Date },
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date },
  },
  { timestamps: true },
);

// Index for better query performance
userSchema.index({ role: 1 });
userSchema.index({ createdBy: 1 });
userSchema.index({ passwordResetTokenExpiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("User", userSchema);