import { formatINR } from './currency';

const toAmount = (value) => {
  const num = Number(value);
  return Number.isFinite(num) && num >= 0 ? num : 0;
};

/**
 * How base pay was chosen when this payslip was processed (matches server payroll logic).
 */
export const getSalaryBasis = (slip) => {
  const snap = slip?.salarySnapshot || {};
  const employeeSalary = toAmount(snap.employeeSalary);
  const templateBasic = toAmount(snap.templateBasic);

  if (employeeSalary > 0) {
    return {
      key: 'profile',
      label: 'Profile salary',
      baseAmount: employeeSalary,
    };
  }

  if (templateBasic > 0) {
    return {
      key: 'template',
      label: 'Template basic',
      baseAmount: templateBasic,
    };
  }

  return {
    key: 'basic',
    label: 'Basic on slip',
    baseAmount: toAmount(slip?.basicSalary),
  };
};

/** Rough annual CTC hint from monthly base (for HR comparison). */
export const monthlyToLpaHint = (monthlyAmount) => {
  const monthly = toAmount(monthlyAmount);
  if (monthly <= 0) {
    return null;
  }
  const lpa = (monthly * 12) / 100000;
  if (lpa < 0.1) {
    return null;
  }
  return `${lpa.toFixed(1)} LPA (approx.)`;
};

/**
 * Short one-line summary for table cells.
 */
export const formatSalarySnapshotSummary = (slip) => {
  if (!hasSalarySnapshot(slip)) {
    return `Basic ${formatINR(slip?.basicSalary)}/mo (no snapshot)`;
  }

  const basis = getSalaryBasis(slip);
  const lpaHint = monthlyToLpaHint(basis.baseAmount);

  const parts = [`${formatINR(basis.baseAmount)}/mo`, basis.label];
  if (lpaHint) {
    parts.push(lpaHint);
  }

  return parts.join(' · ');
};

/**
 * Structured lines for expanded / tooltip-style display in the table.
 */
export const hasSalarySnapshot = (slip) => {
  const snap = slip?.salarySnapshot;
  if (!snap || typeof snap !== 'object') {
    return false;
  }
  return (
    toAmount(snap.employeeSalary) > 0 ||
    toAmount(snap.templateBasic) > 0 ||
    String(snap.templateName || '').trim().length > 0
  );
};

export const getSalarySnapshotLines = (slip) => {
  const snap = slip?.salarySnapshot || {};
  const basis = getSalaryBasis(slip);

  if (!hasSalarySnapshot(slip)) {
    return [
      {
        label: 'Snapshot',
        value: 'Not recorded — re-process payroll to capture profile/template values',
        highlight: true,
        muted: true,
      },
      {
        label: 'Processed basic',
        value: formatINR(slip?.basicSalary),
        muted: false,
      },
    ];
  }
  const employeeSalary = toAmount(snap.employeeSalary);
  const templateBasic = toAmount(snap.templateBasic);
  const templateHra = toAmount(snap.templateHra);
  const templateAllowance = toAmount(snap.templateAllowance);
  const templateName = String(snap.templateName || '').trim();

  const lines = [
    {
      label: 'Basis used',
      value: `${basis.label} — ${formatINR(basis.baseAmount)}/mo`,
      highlight: true,
    },
    {
      label: 'Profile salary (snapshot)',
      value: employeeSalary > 0 ? `${formatINR(employeeSalary)}/mo` : 'Not set (0)',
      muted: employeeSalary <= 0,
    },
  ];

  if (templateName || templateBasic > 0 || templateHra > 0 || templateAllowance > 0) {
    lines.push({
      label: 'Salary template',
      value: templateName || 'Linked template',
      muted: !templateName,
    });
    lines.push({
      label: 'Template basic / HRA / allowance',
      value: `${formatINR(templateBasic)} / ${formatINR(templateHra)} / ${formatINR(templateAllowance)}`,
      muted: false,
    });
  }

  if (basis.key === 'profile' && templateBasic > 0 && templateBasic !== employeeSalary) {
    lines.push({
      label: 'Note',
      value: `Template basic (${formatINR(templateBasic)}/mo) was not used because profile salary was set.`,
      muted: true,
    });
  }

  if (basis.key === 'template' && employeeSalary <= 0) {
    lines.push({
      label: 'Note',
      value: 'Profile salary was 0 at process time; payroll used template basic.',
      muted: true,
    });
  }

  const processedBasic = toAmount(slip?.basicSalary);
  if (processedBasic > 0 && processedBasic !== basis.baseAmount) {
    lines.push({
      label: 'Processed basic',
      value: formatINR(processedBasic),
      muted: false,
    });
  }

  return lines;
};
