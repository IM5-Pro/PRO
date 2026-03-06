const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

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

module.exports = mongoose.model("PerformanceReview", performanceReviewSchema);
