/**
 * Payroll run period parsing and employment eligibility (join date).
 */

export const parsePayrollRunPeriod = (run) => {
  if (!run) {
    return null;
  }

  const month = run.month;
  if (typeof month === "string" && month.trim()) {
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

  if (run.year != null && run.month != null && typeof run.month === "number") {
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

export const getPayrollDetailPeriod = (detail) =>
  parsePayrollRunPeriod(detail?.payrollRunId || detail?.payrollRun);

export const getEmploymentPeriodStart = (employee) => {
  const raw = employee?.joinDate;
  if (!raw) {
    return null;
  }

  const join = new Date(raw);
  if (Number.isNaN(join.getTime())) {
    return null;
  }

  return new Date(join.getFullYear(), join.getMonth(), 1);
};

export const isEmployeeEligibleForPayrollRun = (employee, run) => {
  const employmentStart = getEmploymentPeriodStart(employee);
  if (!employmentStart) {
    return true;
  }

  const period = parsePayrollRunPeriod(run);
  if (!period || Number.isNaN(period.getTime())) {
    return true;
  }

  return period.getTime() >= employmentStart.getTime();
};

export const filterPayrollDetailsByEmploymentStart = (details = [], employee = null) => {
  const employmentStart = getEmploymentPeriodStart(employee);
  if (!employmentStart) {
    return details;
  }

  return details.filter((detail) => {
    const period = getPayrollDetailPeriod(detail);
    if (!period || Number.isNaN(period.getTime())) {
      return true;
    }
    return period.getTime() >= employmentStart.getTime();
  });
};
