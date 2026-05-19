// PerformanceController handles performance reviews and goal management

import PerformanceReview from "../models/PerformanceReview.js";
import Goal from "../models/Goal.js";
import Employee from "../models/Employee.js";
import { sendError, sendSuccess } from "../utils/response.js";
import { validatePerformanceReview, validateGoal } from "../utils/performanceValidators.js";

/**
 * Create a new performance review
 */
const createReview = async (req, res) => {
  try {
    const validation = validatePerformanceReview(req.body);
    if (!validation.isValid) {
      return sendError(res, 400, "Validation failed", validation.errors);
    }

    const { employeeId, reviewerId, rating, comments, reviewDate } = req.body;

    // Verify employee exists
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return sendError(res, 404, "Employee not found");
    }

    // Verify reviewer exists
    const reviewer = await Employee.findById(reviewerId);
    if (!reviewer) {
      return sendError(res, 404, "Reviewer not found");
    }

    const review = await PerformanceReview.create({
      employeeId,
      reviewerId,
      rating,
      comments: comments || "",
      reviewDate: reviewDate || new Date(),
    });

    await review.populate(["employeeId", "reviewerId"]);
    sendSuccess(res, 201, "Performance review created successfully", review);
  } catch (err) {
    console.error("Create review error:", err);
    sendError(res, 500, "Internal server error", err.message);
  }
};

/**
 * Update a performance review
 */
const updateReview = async (req, res) => {
  try {
    const reviewId = req.params.id || req.params.reviewId;

    if (!reviewId || reviewId.trim().length === 0) {
      return sendError(res, 400, "Validation failed", { reviewId: "Review ID is required" });
    }

    const review = await PerformanceReview.findById(reviewId);
    if (!review) {
      return sendError(res, 404, "Review not found");
    }

    const updatedReview = await PerformanceReview.findByIdAndUpdate(reviewId, req.body, {
      new: true,
    }).populate(["employeeId", "reviewerId"]);

    sendSuccess(res, 200, "Review updated successfully", updatedReview);
  } catch (err) {
    console.error("Update review error:", err);
    sendError(res, 500, "Internal server error", err.message);
  }
};

/**
 * Delete a performance review
 */
const deleteReview = async (req, res) => {
  try {
    const reviewId = req.params.id || req.params.reviewId;

    if (!reviewId || reviewId.trim().length === 0) {
      return sendError(res, 400, "Validation failed", { reviewId: "Review ID is required" });
    }

    const review = await PerformanceReview.findById(reviewId);
    if (!review) {
      return sendError(res, 404, "Review not found");
    }

    await PerformanceReview.findByIdAndDelete(reviewId);

    sendSuccess(res, 200, "Review deleted successfully", { id: reviewId });
  } catch (err) {
    console.error("Delete review error:", err);
    sendError(res, 500, "Internal server error", err.message);
  }
};

/**
 * View performance review for an employee (by employee id in route param)
 */
const viewReview = async (req, res) => {
  try {
    const employeeId = req.params.id || req.params.employeeId;

    if (!employeeId || employeeId.trim().length === 0) {
      return sendError(res, 400, "Validation failed", { employeeId: "Employee ID is required" });
    }

    const reviews = await PerformanceReview.find({ employeeId }).populate([
      "employeeId",
      "reviewerId",
    ]);

    sendSuccess(res, 200, "Reviews retrieved successfully", { reviews, count: reviews.length });
  } catch (err) {
    console.error("View review error:", err);
    sendError(res, 500, "Internal server error", err.message);
  }
};

/**
 * List performance reviews (optional employeeId query)
 */
const listReviews = async (req, res) => {
  try {
    const filter = {};
    if (req.query.employeeId) {
      filter.employeeId = req.query.employeeId;
    }
    const reviews = await PerformanceReview.find(filter)
      .populate(["employeeId", "reviewerId"])
      .sort({ reviewDate: -1 });
    sendSuccess(res, 200, "Reviews retrieved successfully", { reviews, count: reviews.length });
  } catch (err) {
    console.error("List reviews error:", err);
    sendError(res, 500, "Internal server error", err.message);
  }
};

