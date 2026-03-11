export const validateJob = (data) => {
  const errors = {};

  if (!data.title || data.title.trim().length === 0) {
    errors.title = "Job title is required";
  }

  if (!data.description || data.description.trim().length === 0) {
    errors.description = "Job description is required";
  }

  if (!data.department || data.department.trim().length === 0) {
    errors.department = "Department is required";
  }

  if (!data.location || data.location.trim().length === 0) {
    errors.location = "Location is required";
  }

  if (!data.jobType || !["FULL_TIME", "PART_TIME", "CONTRACT", "TEMPORARY"].includes(data.jobType)) {
    errors.jobType = "Valid job type is required";
  }

  if (!data.salaryRange || !data.salaryRange.min || !data.salaryRange.max) {
    errors.salaryRange = "Salary range is required";
  }

  if (data.salaryRange && data.salaryRange.min > data.salaryRange.max) {
    errors.salaryRange = "Minimum salary cannot be greater than maximum salary";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateCandidate = (data) => {
  const errors = {};

  if (!data.firstName || data.firstName.trim().length === 0) {
    errors.firstName = "First name is required";
  }

  if (!data.lastName || data.lastName.trim().length === 0) {
    errors.lastName = "Last name is required";
  }

  if (!data.email || !data.email.includes("@")) {
    errors.email = "Valid email is required";
  }

  if (!data.phone || data.phone.trim().length === 0) {
    errors.phone = "Phone number is required";
  }

  if (!data.jobId || data.jobId.trim().length === 0) {
    errors.jobId = "Job ID is required";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateInterview = (data) => {
  const errors = {};

  if (!data.candidateId || data.candidateId.trim().length === 0) {
    errors.candidateId = "Candidate ID is required";
  }

  if (!data.jobId || data.jobId.trim().length === 0) {
    errors.jobId = "Job ID is required";
  }

  if (!data.interviewType || !["PHONE_SCREEN", "TECHNICAL", "HR", "FINAL"].includes(data.interviewType)) {
    errors.interviewType = "Valid interview type is required";
  }

  if (!data.scheduledDate) {
    errors.scheduledDate = "Scheduled date is required";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
