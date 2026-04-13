/**
 * Local calendar month bounds as YYYY-MM-DD strings (for API query params).
 * Avoids UTC-only ISO strings that can shift the calendar day by timezone.
 */
export function getMonthDateRangeParams(year, monthIndexZeroBased) {
  const start = new Date(year, monthIndexZeroBased, 1);
  const end = new Date(year, monthIndexZeroBased + 1, 0);
  const toYmd = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { startDate: toYmd(start), endDate: toYmd(end) };
}
