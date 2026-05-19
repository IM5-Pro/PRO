const asTrimmedString = (value) => (value == null ? "" : String(value).trim());

const hasSalaryRange = (data) =>
  data.salaryRange &&
  typeof data.salaryRange === "object" &&
  data.salaryRange.min != null &&
  data.salaryRange.max != null;

export const validateJob = (data, { partial = false } = {}) => {
  const errors = {};
  const has = (field) => data[field] !== undefined && data[field] !== null;

  if (!partial || has("title")) {
    if (!asTrimmedString(data.title)) {
      errors.title = "Job title is required";
    }
  }

  if (!partial || has("description")) {
    if (!asTrimmedString(data.description)) {
      errors.description = "Job description is required";
    }
  }

  if (!partial || has("department")) {
    if (!asTrimmedString(data.department)) {
      errors.department = "Department is required";
    }
  }

  if (!partial || has("location")) {
    if (!asTrimmedString(data.location)) {
      errors.location = "Location is required";
    }
  }

  if (!partial || has("jobType")) {
    if (!data.jobType || !["FULL_TIME", "PART_TIME", "CONTRACT", "TEMPORARY"].includes(data.jobType)) {
      errors.jobType = "Valid job type is required";
    }
  }

  if (hasSalaryRange(data)) {
    const min = Number(data.salaryRange.min);
    const max = Number(data.salaryRange.max);
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      errors.salaryRange = "Salary min and max must be valid numbers";
    } else if (min > max) {
      errors.salaryRange = "Minimum salary cannot be greater than maximum salary";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateCandidate = (data) => {
  const errors = {};

  if (!asTrimmedString(data.firstName)) {
    errors.firstName = "First name is required";
  }

  if (!asTrimmedString(data.lastName)) {
    errors.lastName = "Last name is required";
  }

  if (!asTrimmedString(data.email) || !String(data.email).includes("@")) {
    errors.email = "Valid email is required";
  }

  if (!asTrimmedString(data.phone)) {
    errors.phone = "Phone number is required";
  }

  if (!asTrimmedString(data.jobId)) {
    errors.jobId = "Job ID is required";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateInterview = (data) => {
  const errors = {};

  if (!asTrimmedString(data.candidateId)) {
    errors.candidateId = "Candidate ID is required";
  }

  if (!asTrimmedString(data.jobId)) {
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
