import type { OppRow } from './models';

/** Paise → `₹1.20 Cr` / `₹45.00 L` / `₹9,500`. */
export function formatCrores(paise: number): string {
  const rupees = paise / 100;
  if (rupees >= 10000000) return '₹' + (rupees / 10000000).toFixed(2) + ' Cr';
  if (rupees >= 100000) return '₹' + (rupees / 100000).toFixed(2) + ' L';
  return '₹' + rupees.toLocaleString('en-IN');
}

/** Rupee amount → short axis label (`1.5Cr`, `2.0L`, `50K`). */
export function formatCroresShort(v: number): string {
  if (v >= 10000000) return (v / 10000000).toFixed(1) + 'Cr';
  if (v >= 100000) return (v / 100000).toFixed(1) + 'L';
  if (v >= 1000) return (v / 1000).toFixed(0) + 'K';
  return String(v);
}

/** `2027-03` → `Mar 2027` (or `Mar 27` with `shortYear`). */
export function formatMonth(m: string, shortYear = false): string {
  const [y, mon] = m.split('-').map(Number);
  return new Date(y ?? 0, (mon ?? 1) - 1).toLocaleDateString('en-IN', {
    month: 'short',
    year: shortYear ? '2-digit' : 'numeric',
  });
}

export function currentMonthKey(now: Date): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/** Tailwind colour for an expected-close month: past red, this month green, this quarter orange. */
export function closeMonthClass(m: string, now: Date = new Date()): string {
  const current = currentMonthKey(now);
  if (m < current) return 'text-red-600';
  if (m === current) return 'text-green-600';
  const [y, mon] = m.split('-').map(Number);
  const sameQuarter = Math.ceil((mon ?? 1) / 3) === Math.ceil((now.getMonth() + 1) / 3);
  if (y === now.getFullYear() && sameQuarter) return 'text-orange-500';
  return '';
}

export function weightedValue(opp: Pick<OppRow, 'contractValuePaise' | 'probabilityPct'>): number {
  return Math.round(((opp.contractValuePaise ?? 0) * (opp.probabilityPct ?? 0)) / 100);
}

export function stageSeverity(stage: string): 'info' | 'success' | 'warn' | 'danger' {
  const s = stage.toLowerCase();
  if (s.includes('award')) return 'success';
  if (s.includes('lost')) return 'danger';
  if (s.includes('bid')) return 'warn';
  return 'info';
}
