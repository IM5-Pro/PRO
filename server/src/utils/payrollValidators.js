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

  if (!data.payrollRunId || data.payrollRunId.trim().length === 0) {
    errors.payrollRunId = "Payroll run ID is required";
  }

  if (!data.employeeId || data.employeeId.trim().length === 0) {
    errors.employeeId = "Employee ID is required";
  }

  if (data.grossSalary === undefined || data.grossSalary < 0) {
    errors.grossSalary = "Gross salary must be a non-negative number";
  }

  if (data.deductions === undefined || data.deductions < 0) {
    errors.deductions = "Deductions must be a non-negative number";
  }

  if (data.netSalary === undefined || data.netSalary < 0) {
    errors.netSalary = "Net salary must be a non-negative number";
  }

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
