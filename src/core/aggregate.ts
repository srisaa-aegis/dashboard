import type { DashboardFilters, OppRow, OrdersData, PipelineData } from './models';

/**
 * Turns flat opportunity rows into the shapes the dashboard consumes. The dashboard itself never calls
 * these: they are for hosts without a back-end (like the demo) and for servers that want the same maths.
 */

/** Default left-to-right order of the pipeline stages. */
export const DEFAULT_STAGE_ORDER = [
  'Lead',
  'Qualified',
  'Pre-Bid',
  'Bid Submitted',
  'Technical Evaluation',
  'Financial Evaluation',
  'Negotiation',
];

export function filterOpportunities(rows: readonly OppRow[], f: DashboardFilters): OppRow[] {
  return rows.filter(
    (o) =>
      (!f.buId || o.businessUnitId === f.buId) &&
      (!f.stage || o.stage === f.stage) &&
      (!f.ownerId || o.ownerUserId === f.ownerId),
  );
}

const weighted = (o: OppRow): number => Math.round(((o.contractValuePaise ?? 0) * (o.probabilityPct ?? 0)) / 100);
const value = (o: OppRow): number => o.contractValuePaise ?? 0;
const sum = (rows: OppRow[], fn: (o: OppRow) => number): number => rows.reduce((s, o) => s + fn(o), 0);

/** Groups rows by a key (rows whose key is null are skipped), keeping first-seen order. */
function group(rows: readonly OppRow[], key: (o: OppRow) => string | null): Map<string, OppRow[]> {
  const out = new Map<string, OppRow[]>();
  for (const r of rows) {
    const k = key(r);
    if (k === null) continue;
    out.set(k, [...(out.get(k) ?? []), r]);
  }
  return out;
}

export function buildPipeline(opps: readonly OppRow[], stageOrder: readonly string[] = DEFAULT_STAGE_ORDER): PipelineData {
  const rows = [...opps];
  const byStage = [...group(rows, (o) => o.stage)]
    .sort(([a], [b]) => stageOrder.indexOf(a) - stageOrder.indexOf(b))
    .map(([stage, r]) => ({ stage, count: r.length, totalValuePaise: sum(r, value), weightedValuePaise: sum(r, weighted) }));
  const byBu = [...group(rows, (o) => o.businessUnitId)].map(([buId, r]) => ({
    buId,
    buName: r[0]?.businessUnitName ?? buId,
    count: r.length,
    totalValuePaise: sum(r, value),
    weightedValuePaise: sum(r, weighted),
  }));
  const byCloseMonth = [...group(rows, (o) => o.expectedCloseMonth)]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([closeMonth, r]) => ({ closeMonth, count: r.length, totalValuePaise: sum(r, value), weightedValuePaise: sum(r, weighted) }));
  return {
    summary: {
      totalOpportunities: rows.length,
      totalContractValuePaise: sum(rows, value),
      weightedPipelineValuePaise: sum(rows, weighted),
    },
    byStage,
    byBu,
    byCloseMonth,
    opportunities: rows,
  };
}

/** Won orders; `expectedCloseMonth` is read as the booking month. */
export function buildOrders(orders: readonly OppRow[]): OrdersData {
  const rows = [...orders];
  const byBu = [...group(rows, (o) => o.businessUnitName)].map(([buName, r]) => ({
    buName,
    count: r.length,
    totalValuePaise: sum(r, value),
  }));
  const byMonth = [...group(rows, (o) => o.expectedCloseMonth)]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, r]) => ({ month, count: r.length, totalValuePaise: sum(r, value) }));
  const byMonthBu = byMonth.flatMap(({ month }) =>
    [...group(rows.filter((o) => o.expectedCloseMonth === month), (o) => o.businessUnitName)].map(([buName, r]) => ({
      month,
      buName,
      totalValuePaise: sum(r, value),
    })),
  );
  return {
    summary: { totalOrders: rows.length, totalValuePaise: sum(rows, value) },
    byBu,
    byMonth,
    byMonthBu,
    opportunities: rows,
  };
}
