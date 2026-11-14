import { buildBuChart, buildCloseMonthChart, buildOrdersChart, closeMonthKeys, monthRange } from '../src/core';
import type { OrdersData, PipelineData } from '../src/core';

const pipeline: PipelineData = {
  summary: { totalOpportunities: 2, totalContractValuePaise: 3_000_00, weightedPipelineValuePaise: 1_500_00 },
  byStage: [],
  byBu: [
    { buId: 'a', buName: 'A', count: 1, totalValuePaise: 1_000_00, weightedValuePaise: 400_00 },
    { buId: 'b', buName: 'B', count: 1, totalValuePaise: 2_000_00, weightedValuePaise: 1_100_00 },
  ],
  byCloseMonth: [
    { closeMonth: '2026-12', count: 1, totalValuePaise: 1_000_00, weightedValuePaise: 400_00 },
    { closeMonth: '2027-02', count: 1, totalValuePaise: 2_000_00, weightedValuePaise: 1_100_00 },
  ],
  opportunities: [],
};

describe('chart-data', () => {
  it('builds ranges across year ends', () => {
    expect(monthRange('2026-11', '2027-02')).toEqual(['2026-11', '2026-12', '2027-01', '2027-02']);
  });
  it('fills gaps in the close-month chart starting from the current month', () => {
    const now = new Date(2026, 10, 15);
    expect(closeMonthKeys(pipeline, now)).toEqual(['2026-11', '2026-12', '2027-01', '2027-02']);
    const c = buildCloseMonthChart(pipeline, now)!;
    expect(c.datasets[0]!.data).toEqual([0, 400, 0, 1100]);
    expect(c.datasets[1]!.data).toEqual([0, 600, 0, 900]);
  });
  it('returns null for an empty close-month series', () => {
    expect(buildCloseMonthChart({ ...pipeline, byCloseMonth: [] })).toBeNull();
  });
  it('switches BU chart between total and weighted', () => {
    expect(buildBuChart(pipeline, false).datasets[0]!.data).toEqual([1000, 2000]);
    expect(buildBuChart(pipeline, true).datasets[0]!.data).toEqual([400, 1100]);
  });
  it('builds one stacked dataset per BU', () => {
    const o: OrdersData = {
      summary: { totalOrders: 3, totalValuePaise: 600_00 },
      byBu: [],
      byMonth: [],
      byMonthBu: [
        { month: '2026-02', buName: 'A', totalValuePaise: 100_00 },
        { month: '2026-01', buName: 'B', totalValuePaise: 200_00 },
        { month: '2026-02', buName: 'B', totalValuePaise: 300_00 },
      ],
      opportunities: [],
    };
    const c = buildOrdersChart(o);
    expect(c.labels).toEqual(['Jan 26', 'Feb 26']);
    expect(c.datasets.map((d) => d.label)).toEqual(['A', 'B']);
    expect(c.datasets[0]!.data).toEqual([0, 100]);
    expect(c.datasets[1]!.data).toEqual([200, 300]);
  });
});
