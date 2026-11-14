import { Injectable } from '@angular/core';
import { Observable, delay, map, of } from 'rxjs';
import {
  buildOrders,
  buildPipeline,
  filterOpportunities,
  type DashboardFilterOptions,
  type DashboardFilters,
  type OppRow,
  type OrdersData,
  type PipelineData,
} from '../src';

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
 * The data files (`demo/data/*.js`) are plain scripts that fill `window.__DEMO_DATA__`, so the demo also
 * works when index.html is opened straight from disk (no web server, no fetch).
 */
function demoData(): DemoDataGlobal {
  const d = (window as unknown as { __DEMO_DATA__?: Partial<DemoDataGlobal> }).__DEMO_DATA__;
  if (!d?.opportunities || !d.orders || !d.filters) {
    throw new Error('Demo data files (data/opportunities.js, orders.js, filters.js) were not loaded.');
  }
  return { opportunities: d.opportunities, orders: d.orders, filters: d.filters };
}

/** Stands in for a back-end: reads the data files, then filters and aggregates them with the core helpers. */
@Injectable({ providedIn: 'root' })
export class DemoDataService {
  readonly filterOptions$: Observable<DashboardFilterOptions> = of(null).pipe(map(() => demoData().filters));

  load(filters: DashboardFilters): Observable<DashboardSnapshot> {
    return of(null).pipe(
      delay(250), // make the loading state visible
      map(() => {
        const { opportunities, orders } = demoData();
        return {
          pipeline: buildPipeline(filterOpportunities(opportunities, filters)),
          orders: buildOrders(filterOpportunities(orders, filters)),
        };
      }),
    );
  }
}
