import React, { memo, useMemo } from 'react';

const MONTHS = [
  { value: '01', label: 'Jan' },
  { value: '02', label: 'Feb' },
  { value: '03', label: 'Mar' },
  { value: '04', label: 'Apr' },
  { value: '05', label: 'May' },
  { value: '06', label: 'Jun' },
  { value: '07', label: 'Jul' },
  { value: '08', label: 'Aug' },
  { value: '09', label: 'Sep' },
  { value: '10', label: 'Oct' },
  { value: '11', label: 'Nov' },
  { value: '12', label: 'Dec' },
];

const SELECT_CLASS =
  'h-10 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500';

const parseIsoDate = (value) => {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return { year: '', month: '', day: '' };
  }
  return { year: match[1], month: match[2], day: match[3] };
};

const daysInMonth = (year, month) => {
  if (!year || !month) {
    return 31;
  }
  return new Date(Number(year), Number(month), 0).getDate();
};

const DateOfBirthInput = ({
  value = '',
  onChange,
  disabled = false,
  className = '',
  id,
  required = false,
  selectClassName = SELECT_CLASS,
}) => {
  const parsed = parseIsoDate(value);
  const currentYear = new Date().getFullYear();

  const years = useMemo(() => {
    const list = [];
    for (let year = currentYear; year >= currentYear - 100; year -= 1) {
      list.push(String(year));
    }
    return list;
  }, [currentYear]);

  const maxDay = daysInMonth(parsed.year, parsed.month);
  const days = useMemo(() => {
    const list = [];
    for (let day = 1; day <= maxDay; day += 1) {
      list.push(String(day).padStart(2, '0'));
    }
    return list;
  }, [maxDay]);

  const emitChange = (year, month, day) => {
    if (!year || !month || !day) {
      onChange?.('');
      return;
    }
    onChange?.(`${year}-${month}-${day}`);
  };

  const handlePartChange = (part) => (event) => {
    const next = { ...parsed, [part]: event.target.value };
    if ((part === 'year' || part === 'month') && next.day) {
      const validMaxDay = daysInMonth(next.year, next.month);
      if (Number(next.day) > validMaxDay) {
        next.day = String(validMaxDay).padStart(2, '0');
      }
    }
    emitChange(next.year, next.month, next.day);
  };

  return (
    <div id={id} className={`grid grid-cols-3 gap-2 ${className}`}>
      <select
        aria-label="Day"
        value={parsed.day}
        onChange={handlePartChange('day')}
        disabled={disabled}
        required={required}
        className={selectClassName}
      >
        <option value="">Day</option>
        {days.map((day) => (
          <option key={day} value={day}>
            {day}
          </option>
        ))}
      </select>
      <select
        aria-label="Month"
        value={parsed.month}
        onChange={handlePartChange('month')}
        disabled={disabled}
        required={required}
        className={selectClassName}
      >
        <option value="">Month</option>
        {MONTHS.map((month) => (
          <option key={month.value} value={month.value}>
            {month.label}
          </option>
        ))}
      </select>
      <select
        aria-label="Year"
        value={parsed.year}
        onChange={handlePartChange('year')}
        disabled={disabled}
        required={required}
        className={selectClassName}
      >
        <option value="">Year</option>
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </div>
  );
};

export default memo(DateOfBirthInput);
