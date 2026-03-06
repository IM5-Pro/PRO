import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const performanceReviewSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true, default: uuidv4 },
    employeeId: { type: String, required: true },
    reviewerId: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comments: { type: String },
    reviewDate: { type: Date, required: true },
  },
  { timestamps: true },
);

export default mongoose.model("PerformanceReview", performanceReviewSchema);
