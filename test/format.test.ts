import { closeMonthClass, formatCrores, formatCroresShort, formatMonth, stageSeverity, weightedValue } from '../src/core';

describe('format', () => {
  it('formats paise as Cr / L / plain rupees', () => {
    expect(formatCrores(25_00_00_000_00)).toBe('₹25.00 Cr');
    expect(formatCrores(4_500_000_00)).toBe('₹45.00 L');
    expect(formatCrores(950_000)).toBe('₹9,500');
  });
  it('formats short axis labels', () => {
    expect(formatCroresShort(15_000_000)).toBe('1.5Cr');
    expect(formatCroresShort(200_000)).toBe('2.0L');
    expect(formatCroresShort(50_000)).toBe('50K');
    expect(formatCroresShort(12)).toBe('12');
  });
  it('formats month keys', () => {
    expect(formatMonth('2027-03')).toBe('Mar 2027');
    expect(formatMonth('2027-03', true)).toBe('Mar 27');
  });
  it('colours close months relative to now', () => {
    const now = new Date(2026, 10, 15); // Nov 2026, Q4
    expect(closeMonthClass('2026-09', now)).toBe('text-red-600');
    expect(closeMonthClass('2026-11', now)).toBe('text-green-600');
    expect(closeMonthClass('2026-12', now)).toBe('text-orange-500');
    expect(closeMonthClass('2027-02', now)).toBe('');
  });
  it('weights contract value by probability', () => {
    expect(weightedValue({ contractValuePaise: 1_000_00, probabilityPct: 25 })).toBe(25_000);
    expect(weightedValue({ contractValuePaise: null, probabilityPct: 50 })).toBe(0);
  });
  it('maps stage to tag severity', () => {
    expect(stageSeverity('Awarded')).toBe('success');
    expect(stageSeverity('Lost')).toBe('danger');
    expect(stageSeverity('Bid Submitted')).toBe('warn');
    expect(stageSeverity('Lead')).toBe('info');
  });
});
