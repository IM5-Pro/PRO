import { formatINR, formatINRCompact, parseAmount } from './currency';

describe('currency (INR)', () => {
  test('parseAmount strips dollar prefix', () => {
    expect(parseAmount('$50,000')).toBe(50000);
    expect(parseAmount('₹1,20,000')).toBe(120000);
  });

  test('formatINR uses rupee symbol', () => {
    expect(formatINR(50000)).toMatch(/₹/);
    expect(formatINR('$50,000')).toMatch(/₹/);
    expect(formatINR('$50,000')).not.toMatch(/\$/);
  });

  test('formatINRCompact uses lakh notation', () => {
    expect(formatINRCompact(1840000)).toBe('₹18.4L');
  });
});
