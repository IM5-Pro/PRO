/**
 * Normalize attendance API records for display (employee + date field variants).
 */

export const getAttendanceEmployeeLabel = (record) => {
  if (!record) return '—';

  const emp = record.employee ?? record.employeeId;
  if (emp && typeof emp === 'object') {
    const name = [emp.firstName, emp.lastName].filter(Boolean).join(' ').trim();
    if (name) return name;
    if (emp.email) return emp.email;
    if (emp.employeeCode) return emp.employeeCode;
  }

  if (record.employeeName) return record.employeeName;

  return '—';
};

export const getAttendanceRecordDate = (record) => {
  const raw = record?.attendanceDate ?? record?.date;
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const formatAttendanceRecordDate = (record, locale = undefined, options) => {
  const d = getAttendanceRecordDate(record);
  if (!d) return '—';
  return d.toLocaleDateString(locale, options);
};
