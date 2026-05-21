/**
 * Client-side payroll projection from employee compensation settings.
 * Mirrors server payrollCalculationService + processPayroll defaults.
 */

const toAmount = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) {
    return 0;
  }
  return num;
};

const roundCurrency = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

const sumComponents = (components = []) =>
  roundCurrency(
    (Array.isArray(components) ? components : []).reduce(
      (sum, item) => sum + toAmount(item?.amount),
      0,
    ),
  );

export const recalculatePayroll = ({
  basicSalary = 0,
  earnings = [],
  bonuses = [],
  deductions = [],
  tax = 0,
  pf = 0,
  esi = 0,
}) => {
  const normalizedBasic = toAmount(basicSalary);
  const earningsTotal = sumComponents(earnings);
  const bonusesTotal = sumComponents(bonuses);
  const deductionsTotal = sumComponents(deductions);
  const normalizedTax = toAmount(tax);
  const normalizedPf = toAmount(pf);
  const normalizedEsi = toAmount(esi);

  const grossSalary = roundCurrency(normalizedBasic + earningsTotal + bonusesTotal);
  const totalDeductions = roundCurrency(
    deductionsTotal + normalizedTax + normalizedPf + normalizedEsi,
  );
  const netSalary = roundCurrency(Math.max(0, grossSalary - totalDeductions));

  return {
    basicSalary: roundCurrency(normalizedBasic),
    earnings,
    bonuses,
    deductions,
    tax: roundCurrency(normalizedTax),
    pf: roundCurrency(normalizedPf),
    esi: roundCurrency(normalizedEsi),
    grossSalary,
    totalDeductions,
    netSalary,
  };
};

const DEFAULT_INDIA_TAX_SLABS = [
  { upto: 300000, rate: 0 },
  { upto: 600000, rate: 0.05 },
  { upto: 900000, rate: 0.1 },
  { upto: 1200000, rate: 0.15 },
  { upto: 1500000, rate: 0.2 },
  { upto: Number.POSITIVE_INFINITY, rate: 0.3 },
];

const calculateTaxBySlabs = (annualTaxableIncome, slabs = DEFAULT_INDIA_TAX_SLABS) => {
  const taxableIncome = toAmount(annualTaxableIncome);
  let remaining = taxableIncome;
  let lowerBound = 0;
  let totalTax = 0;

  for (const slab of slabs) {
    if (remaining <= 0) {
      break;
    }

    const slabCap = Number(slab.upto);
    const slabRate = Number(slab.rate) || 0;
    const slabWidth =
      slabCap === Number.POSITIVE_INFINITY ? remaining : Math.max(0, slabCap - lowerBound);
    const taxableInSlab = Math.min(remaining, slabWidth);
    totalTax += taxableInSlab * slabRate;
    remaining -= taxableInSlab;
    lowerBound = slabCap;
  }

  const annualTax = roundCurrency(totalTax);
  return {
    annualTax,
    monthlyTax: roundCurrency(annualTax / 12),
  };
};

const buildTemplateEarnings = (salaryTemplate) => {
  if (!salaryTemplate || typeof salaryTemplate !== 'object') {
    return [];
  }

  const components = [];

  if (toAmount(salaryTemplate.hra) > 0) {
    components.push({ type: 'HRA', amount: toAmount(salaryTemplate.hra), source: 'TEMPLATE' });
  }

  if (toAmount(salaryTemplate.allowance) > 0) {
    components.push({
      type: 'Allowance',
      amount: toAmount(salaryTemplate.allowance),
      source: 'TEMPLATE',
    });
  }

  return components;
};

const buildSalarySnapshot = (employeeRecord) => {
  const template =
    employeeRecord?.salaryTemplateId && typeof employeeRecord.salaryTemplateId === 'object'
      ? employeeRecord.salaryTemplateId
      : null;

  return {
    employeeSalary: toAmount(employeeRecord?.salary),
    templateName: template?.name || '',
    templateBasic: toAmount(template?.basic),
    templateHra: toAmount(template?.hra),
    templateAllowance: toAmount(template?.allowance),
  };
};

/**
 * Build a payroll-detail-shaped object from employee compensation settings.
 * @returns {object|null}
 */
export const buildProjectedPayrollFromEmployee = (employeeRecord) => {
  if (!employeeRecord) {
    return null;
  }

  const salarySnapshot = buildSalarySnapshot(employeeRecord);
  const templateEarnings = buildTemplateEarnings(employeeRecord.salaryTemplateId);

  const baseSalary =
    salarySnapshot.employeeSalary > 0
      ? salarySnapshot.employeeSalary
      : salarySnapshot.templateBasic;

  if (baseSalary <= 0 && templateEarnings.length === 0) {
    return null;
  }

  const preTaxComputation = recalculatePayroll({
    basicSalary: baseSalary,
    earnings: templateEarnings,
    bonuses: [],
    deductions: [],
    tax: 0,
    pf: baseSalary * 0.12,
    esi: baseSalary <= 21000 ? baseSalary * 0.0075 : 0,
  });

  const slabTax = calculateTaxBySlabs(preTaxComputation.grossSalary * 12);

  const recomputed = recalculatePayroll({
    basicSalary: baseSalary,
    earnings: templateEarnings,
    bonuses: [],
    deductions: [],
    tax: slabTax.monthlyTax,
    pf: baseSalary * 0.12,
    esi:
      preTaxComputation.grossSalary <= 21000
        ? preTaxComputation.grossSalary * 0.0075
        : 0,
  });

  return {
    ...recomputed,
    isProjected: true,
    salarySnapshot,
  };
};
