/**
 * Indian Rupee (INR) formatting for payroll and compensation UI.
 */

export const RUPEE_SYMBOL = '₹';

const INR_FORMATTER = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const INR_FORMATTER_WHOLE = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** Strip USD/$ and other symbols so API strings like "$50,000" still format as INR. */
export const parseAmount = (value) => {
  if (value === null || value === undefined || value === '') {
    return NaN;
  }

  const cleaned = String(value)
    .replace(/[₹$€£,\s]/g, '')
    .replace(/USD|INR|Rs\.?/gi, '')
    .trim();

  if (!cleaned) {
    return NaN;
  }

  return Number(cleaned);
};

export const formatINR = (value, options = {}) => {
  const fallback = options.fallback ?? '—';
  if (value === fallback || value === '—' || value === '-' || value == null || value === '') {
    return fallback;
  }

  const numeric = parseAmount(value);
  if (Number.isNaN(numeric)) {
    return fallback;
  }

  const formatter = options.wholeNumber ? INR_FORMATTER_WHOLE : INR_FORMATTER;
  return formatter.format(numeric);
};

/** e.g. ₹18.4L for dashboards; falls back to full formatINR for smaller amounts. */
export const formatINRCompact = (value, options = {}) => {
  const fallback = options.fallback ?? '—';
  const numeric = parseAmount(value);

  if (Number.isNaN(numeric)) {
    return fallback;
  }

  const abs = Math.abs(numeric);
  if (abs >= 1_00_00_000) {
    return `${RUPEE_SYMBOL}${(numeric / 1_00_00_000).toFixed(2).replace(/\.?0+$/, '')} Cr`;
  }
  if (abs >= 1_00_000) {
    return `${RUPEE_SYMBOL}${(numeric / 1_00_000).toFixed(1)}L`;
  }

  return formatINR(numeric, options);
};

/** Use in input placeholders and labels */
export const formatINRLabel = (label) => `${label} (${RUPEE_SYMBOL})`;
