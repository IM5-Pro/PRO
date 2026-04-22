// Role and Permission validation utilities

/**
 * Validate role creation/update request
 */
const validateRole = (body) => {
  const errors = {};

  if (!body.name || typeof body.name !== "string") {
    errors.name = "Role name is required and must be a string";
  } else if (body.name.trim().length < 2) {
    errors.name = "Role name must be at least 2 characters";
  } else if (!/^[A-Z_]+$/.test(body.name)) {
    errors.name = "Role name must contain only uppercase letters and underscores";
  }

  if (body.description && typeof body.description !== "string") {
    errors.description = "Description must be a string";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate permission assignment
 */
const validatePermissionAssignment = (body) => {
  const errors = {};

  if (!body.permissionId || typeof body.permissionId !== "string") {
    errors.permissionId = "Permission ID is required and must be a string";
  }

  if (!body.roleId || typeof body.roleId !== "string") {
    errors.roleId = "Role ID is required and must be a string";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate permission creation
 */
const validatePermission = (body) => {
  const errors = {};

  if (!body.name || typeof body.name !== "string") {
    errors.name = "Permission name is required and must be a string";
  } else if (body.name.trim().length < 3) {
    errors.name = "Permission name must be at least 3 characters";
  } else if (!/^[a-z_.]+$/.test(body.name)) {
    errors.name =
      "Permission name must contain only lowercase letters, underscores, and dots (e.g., role.create, user.delete)";
  }

  if (body.description && typeof body.description !== "string") {
    errors.description = "Description must be a string";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export { validateRole, validatePermissionAssignment, validatePermission };