/**
 * List goals (optional employeeId / status query)
 */
const listGoals = async (req, res) => {
  try {
    const filter = {};
    if (req.query.employeeId) {
      filter.employeeId = req.query.employeeId;
    }
    if (req.query.status) {
      filter.status = req.query.status;
    }
    const goals = await Goal.find(filter)
      .populate("employeeId assignedBy")
      .sort({ createdAt: -1 });
    sendSuccess(res, 200, "Goals retrieved successfully", { goals, count: goals.length });
  } catch (err) {
    console.error("List goals error:", err);
    sendError(res, 500, "Internal server error", err.message);
  }
};

/**
 * Submit a review (mark as completed/submitted)
 */
const submitReview = async (req, res) => {
  try {
    const reviewId = req.params.id || req.params.reviewId;

    if (!reviewId || reviewId.trim().length === 0) {
      return sendError(res, 400, "Validation failed", { reviewId: "Review ID is required" });
    }

    const review = await PerformanceReview.findById(reviewId);
    if (!review) {
      return sendError(res, 404, "Review not found");
    }

    const submittedReview = await PerformanceReview.findByIdAndUpdate(
      reviewId,
      { status: "SUBMITTED" },
      { new: true }
    ).populate(["employeeId", "reviewerId"]);

    sendSuccess(res, 200, "Review submitted successfully", submittedReview);
  } catch (err) {
    console.error("Submit review error:", err);
    sendError(res, 500, "Internal server error", err.message);
  }
};

/**
 * Approve a performance review
 */
const approveReview = async (req, res) => {
  try {
    const reviewId = req.params.id || req.params.reviewId;

    if (!reviewId || reviewId.trim().length === 0) {
      return sendError(res, 400, "Validation failed", { reviewId: "Review ID is required" });
    }

    const review = await PerformanceReview.findById(reviewId);
    if (!review) {
      return sendError(res, 404, "Review not found");
    }

    const approvedReview = await PerformanceReview.findByIdAndUpdate(
      reviewId,
      { status: "APPROVED" },
      { new: true }
    ).populate(["employeeId", "reviewerId"]);

    sendSuccess(res, 200, "Review approved successfully", approvedReview);
  } catch (err) {
    console.error("Approve review error:", err);
    sendError(res, 500, "Internal server error", err.message);
  }
};

/**
 * Reject a performance review
 */
const rejectReview = async (req, res) => {
  try {
    const reviewId = req.params.id || req.params.reviewId;
    const { reason } = req.body;

    if (!reviewId || reviewId.trim().length === 0) {
      return sendError(res, 400, "Validation failed", { reviewId: "Review ID is required" });
    }

    const review = await PerformanceReview.findById(reviewId);
    if (!review) {
      return sendError(res, 404, "Review not found");
    }

    const rejectedReview = await PerformanceReview.findByIdAndUpdate(
      reviewId,
      { status: "REJECTED", rejectionReason: reason || "" },
      { new: true }
    ).populate(["employeeId", "reviewerId"]);

    sendSuccess(res, 200, "Review rejected successfully", rejectedReview);
  } catch (err) {
    console.error("Reject review error:", err);
    sendError(res, 500, "Internal server error", err.message);
  }
};

/**
 * Create a goal for an employee
 */
const goalCreate = async (req, res) => {
  try {
    const validation = validateGoal(req.body);
    if (!validation.isValid) {
      return sendError(res, 400, "Validation failed", validation.errors);
    }

    const { employeeId, title, description, targetValue, goalType, startDate, endDate, priority } =
      req.body;

    // Verify employee exists
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return sendError(res, 404, "Employee not found");
    }

    const goal = await Goal.create({
      employeeId,
      title,
      description,
      targetValue: targetValue || "",
      goalType,
      startDate,
      endDate,
      priority: priority || "MEDIUM",
      assignedBy: req.user._id,
    });

    await goal.populate("employeeId assignedBy");
    sendSuccess(res, 201, "Goal created successfully", goal);
  } catch (err) {
    console.error("Create goal error:", err);
    sendError(res, 500, "Internal server error", err.message);
  }
};

