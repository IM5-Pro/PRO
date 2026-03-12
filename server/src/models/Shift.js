import mongoose from "mongoose";

const shiftSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      trim: true,
      uppercase: true,
      sparse: true,
      unique: true,
    },
    startTime: {
      type: String,
      required: true,
      default: "09:00",
      match: /^\d{2}:\d{2}$/,
    },
    endTime: {
      type: String,
      required: true,
      default: "18:00",
      match: /^\d{2}:\d{2}$/,
    },
    gracePeriodMinutes: {
      type: Number,
      default: 15,
      min: 0,
    },
    earlyCheckoutThresholdMinutes: {
      type: Number,
      default: 30,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

shiftSchema.index({ name: 1 });
shiftSchema.index({ isActive: 1 });

export default mongoose.model("Shift", shiftSchema);
