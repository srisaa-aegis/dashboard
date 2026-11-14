/** Data contracts of the pipeline dashboard. Money is integer paise (₹1 = 100 paise). */

export interface Ref {
  id: string;
  name: string;
}

export interface Option {
  label: string;
  value: string;
}

export interface OppRow {
  id: string;
  title: string;
  stage: string;
  entryPath: string;
  contractValuePaise: number | null;
  probabilityPct: number | null;
  submissionDue: string | null;
  /** `YYYY-MM` */
  expectedCloseMonth: string | null;
  businessUnitId: string;
  businessUnitName: string | null;
  accountId: string | null;
  accountName: string | null;
  ownerUserId: string | null;
  ownerName: string | null;
}

export interface PipelineData {
  summary: { totalOpportunities: number; totalContractValuePaise: number; weightedPipelineValuePaise: number };
  byStage: Array<{ stage: string; count: number; totalValuePaise: number; weightedValuePaise: number }>;
  byBu: Array<{ buId: string; buName: string; count: number; totalValuePaise: number; weightedValuePaise: number }>;
  byCloseMonth: Array<{ closeMonth: string; count: number; totalValuePaise: number; weightedValuePaise: number }>;
  opportunities: OppRow[];
}

export interface OrdersData {
  summary: { totalOrders: number; totalValuePaise: number };
  byBu: Array<{ buName: string; count: number; totalValuePaise: number }>;
  byMonth: Array<{ month: string; count: number; totalValuePaise: number }>;
  byMonthBu: Array<{ month: string; buName: string; totalValuePaise: number }>;
  /** Won opportunities; `expectedCloseMonth` is the booking month. */
  opportunities: OppRow[];
}

export interface DashboardFilterOptions {
  businessUnits: Ref[];
  stages: Option[];
  owners: Ref[];
}

export interface DashboardFilters {
  buId: string | null;
  stage: string | null;
  ownerId: string | null;
}

/** Minimal Chart.js data shape produced by the builders. */
export interface ChartDataset {
  label?: string;
  data: number[];
  backgroundColor: string | string[];
}
export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}
