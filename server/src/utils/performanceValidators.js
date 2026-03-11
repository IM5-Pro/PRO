export const validatePerformanceReview = (data) => {
  const errors = {};

  if (!data.employeeId || data.employeeId.trim().length === 0) {
    errors.employeeId = "Employee ID is required";
  }

  if (!data.reviewerId || data.reviewerId.trim().length === 0) {
    errors.reviewerId = "Reviewer ID is required";
  }

  if (!data.rating || data.rating < 1 || data.rating > 5) {
    errors.rating = "Rating must be between 1 and 5";
  }

  if (!data.reviewDate) {
    errors.reviewDate = "Review date is required";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateGoal = (data) => {
  const errors = {};

  if (!data.employeeId || data.employeeId.trim().length === 0) {
    errors.employeeId = "Employee ID is required";
  }

  if (!data.title || data.title.trim().length === 0) {
    errors.title = "Goal title is required";
  }

  if (!data.description || data.description.trim().length === 0) {
    errors.description = "Goal description is required";
  }

  if (!data.goalType || !["PROFESSIONAL", "PERSONAL", "DEPARTMENTAL"].includes(data.goalType)) {
    errors.goalType = "Valid goal type is required";
  }

  if (!data.startDate) {
    errors.startDate = "Start date is required";
  }

  if (!data.endDate) {
    errors.endDate = "End date is required";
  }

  if (data.startDate && data.endDate && new Date(data.startDate) > new Date(data.endDate)) {
    errors.dates = "End date must be after start date";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
