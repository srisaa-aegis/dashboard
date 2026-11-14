import { Injectable } from '@angular/core';
import { Observable, delay, map, of } from 'rxjs';
import type {
  DashboardFilterOptions,
  DashboardFilters,
  OppRow,
  OrdersData,
  PipelineData,
} from '@srisaa/dashboard';

export interface DashboardSnapshot {
  pipeline: PipelineData;
  orders: OrdersData;
}

interface DemoDataGlobal {
  opportunities: OppRow[];
  orders: OppRow[];
  filters: DashboardFilterOptions;
}

/**
 * The data files (`public/data/*.js`) are plain scripts that fill `window.__DEMO_DATA__`, so the
 * demo also works when index.html is opened straight from disk (no web server, no fetch).
 */
function demoData(): DemoDataGlobal {
  const d = (window as unknown as { __DEMO_DATA__?: Partial<DemoDataGlobal> }).__DEMO_DATA__;
  if (!d?.opportunities || !d.orders || !d.filters) {
    throw new Error('Demo data files (data/opportunities.js, orders.js, filters.js) were not loaded.');
  }
  return { opportunities: d.opportunities, orders: d.orders, filters: d.filters };
}

/**
 * Stands in for a back-end: reads the demo data files and does the filtering and aggregation a
 * server would do. The dashboard package itself never sees any of this.
 */
@Injectable({ providedIn: 'root' })
export class DemoDataService {
  readonly filterOptions$: Observable<DashboardFilterOptions> = of(null).pipe(map(() => demoData().filters));

  private readonly raw$ = of(null).pipe(map(() => demoData()));

  load(filters: DashboardFilters): Observable<DashboardSnapshot> {
    return this.raw$.pipe(
      delay(250), // make the loading state visible
      map(({ opportunities, orders }) => ({
        pipeline: buildPipeline(applyFilters(opportunities, filters)),
        orders: buildOrders(applyFilters(orders, filters)),
      })),
    );
  }
}

function applyFilters(rows: OppRow[], f: DashboardFilters): OppRow[] {
  return rows.filter(
    (o) =>
      (!f.buId || o.businessUnitId === f.buId) &&
      (!f.stage || o.stage === f.stage) &&
      (!f.ownerId || o.ownerUserId === f.ownerId),
  );
}

const weighted = (o: OppRow): number => Math.round(((o.contractValuePaise ?? 0) * (o.probabilityPct ?? 0)) / 100);
const value = (o: OppRow): number => o.contractValuePaise ?? 0;

function group<K extends string>(rows: OppRow[], key: (o: OppRow) => K | null) {
  const map = new Map<K, OppRow[]>();
  for (const r of rows) {
    const k = key(r);
    if (k === null) continue;
    map.set(k, [...(map.get(k) ?? []), r]);
  }
  return map;
}

const sum = (rows: OppRow[], fn: (o: OppRow) => number): number => rows.reduce((s, o) => s + fn(o), 0);

function buildPipeline(opps: OppRow[]): PipelineData {
  const stageOrder = ['Lead', 'Qualified', 'Pre-Bid', 'Bid Submitted', 'Technical Evaluation', 'Financial Evaluation', 'Negotiation'];
  const byStage = [...group(opps, (o) => o.stage)]
    .sort(([a], [b]) => stageOrder.indexOf(a) - stageOrder.indexOf(b))
    .map(([stage, rows]) => ({ stage, count: rows.length, totalValuePaise: sum(rows, value), weightedValuePaise: sum(rows, weighted) }));
  const byBu = [...group(opps, (o) => o.businessUnitId)].map(([buId, rows]) => ({
    buId,
    buName: rows[0]?.businessUnitName ?? buId,
    count: rows.length,
    totalValuePaise: sum(rows, value),
    weightedValuePaise: sum(rows, weighted),
  }));
  const byCloseMonth = [...group(opps, (o) => o.expectedCloseMonth)]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([closeMonth, rows]) => ({ closeMonth, count: rows.length, totalValuePaise: sum(rows, value), weightedValuePaise: sum(rows, weighted) }));
  return {
    summary: {
      totalOpportunities: opps.length,
      totalContractValuePaise: sum(opps, value),
      weightedPipelineValuePaise: sum(opps, weighted),
    },
    byStage,
    byBu,
    byCloseMonth,
    opportunities: opps,
  };
}

function buildOrders(orders: OppRow[]): OrdersData {
  const byBu = [...group(orders, (o) => o.businessUnitName)].map(([buName, rows]) => ({
    buName,
    count: rows.length,
    totalValuePaise: sum(rows, value),
  }));
  const byMonth = [...group(orders, (o) => o.expectedCloseMonth)]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, rows]) => ({ month, count: rows.length, totalValuePaise: sum(rows, value) }));
  const byMonthBu = byMonth.flatMap(({ month }) =>
    [...group(
      orders.filter((o) => o.expectedCloseMonth === month),
      (o) => o.businessUnitName,
    )].map(([buName, rows]) => ({ month, buName, totalValuePaise: sum(rows, value) })),
  );
  return {
    summary: { totalOrders: orders.length, totalValuePaise: sum(orders, value) },
    byBu,
    byMonth,
    byMonthBu,
    opportunities: orders,
  };
}
