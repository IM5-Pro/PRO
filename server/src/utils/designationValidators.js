// Designation validation utilities

/**
 * Validate designation creation/update
 */
const validateDesignation = (body, isUpdate = false) => {
  const errors = {};

  if (!isUpdate || body.name) {
    if (!body.name || typeof body.name !== "string") {
      errors.name = "Designation name is required and must be a string";
    } else if (body.name.trim().length < 2) {
      errors.name = "Designation name must be at least 2 characters";
    }
  }

  if (body.description && typeof body.description !== "string") {
    errors.description = "Description must be a string";
  }

  if (body.level && typeof body.level !== "number") {
    errors.level = "Level must be a number";
  } else if (body.level < 1 || body.level > 10) {
    errors.level = "Level must be between 1 and 10";
  }

  if (body.salary && typeof body.salary !== "number") {
    errors.salary = "Salary must be a number";
  } else if (body.salary < 0) {
    errors.salary = "Salary cannot be negative";
  }

  if (body.department && typeof body.department !== "string") {
    errors.department = "Department must be a string";
  }

  if (body.reportingTo && typeof body.reportingTo !== "string") {
    errors.reportingTo = "Reporting to must be a valid designation ID";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate designation assignment to employee
 */
const validateDesignationAssignment = (body) => {
  const errors = {};

  if (!body.employeeId || typeof body.employeeId !== "string") {
    errors.employeeId = "Employee ID is required and must be a string";
  }

  if (!body.designationId || typeof body.designationId !== "string") {
    errors.designationId = "Designation ID is required and must be a string";
  }

  if (body.effectiveDate && isNaN(new Date(body.effectiveDate))) {
    errors.effectiveDate = "Invalid date format";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export { validateDesignation, validateDesignationAssignment };
