import mongoose from "mongoose";
import {
  INSURANCE_NOMINEE_RELATIONS,
  INSURANCE_SUBMISSION_STATUSES,
} from "../constants/insurance.js";

const insuranceNomineeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date, required: true },
    relation: {
      type: String,
      enum: INSURANCE_NOMINEE_RELATIONS,
      required: true,
    },
  },
  { _id: false },
);

const employeeInsuranceSubmissionSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },
    cycle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InsuranceCycle",
      required: true,
      index: true,
    },
    nominees: {
      type: [insuranceNomineeSchema],
      default: [],
      validate: {
        validator: (v) => Array.isArray(v) && v.length <= 5,
        message: "Maximum 5 nominees allowed",
      },
    },
    selectedAddonIds: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
    },
    status: {
      type: String,
      enum: INSURANCE_SUBMISSION_STATUSES,
      default: "DRAFT",
      index: true,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    submittedAt: { type: Date, default: null },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },
    reviewRemarks: { type: String, default: "" },
  },
  { timestamps: true },
);

employeeInsuranceSubmissionSchema.index({ employee: 1, cycle: 1 }, { unique: true });

export default mongoose.model(
  "EmployeeInsuranceSubmission",
  employeeInsuranceSubmissionSchema,
);
