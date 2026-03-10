// Employee validation utilities

/**
 * Validate employee creation/update
 */
const validateEmployeeData = (body, isUpdate = false) => {
  const errors = {};

  if (!isUpdate) {
    // Required for creation
    if (!body.email || typeof body.email !== "string") {
      errors.email = "Email is required and must be a string";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      errors.email = "Email format is invalid";
    }

    if (!body.firstName || typeof body.firstName !== "string") {
      errors.firstName = "First name is required";
    } else if (body.firstName.trim().length < 2) {
      errors.firstName = "First name must be at least 2 characters";
    }

    if (!body.lastName || typeof body.lastName !== "string") {
      errors.lastName = "Last name is required";
    } else if (body.lastName.trim().length < 2) {
      errors.lastName = "Last name must be at least 2 characters";
    }
  }

  // Optional fields validation for both create and update
  if (body.firstName && typeof body.firstName !== "string") {
    errors.firstName = "First name must be a string";
  }

  if (body.lastName && typeof body.lastName !== "string") {
    errors.lastName = "Last name must be a string";
  }

  if (body.department && typeof body.department !== "string") {
    errors.department = "Department must be a string";
  }

  if (body.designation && typeof body.designation !== "string") {
    errors.designation = "Designation must be a string";
  }

  if (body.managerID && typeof body.managerID !== "string") {
    errors.managerID = "Manager ID must be a string";
  }

  if (body.salary && typeof body.salary !== "number") {
    errors.salary = "Salary must be a number";
  } else if (body.salary < 0) {
    errors.salary = "Salary cannot be negative";
  }

  if (body.phoneNumber && !/^\d{10}$/.test(body.phoneNumber.toString())) {
    errors.phoneNumber = "Phone number must be 10 digits";
  }

  if (body.dateOfBirth && isNaN(new Date(body.dateOfBirth))) {
    errors.dateOfBirth = "Invalid date format";
  }

  if (body.joinDate && isNaN(new Date(body.joinDate))) {
    errors.joinDate = "Invalid date format";
  }

  if (body.address && typeof body.address !== "string") {
    errors.address = "Address must be a string";
  }

  if (body.city && typeof body.city !== "string") {
    errors.city = "City must be a string";
  }

  if (body.state && typeof body.state !== "string") {
    errors.state = "State must be a string";
  }

  if (body.zipCode && !/^\d{5,6}$/.test(body.zipCode.toString())) {
    errors.zipCode = "Zip code must be 5-6 digits";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate document upload
 */
const validateDocumentUpload = (body) => {
  const errors = {};

  if (!body.documentType || typeof body.documentType !== "string") {
    errors.documentType = "Document type is required";
  }

  if (!body.fileName || typeof body.fileName !== "string") {
    errors.fileName = "File name is required";
  }

  if (!body.fileUrl || typeof body.fileUrl !== "string") {
    errors.fileUrl = "File URL is required";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate bulk import data
 */
const validateBulkEmployeeData = (employees) => {
  const errors = [];

  if (!Array.isArray(employees) || employees.length === 0) {
    return {
      isValid: false,
      errors: ["Employee data must be a non-empty array"],
    };
  }

  employees.forEach((emp, index) => {
    const empErrors = [];

    if (!emp.email) {
      empErrors.push("Email is required");
    }
    if (!emp.firstName) {
      empErrors.push("First name is required");
    }
    if (!emp.lastName) {
      empErrors.push("Last name is required");
    }

    if (empErrors.length > 0) {
      errors.push({ rowNumber: index + 1, errors: empErrors });
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export {
  validateEmployeeData,
  validateDocumentUpload,
  validateBulkEmployeeData,
};
