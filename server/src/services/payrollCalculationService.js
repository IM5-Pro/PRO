const toAmount = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) {
    return 0;
  }
  return num;
};

const roundCurrency = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

const sanitizeComponent = (component, fallbackType = "Component") => ({
  type: typeof component?.type === "string" && component.type.trim().length > 0
    ? component.type.trim()
    : fallbackType,
  amount: toAmount(component?.amount),
  reason: typeof component?.reason === "string" ? component.reason.trim() : "",
  source: typeof component?.source === "string" ? component.source.trim() : "MANUAL",
  addedBy: component?.addedBy || undefined,
  addedAt: component?.addedAt ? new Date(component.addedAt) : new Date(),
});

const sanitizeComponents = (components = [], fallbackType = "Component") => {
  if (!Array.isArray(components)) {
    return [];
  }
  return components.map((component) => sanitizeComponent(component, fallbackType));
};

const sumComponents = (components = []) => {
  return roundCurrency(components.reduce((sum, item) => sum + toAmount(item.amount), 0));
};

const recalculatePayroll = ({
  basicSalary = 0,
  earnings = [],
  bonuses = [],
  deductions = [],
  tax = 0,
  pf = 0,
  esi = 0,
}) => {
  const normalizedEarnings = sanitizeComponents(earnings, "Allowance");
  const normalizedBonuses = sanitizeComponents(bonuses, "Bonus");
  const normalizedDeductions = sanitizeComponents(deductions, "Deduction");

  const normalizedBasic = toAmount(basicSalary);
  const earningsTotal = sumComponents(normalizedEarnings);
  const bonusesTotal = sumComponents(normalizedBonuses);
  const deductionsTotal = sumComponents(normalizedDeductions);
  const normalizedTax = toAmount(tax);
  const normalizedPf = toAmount(pf);
  const normalizedEsi = toAmount(esi);

  const grossSalary = roundCurrency(normalizedBasic + earningsTotal + bonusesTotal);
  const totalDeductions = roundCurrency(deductionsTotal + normalizedTax + normalizedPf + normalizedEsi);
  const netSalary = roundCurrency(Math.max(0, grossSalary - totalDeductions));

  return {
    basicSalary: roundCurrency(normalizedBasic),
    earnings: normalizedEarnings,
    bonuses: normalizedBonuses,
    deductions: normalizedDeductions,
    tax: roundCurrency(normalizedTax),
    pf: roundCurrency(normalizedPf),
    esi: roundCurrency(normalizedEsi),
    grossSalary,
    totalDeductions,
    netSalary,
  };
};

const buildTemplateEarnings = (salaryTemplate) => {
  if (!salaryTemplate) {
    return [];
  }

  const components = [];

  if (toAmount(salaryTemplate.hra) > 0) {
    components.push({ type: "HRA", amount: toAmount(salaryTemplate.hra), source: "TEMPLATE" });
  }

  if (toAmount(salaryTemplate.allowance) > 0) {
    components.push({ type: "Allowance", amount: toAmount(salaryTemplate.allowance), source: "TEMPLATE" });
  }

  return components;
};

const buildSalarySnapshot = (employeeRecord) => {
  const template = employeeRecord?.salaryTemplateId && typeof employeeRecord.salaryTemplateId === "object"
    ? employeeRecord.salaryTemplateId
    : null;

  return {
    employeeSalary: toAmount(employeeRecord?.salary),
    templateId: template?._id || null,
    templateName: template?.name || "",
    templateBasic: toAmount(template?.basic),
    templateHra: toAmount(template?.hra),
    templateAllowance: toAmount(template?.allowance),
  };
};

export {
  toAmount,
  recalculatePayroll,
  buildTemplateEarnings,
  buildSalarySnapshot,
  sumComponents,
};
