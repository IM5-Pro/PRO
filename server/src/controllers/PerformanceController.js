// PerformanceController stubs for review and goal operations
import { sendSuccess } from "../utils/response.js";

const createReview = async (req, res) => {
  return sendSuccess(res, 200, "Review created (stub)");
};

const updateReview = async (req, res) => {
  return sendSuccess(res, 200, "Review updated (stub)");
};

const deleteReview = async (req, res) => {
  return sendSuccess(res, 200, "Review deleted (stub)");
};

const viewReview = async (req, res) => {
  return sendSuccess(res, 200, "Review viewed (stub)");
};

const submitReview = async (req, res) => {
  return sendSuccess(res, 200, "Review submitted (stub)");
};

const approveReview = async (req, res) => {
  return sendSuccess(res, 200, "Review approved (stub)");
};

const rejectReview = async (req, res) => {
  return sendSuccess(res, 200, "Review rejected (stub)");
};

// goal operations
const goalCreate = async (req, res) => {
  return sendSuccess(res, 200, "Goal created (stub)");
};

const goalUpdate = async (req, res) => {
  return sendSuccess(res, 200, "Goal updated (stub)");
};

const goalDelete = async (req, res) => {
  return sendSuccess(res, 200, "Goal deleted (stub)");
};

const goalAssign = async (req, res) => {
  return sendSuccess(res, 200, "Goal assigned (stub)");
};

const goalView = async (req, res) => {
  return sendSuccess(res, 200, "Goal viewed (stub)");
};

export default {
  createReview,
  updateReview,
  deleteReview,
  viewReview,
  submitReview,
  approveReview,
  rejectReview,
  goalCreate,
  goalUpdate,
  goalDelete,
  goalAssign,
  goalView,
};
