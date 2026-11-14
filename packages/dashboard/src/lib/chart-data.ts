import { currentMonthKey, formatMonth } from './format';
import type { ChartData, OrdersData, PipelineData } from './models';

export const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];
const ORDER_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

const color = (palette: string[], i: number): string => palette[i % palette.length] ?? '#999999';

export function buildStageChart(p: PipelineData): ChartData {
  return {
    labels: p.byStage.map((s) => s.stage),
    datasets: [
      {
        label: 'Value (₹)',
        data: p.byStage.map((s) => s.totalValuePaise / 100),
        backgroundColor: p.byStage.map((_, i) => color(CHART_COLORS, i)),
      },
    ],
  };
}

export function buildBuChart(p: PipelineData, weighted: boolean): ChartData {
  return {
    labels: p.byBu.map((b) => b.buName),
    datasets: [
      {
        data: p.byBu.map((b) => (weighted ? b.weightedValuePaise : b.totalValuePaise) / 100),
        backgroundColor: p.byBu.map((_, i) => color(CHART_COLORS, i)),
      },
    ],
  };
}

/** One stacked dataset per BU across the booking months. */
export function buildOrdersChart(o: OrdersData): ChartData {
  const months = [...new Set(o.byMonthBu.map((r) => r.month))].sort();
  const bus = [...new Set(o.byMonthBu.map((r) => r.buName))];
  return {
    labels: months.map((m) => formatMonth(m, true)),
    datasets: bus.map((buName, i) => ({
      label: buName,
      data: months.map((month) => {
        const row = o.byMonthBu.find((r) => r.month === month && r.buName === buName);
        return row ? row.totalValuePaise / 100 : 0;
      }),
      backgroundColor: color(ORDER_COLORS, i),
    })),
  };
}

/** Every `YYYY-MM` key from `start` to `end` inclusive. */
export function monthRange(start: string, end: string): string[] {
  const out: string[] = [];
  let [y, m] = start.split('-').map(Number) as [number, number];
  const [ey, em] = end.split('-').map(Number) as [number, number];
  while (y < ey || (y === ey && m <= em)) {
    out.push(`${y}-${String(m).padStart(2, '0')}`);
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return out;
}

/** Months shown on the close-month chart: from now (or the first data month, if earlier) to the last data month. */
export function closeMonthKeys(p: PipelineData, now: Date = new Date()): string[] {
  if (p.byCloseMonth.length === 0) return [];
  const current = currentMonthKey(now);
  const first = p.byCloseMonth[0]!.closeMonth;
  const last = p.byCloseMonth[p.byCloseMonth.length - 1]!.closeMonth;
  return monthRange(first < current ? first : current, last > current ? last : current);
}

/** Stacked weighted + remainder bars per month (see {@link closeMonthKeys}). Null when there is no data. */
export function buildCloseMonthChart(p: PipelineData, now: Date = new Date()): ChartData | null {
  const months = closeMonthKeys(p, now);
  if (months.length === 0) return null;
  const byMonth = new Map(p.byCloseMonth.map((m) => [m.closeMonth, m]));

  return {
    labels: months.map((m) => formatMonth(m, true)),
    datasets: [
      {
        label: 'Weighted Value',
        data: months.map((m) => (byMonth.get(m)?.weightedValuePaise ?? 0) / 100),
        backgroundColor: '#10B981',
      },
      {
        label: 'Unweighted Remainder',
        data: months.map((m) => {
          const d = byMonth.get(m);
          return d ? (d.totalValuePaise - d.weightedValuePaise) / 100 : 0;
        }),
        backgroundColor: '#93C5FD',
      },
    ],
  };
}
