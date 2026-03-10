// PerformanceController stubs for review and goal operations

const createReview = async (req, res) => {
  res.json({ success: true, message: "Review created (stub)" });
};

const updateReview = async (req, res) => {
  res.json({ success: true, message: "Review updated (stub)" });
};

const deleteReview = async (req, res) => {
  res.json({ success: true, message: "Review deleted (stub)" });
};

const viewReview = async (req, res) => {
  res.json({ success: true, message: "Review viewed (stub)" });
};

const submitReview = async (req, res) => {
  res.json({ success: true, message: "Review submitted (stub)" });
};

const approveReview = async (req, res) => {
  res.json({ success: true, message: "Review approved (stub)" });
};

const rejectReview = async (req, res) => {
  res.json({ success: true, message: "Review rejected (stub)" });
};

// goal operations
const goalCreate = async (req, res) => {
  res.json({ success: true, message: "Goal created (stub)" });
};

const goalUpdate = async (req, res) => {
  res.json({ success: true, message: "Goal updated (stub)" });
};

const goalDelete = async (req, res) => {
  res.json({ success: true, message: "Goal deleted (stub)" });
};

const goalAssign = async (req, res) => {
  res.json({ success: true, message: "Goal assigned (stub)" });
};

const goalView = async (req, res) => {
  res.json({ success: true, message: "Goal viewed (stub)" });
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
