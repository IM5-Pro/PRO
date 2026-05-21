import mongoose from "mongoose";
import {
  INSURANCE_BASE_COVERAGE,
  INSURANCE_CYCLE_STATUSES,
  INSURANCE_CYCLE_TYPES,
} from "../constants/insurance.js";

const insuranceAddonSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    description: { type: String, default: "" },
  },
  { _id: true },
);

const insuranceCycleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    cycleType: {
      type: String,
      enum: INSURANCE_CYCLE_TYPES,
      required: true,
    },
    status: {
      type: String,
      enum: INSURANCE_CYCLE_STATUSES,
      default: "OPEN",
      index: true,
    },
    baseCoverageAmount: {
      type: Number,
      default: INSURANCE_BASE_COVERAGE,
      min: 0,
    },
    addons: { type: [insuranceAddonSchema], default: [] },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    closedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    closedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

insuranceCycleSchema.index(
  { status: 1 },
  { unique: true, partialFilterExpression: { status: "OPEN" } },
);

export default mongoose.model("InsuranceCycle", insuranceCycleSchema);
