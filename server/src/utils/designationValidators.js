// Designation validation utilities

import mongoose from "mongoose";

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

  if (body.code !== undefined && body.code !== null && body.code !== "") {
    if (typeof body.code !== "string") {
      errors.code = "Designation code must be a string";
    } else if (body.code.trim().length < 2) {
      errors.code = "Designation code must be at least 2 characters";
    }
  }

  if (body.description && typeof body.description !== "string") {
    errors.description = "Description must be a string";
  }

  if (body.level !== undefined && typeof body.level !== "number") {
    errors.level = "Level must be a number";
  } else if (typeof body.level === "number" && (body.level < 1 || body.level > 10)) {
    errors.level = "Level must be between 1 and 10";
  }

  if (body.salary !== undefined && typeof body.salary !== "number") {
    errors.salary = "Salary must be a number";
  } else if (typeof body.salary === "number" && body.salary < 0) {
    errors.salary = "Salary cannot be negative";
  }

  if (body.minSalary !== undefined && typeof body.minSalary !== "number") {
    errors.minSalary = "minSalary must be a number";
  } else if (typeof body.minSalary === "number" && body.minSalary < 0) {
    errors.minSalary = "minSalary cannot be negative";
  }

  if (body.maxSalary !== undefined && typeof body.maxSalary !== "number") {
    errors.maxSalary = "maxSalary must be a number";
  } else if (typeof body.maxSalary === "number" && body.maxSalary < 0) {
    errors.maxSalary = "maxSalary cannot be negative";
  }

  if (body.maxHeadcount !== undefined && body.maxHeadcount !== null && typeof body.maxHeadcount !== "number") {
    errors.maxHeadcount = "maxHeadcount must be a number";
  } else if (typeof body.maxHeadcount === "number" && body.maxHeadcount < 0) {
    errors.maxHeadcount = "maxHeadcount cannot be negative";
  }

  const effectiveMinSalary = body.minSalary ?? body.salary;
  const effectiveMaxSalary = body.maxSalary ?? body.salary;
  if (
    typeof effectiveMinSalary === "number" &&
    typeof effectiveMaxSalary === "number" &&
    effectiveMinSalary > effectiveMaxSalary
  ) {
    errors.maxSalary = "maxSalary must be greater than or equal to minSalary";
  }

  if (body.department !== undefined && body.department !== null && body.department !== "") {
    if (typeof body.department !== "string" || !mongoose.Types.ObjectId.isValid(body.department)) {
      errors.department = "Department must be a valid department ID";
    }
  }

  if (body.reportingTo !== undefined && body.reportingTo !== null && body.reportingTo !== "") {
    if (typeof body.reportingTo !== "string" || !mongoose.Types.ObjectId.isValid(body.reportingTo)) {
      errors.reportingTo = "Reporting to must be a valid designation ID";
    }
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

  if (body.reason !== undefined && typeof body.reason !== "string") {
    errors.reason = "Reason must be a string";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export { validateDesignation, validateDesignationAssignment };