/**
 * Update a goal
 */
const goalUpdate = async (req, res) => {
  try {
    const goalId = req.params.id || req.params.goalId;

    if (!goalId || goalId.trim().length === 0) {
      return sendError(res, 400, "Validation failed", { goalId: "Goal ID is required" });
    }

    const goal = await Goal.findById(goalId);
    if (!goal) {
      return sendError(res, 404, "Goal not found");
    }

    const updatedGoal = await Goal.findByIdAndUpdate(goalId, req.body, {
      new: true,
    }).populate("employeeId assignedBy");

    sendSuccess(res, 200, "Goal updated successfully", updatedGoal);
  } catch (err) {
    console.error("Update goal error:", err);
    sendError(res, 500, "Internal server error", err.message);
  }
};

/**
 * Delete a goal
 */
const goalDelete = async (req, res) => {
  try {
    const goalId = req.params.id || req.params.goalId;

    if (!goalId || goalId.trim().length === 0) {
      return sendError(res, 400, "Validation failed", { goalId: "Goal ID is required" });
    }

    const goal = await Goal.findById(goalId);
    if (!goal) {
      return sendError(res, 404, "Goal not found");
    }

    await Goal.findByIdAndDelete(goalId);

    sendSuccess(res, 200, "Goal deleted successfully", { id: goalId });
  } catch (err) {
    console.error("Delete goal error:", err);
    sendError(res, 500, "Internal server error", err.message);
  }
};

/**
 * Assign a goal to an employee
 */
const goalAssign = async (req, res) => {
  try {
    const employeeId = req.params.id || req.params.employeeId;
    const { title, description, targetValue, goalType, startDate, endDate, priority } = req.body;

    const validation = validateGoal({
      employeeId,
      title,
      description,
      goalType,
      startDate,
      endDate,
    });

    if (!validation.isValid) {
      return sendError(res, 400, "Validation failed", validation.errors);
    }

    // Verify employee exists
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return sendError(res, 404, "Employee not found");
    }

    const goal = await Goal.create({
      employeeId,
      title,
      description,
      targetValue: targetValue || "",
      goalType,
      startDate,
      endDate,
      priority: priority || "MEDIUM",
      assignedBy: req.user._id,
      status: "NOT_STARTED",
    });

    await goal.populate("employeeId assignedBy");
    sendSuccess(res, 201, "Goal assigned successfully", goal);
  } catch (err) {
    console.error("Assign goal error:", err);
    sendError(res, 500, "Internal server error", err.message);
  }
};

/**
 * View goals for an employee
 */
const goalView = async (req, res) => {
  try {
    const employeeId = req.params.id || req.params.employeeId;
    const { status } = req.query;

    if (!employeeId || employeeId.trim().length === 0) {
      return sendError(res, 400, "Validation failed", { employeeId: "Employee ID is required" });
    }

    const filter = { employeeId };
    if (status) {
      filter.status = status;
    }

    const goals = await Goal.find(filter).populate("employeeId assignedBy").sort({ createdAt: -1 });

    sendSuccess(res, 200, "Goals retrieved successfully", { goals, count: goals.length });
  } catch (err) {
    console.error("View goals error:", err);
    sendError(res, 500, "Internal server error", err.message);
  }
};

export default {
  createReview,
  updateReview,
  deleteReview,
  viewReview,
  listReviews,
  submitReview,
  approveReview,
  rejectReview,
  goalCreate,
  goalUpdate,
  goalDelete,
  goalAssign,
  goalView,
  listGoals,
};
