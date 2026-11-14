import { buildOrders, buildPipeline, filterOpportunities } from '../src/core';
import type { OppRow } from '../src/core';

const row = (o: Partial<OppRow> & Pick<OppRow, 'id'>): OppRow => ({
  title: o.id, stage: 'Lead', entryPath: 'standard_tender', contractValuePaise: 1_000_000, probabilityPct: 50,
  submissionDue: null, expectedCloseMonth: '2026-12', businessUnitId: 'bu1', businessUnitName: 'BU One',
  accountId: null, accountName: null, ownerUserId: 'u1', ownerName: 'U One', ...o,
});

const rows: OppRow[] = [
  row({ id: 'a', stage: 'Pre-Bid', probabilityPct: 25 }),
  row({ id: 'b', stage: 'Lead', businessUnitId: 'bu2', businessUnitName: 'BU Two', ownerUserId: 'u2', contractValuePaise: 3_000_000 }),
  row({ id: 'c', stage: 'Lead', expectedCloseMonth: null }),
];

describe('aggregate', () => {
  it('filters by BU, stage and owner', () => {
    expect(filterOpportunities(rows, { buId: 'bu2', stage: null, ownerId: null }).map((r) => r.id)).toEqual(['b']);
    expect(filterOpportunities(rows, { buId: null, stage: 'Lead', ownerId: 'u1' }).map((r) => r.id)).toEqual(['c']);
    expect(filterOpportunities(rows, { buId: null, stage: null, ownerId: null })).toHaveLength(3);
  });
  it('builds pipeline totals, ordered stages and skips null close months', () => {
    const p = buildPipeline(rows);
    expect(p.summary).toEqual({ totalOpportunities: 3, totalContractValuePaise: 5_000_000, weightedPipelineValuePaise: 250_000 + 1_500_000 + 500_000 });
    expect(p.byStage.map((s) => s.stage)).toEqual(['Lead', 'Pre-Bid']);
    expect(p.byBu.map((b) => b.buName)).toEqual(['BU One', 'BU Two']);
    expect(p.byCloseMonth).toHaveLength(1);
    expect(p.byCloseMonth[0]!.count).toBe(2);
  });
  it('builds orders by month and BU', () => {
    const o = buildOrders(rows.slice(0, 2));
    expect(o.summary).toEqual({ totalOrders: 2, totalValuePaise: 4_000_000 });
    expect(o.byMonthBu).toEqual([
      { month: '2026-12', buName: 'BU One', totalValuePaise: 1_000_000 },
      { month: '2026-12', buName: 'BU Two', totalValuePaise: 3_000_000 },
    ]);
  });
});
