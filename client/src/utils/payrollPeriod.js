import { buildProjectedPayrollFromEmployee } from './payrollProjection';

/**
 * Parse payroll run period (month field is usually YYYY-MM from HR payroll run).
 */
export const parsePayrollRunPeriod = (run) => {
  if (!run) {
    return null;
  }

  const month = run.month;
  if (typeof month === 'string' && month.trim()) {
    const trimmed = month.trim();
    const yearMonthMatch = /^(\d{4})-(\d{2})$/.exec(trimmed);
    if (yearMonthMatch) {
      const year = Number(yearMonthMatch[1]);
      const monthIndex = Number(yearMonthMatch[2]) - 1;
      if (monthIndex >= 0 && monthIndex <= 11) {
        return new Date(year, monthIndex, 1);
      }
    }

    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  if (run.year != null && run.month != null && typeof run.month === 'number') {
    return new Date(Number(run.year), Number(run.month) - 1, 1);
  }

  if (run.createdAt) {
    const parsed = new Date(run.createdAt);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return null;
};

/**
 * Sort payroll runs current month → past months (newest period first).
 */
export const comparePayrollRunsByPeriodDesc = (left, right) => {
  const leftPeriod = parsePayrollRunPeriod(left);
  const rightPeriod = parsePayrollRunPeriod(right);
  const leftTime = leftPeriod?.getTime() ?? 0;
  const rightTime = rightPeriod?.getTime() ?? 0;

  if (rightTime !== leftTime) {
    return rightTime - leftTime;
  }

  return (
    new Date(right?.createdAt || 0).getTime() - new Date(left?.createdAt || 0).getTime()
  );
};

export const sortPayrollRunsByPeriodDesc = (runs = []) =>
  [...runs].sort(comparePayrollRunsByPeriodDesc);

export const getPayrollDetailPeriod = (detail) =>
  parsePayrollRunPeriod(detail?.payrollRunId || detail?.payrollRun);

export const isPeriodInCurrentMonth = (periodDate) => {
  if (!periodDate || Number.isNaN(periodDate.getTime())) {
    return false;
  }

  const now = new Date();
  return (
    periodDate.getFullYear() === now.getFullYear() &&
    periodDate.getMonth() === now.getMonth()
  );
};

/**
 * First calendar day of the employee's join month (employment start for payroll).
 */
export const getEmploymentPeriodStart = (employeeRecord) => {
  const raw = employeeRecord?.joinDate;
  if (!raw) {
    return null;
  }

  const join = new Date(raw);
  if (Number.isNaN(join.getTime())) {
    return null;
  }

  return new Date(join.getFullYear(), join.getMonth(), 1);
};

export const isPayrollDetailEligibleForEmployment = (detail, employmentStart) => {
  if (!employmentStart) {
    return true;
  }

  const period = getPayrollDetailPeriod(detail);
  if (!period || Number.isNaN(period.getTime())) {
    return true;
  }

  return period.getTime() >= employmentStart.getTime();
};

/**
 * Hide payslips for payroll periods before the employee's join month.
 */
export const filterPayrollDetailsByEmploymentStart = (details = [], employeeRecord = null) => {
  const employmentStart = getEmploymentPeriodStart(employeeRecord);
  if (!employmentStart) {
    return [...details];
  }

  return details.filter((detail) =>
    isPayrollDetailEligibleForEmployment(detail, employmentStart),
  );
};

export const sortPayrollDetailsByPeriodDesc = (details = []) =>
  [...details].sort((left, right) => {
    const leftPeriod = getPayrollDetailPeriod(left)?.getTime() ?? 0;
    const rightPeriod = getPayrollDetailPeriod(right)?.getTime() ?? 0;

    if (rightPeriod !== leftPeriod) {
      return rightPeriod - leftPeriod;
    }

    return (
      new Date(right?.updatedAt || right?.createdAt || 0).getTime() -
      new Date(left?.updatedAt || left?.createdAt || 0).getTime()
    );
  });

const formatPayrollMonthLabel = (detail) => {
  const run = detail?.payrollRunId || detail?.payrollRun;
  const period = parsePayrollRunPeriod(run);

  if (period) {
    return period.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }

  return run?.month || 'Payroll';
};

/**
 * Pick the payroll record shown in compensation summary:
 * 1) Current month's processed payslip
 * 2) Else projected salary from employee profile (when salary was updated)
 * 3) Else most recent payslip by payroll period
 */
export const pickPayrollDetailForDisplay = (details = [], employeeRecord = null) => {
  const eligible = filterPayrollDetailsByEmploymentStart(details, employeeRecord);
  const sorted = sortPayrollDetailsByPeriodDesc(eligible);
  const projected = buildProjectedPayrollFromEmployee(employeeRecord);
  const projectedGross = Number(projected?.grossSalary || 0);
  const employeeSalary = Number(employeeRecord?.salary || 0);

  const currentMonthDetail = sorted.find((detail) =>
    isPeriodInCurrentMonth(getPayrollDetailPeriod(detail)),
  );

  if (currentMonthDetail) {
    const currentGross = Number(currentMonthDetail.grossSalary || 0);
    const profileSalaryAhead =
      projected &&
      (projectedGross > currentGross ||
        (employeeSalary > 0 && employeeSalary > currentGross));

    if (profileSalaryAhead) {
      return { detail: projected, isProjected: true };
    }

    return { detail: currentMonthDetail, isProjected: false };
  }

  const latestPayslip = sorted[0] || null;
  const latestGross = Number(latestPayslip?.grossSalary || 0);

  const shouldPreferProjection =
    projected &&
    (!latestPayslip ||
      projectedGross > latestGross ||
      (employeeSalary > 0 && employeeSalary > latestGross));

  if (shouldPreferProjection) {
    return { detail: projected, isProjected: true };
  }

  if (latestPayslip) {
    return { detail: latestPayslip, isProjected: false };
  }

  if (projected) {
    return { detail: projected, isProjected: true };
  }

  return { detail: null, isProjected: false };
};

export { formatPayrollMonthLabel };
