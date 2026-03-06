import mongoose from "mongoose";

const performanceReviewSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    rating: { type: Number, min: 1, max: 5, required: true },
    comments: { type: String },
    reviewDate: { type: Date, required: true },
  },
  { timestamps: true },
);

export default mongoose.model("PerformanceReview", performanceReviewSchema);
