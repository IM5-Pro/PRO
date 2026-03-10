// Validation utilities for Auth and User operations

const VALID_ROLES = ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"];

/**
 * Validate email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * Requirements: min 6 chars, at least 1 number
 */
const isValidPassword = (password) => {
  if (!password || password.length < 6) {
    return false;
  }
  return /\d/.test(password); // at least one number
};

/**
 * Validate required fields
 */
const validateRequiredFields = (obj, fields) => {
  const missing = fields.filter((field) => !obj[field]);
  return {
    isValid: missing.length === 0,
    missing,
  };
};

/**
 * Validate registration request (Super Admin)
 */
const validateRegisterSuperAdmin = (body) => {
  const errors = {};

  // Check required fields
  if (!body.email || typeof body.email !== "string") {
    errors.email = "Email is required and must be a string";
  } else if (!isValidEmail(body.email)) {
    errors.email = "Email format is invalid";
  }

  if (!body.password || typeof body.password !== "string") {
    errors.password = "Password is required and must be a string";
  } else if (!isValidPassword(body.password)) {
    errors.password = "Password must be at least 6 characters with at least 1 number";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate login request
 */
const validateLogin = (body) => {
  const errors = {};

  if (!body.email || typeof body.email !== "string") {
    errors.email = "Email is required and must be a string";
  } else if (!isValidEmail(body.email)) {
    errors.email = "Email format is invalid";
  }

  if (!body.password || typeof body.password !== "string") {
    errors.password = "Password is required";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate create user request
 */
const validateCreateUser = (body) => {
  const errors = {};

  // Validate email
  if (!body.email || typeof body.email !== "string") {
    errors.email = "Email is required and must be a string";
  } else if (!isValidEmail(body.email)) {
    errors.email = "Email format is invalid";
  }

  // Validate password
  if (!body.password || typeof body.password !== "string") {
    errors.password = "Password is required and must be a string";
  } else if (!isValidPassword(body.password)) {
    errors.password = "Password must be at least 6 characters with at least 1 number";
  }

  // Validate role
  if (!body.role || typeof body.role !== "string") {
    errors.role = "Role is required and must be a string";
  } else if (!VALID_ROLES.includes(body.role)) {
    errors.role = `Role must be one of: ${VALID_ROLES.join(", ")}`;
  } else if (body.role === "SUPER_ADMIN") {
    errors.role = "Cannot create SUPER_ADMIN through this endpoint";
  }

  // Validate firstName (optional but if provided, must be string)
  if (body.firstName && typeof body.firstName !== "string") {
    errors.firstName = "FirstName must be a string";
  }

  // Validate lastName (optional but if provided, must be string)
  if (body.lastName && typeof body.lastName !== "string") {
    errors.lastName = "LastName must be a string";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Check if creator can create target role
 */
const canCreateRole = (creatorRole, targetRole) => {
  const rolePermissions = {
    SUPER_ADMIN: ["HR_ADMIN", "MANAGER", "EMPLOYEE"],
    HR_ADMIN: ["MANAGER", "EMPLOYEE"],
    MANAGER: [],
    EMPLOYEE: [],
  };

  return rolePermissions[creatorRole]?.includes(targetRole) || false;
};

export {
  isValidEmail,
  isValidPassword,
  validateRequiredFields,
  validateRegisterSuperAdmin,
  validateLogin,
  validateCreateUser,
  canCreateRole,
  VALID_ROLES,
};
