export const validatePayrollRun = (data) => {
  const errors = {};

  if (!data.month || data.month.trim().length === 0) {
    errors.month = "Payroll month is required";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validatePayrollDetail = (data) => {
  const errors = {};

  const nonNegativeFields = ["basicSalary", "tax", "pf", "esi"];

  nonNegativeFields.forEach((field) => {
    if (data[field] !== undefined && (typeof data[field] !== "number" || data[field] < 0)) {
      errors[field] = `${field} must be a non-negative number`;
    }
  });

  const componentCollections = ["earnings", "bonuses", "deductions"];

  componentCollections.forEach((field) => {
    if (data[field] !== undefined && !Array.isArray(data[field])) {
      errors[field] = `${field} must be an array`;
      return;
    }

    if (Array.isArray(data[field])) {
      data[field].forEach((component, index) => {
        if (!component || typeof component !== "object") {
          errors[`${field}[${index}]`] = "Component must be an object";
          return;
        }

        if (!component.type || String(component.type).trim().length === 0) {
          errors[`${field}[${index}].type`] = "Component type is required";
        }

        if (component.amount === undefined || typeof component.amount !== "number" || component.amount < 0) {
          errors[`${field}[${index}].amount`] = "Component amount must be a non-negative number";
        }
      });
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateSalaryStructure = (data) => {
  const errors = {};

  if (!data.name || data.name.trim().length === 0) {
    errors.name = "Template name is required";
  }

  if (data.basic === undefined || data.basic < 0) {
    errors.basic = "Basic pay must be a non-negative number";
  }

  if (data.hra === undefined || data.hra < 0) {
    errors.hra = "HRA must be a non-negative number";
  }

  if (data.allowance === undefined || data.allowance < 0) {
    errors.allowance = "Allowance must be a non-negative number";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
