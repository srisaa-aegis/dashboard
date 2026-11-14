import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { StatCardComponent } from '@srisaa/stat-card';
import { ChartCardComponent } from '@srisaa/chart-card';
import { DataTableComponent, TableColumn } from '@srisaa/data-table';
import { FilterBarComponent, FilterField, FilterValues } from '@srisaa/filter-bar';
import { DrilldownDialogComponent } from '@srisaa/drilldown-dialog';
import {
  buildBuChart,
  buildCloseMonthChart,
  buildOrdersChart,
  buildStageChart,
  closeMonthKeys,
} from './chart-data';
import {
  closeMonthClass,
  formatCrores,
  formatCroresShort,
  formatMonth,
  stageSeverity,
  weightedValue,
} from './format';
import type { DashboardFilterOptions, DashboardFilters, OppRow, OrdersData, PipelineData } from './models';

type ClickElements = Array<{ index: number }>;

/**
 * Sales pipeline dashboard. Purely presentational: the host supplies data and filter options
 * and reacts to the outputs. Filtering is the host's job (`filtersChange`).
 */
@Component({
  selector: 'sd-dashboard',
  standalone: true,
  imports: [
    ButtonModule,
    StatCardComponent,
    ChartCardComponent,
    DataTableComponent,
    FilterBarComponent,
    DrilldownDialogComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-semibold text-gray-800">{{ title() }}</h2>
        <p class="text-sm text-gray-500 mt-1">{{ subtitle() }}</p>
      </div>
      @if (newButtonLabel()) {
        <p-button [label]="newButtonLabel()" icon="pi pi-plus" (onClick)="newOpportunity.emit()" />
      }
    </div>

    <div class="mb-6">
      <sd-filter-bar [fields]="filterFields()" [(values)]="filterValues" (changed)="onFiltersChanged($event)" />
    </div>

    @if (loading()) {
      <div class="flex items-center gap-2 text-gray-500 py-12 justify-center">
        <i class="pi pi-spin pi-spinner text-2xl"></i> Loading...
      </div>
    } @else {
    @if (pipeline(); as p) {
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <sd-stat-card label="Total Opportunities" [value]="p.summary.totalOpportunities" />
        <sd-stat-card
          label="Total Contract Value"
          [value]="fmt(p.summary.totalContractValuePaise)"
          valueClass="text-blue-700"
        />
        <sd-stat-card
          label="Weighted Pipeline Value"
          [value]="fmt(p.summary.weightedPipelineValuePaise)"
          valueClass="text-green-700"
        />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <sd-chart-card
          title="Pipeline by Stage"
          type="bar"
          [hasData]="p.byStage.length > 0"
          [data]="stageChart()"
          [options]="barOptions"
        />
        <sd-chart-card
          title="Weighted Pipeline by Business Unit"
          type="pie"
          [hasData]="p.byBu.length > 0"
          [data]="weightedBuChart()"
          [options]="doughnutOptions"
        />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <sd-chart-card
          title="Pipeline Value by Business Unit"
          type="doughnut"
          [hasData]="p.byBu.length > 0"
          [data]="buChart()"
          [options]="doughnutOptions"
        />
        <sd-chart-card
          title="Orders Booked — Last 12 Months by BU"
          type="bar"
          [hasData]="(orders()?.byMonthBu?.length ?? 0) > 0"
          emptyText="No orders booked yet"
          [data]="ordersChart()"
          [options]="stackedBarOptions"
        />
      </div>

      @if (closeMonthChart()) {
        <div class="mb-6">
          <sd-chart-card
            title="Pipeline by Expected Close Month"
            type="bar"
            [data]="closeMonthChart()"
            [options]="closeMonthBarOptions"
          />
        </div>
      }

      @if (orders(); as o) {
        @if (o.summary.totalOrders > 0) {
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <sd-stat-card label="Total Orders Won" [value]="o.summary.totalOrders" />
            <sd-stat-card label="Total Order Value" [value]="fmt(o.summary.totalValuePaise)" valueClass="text-emerald-700" />
          </div>
        }
      }

      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 class="text-md font-semibold text-gray-700 mb-4">Active Opportunities</h3>
        <sd-data-table
          [rows]="p.opportunities"
          [columns]="mainColumns"
          emptyMessage="No opportunities found"
          (rowClick)="opportunityClick.emit($event.id)"
        />
      </div>
    }
    }

    <sd-drilldown-dialog
      [(visible)]="drillVisible"
      [title]="drillTitle()"
      [rows]="drillRows()"
      [columns]="drillColumns"
      [summary]="drillSummary()"
      (rowClick)="onDrillRowClick($event)"
    />
  `,
})
export class DashboardComponent {
  readonly pipeline = input<PipelineData | null>(null);
  readonly orders = input<OrdersData | null>(null);
  readonly loading = input<boolean>(false);
  readonly filterOptions = input<DashboardFilterOptions>({ businessUnits: [], stages: [], owners: [] });
  readonly title = input<string>('Sales Pipeline');
  readonly subtitle = input<string>('Probability-weighted pipeline view');
  /** Empty string hides the button. */
  readonly newButtonLabel = input<string>('New Opportunity');
  /** Reference date for the close-month colouring/range (defaults to today); handy for tests and demos. */
  readonly now = input<Date | null>(null);

  readonly filtersChange = output<DashboardFilters>();
  readonly opportunityClick = output<string>();
  readonly newOpportunity = output<void>();

  protected readonly filterValues = signal<FilterValues>({ buId: null, stage: null, ownerId: null });

  protected readonly filterFields = computed<FilterField[]>(() => {
    const o = this.filterOptions();
    return [
      {
        key: 'buId',
        label: 'Business Unit',
        placeholder: 'All BUs',
        options: o.businessUnits.map((b) => ({ label: b.name, value: b.id })),
      },
      { key: 'stage', label: 'Stage', placeholder: 'All stages', options: o.stages },
      {
        key: 'ownerId',
        label: 'Owner',
        placeholder: 'All owners',
        searchable: true,
        options: o.owners.map((u) => ({ label: u.name, value: u.id })),
      },
    ];
  });

  // ---- chart data ----
  protected readonly stageChart = computed(() => {
    const p = this.pipeline();
    return p ? buildStageChart(p) : {};
  });
  protected readonly buChart = computed(() => {
    const p = this.pipeline();
    return p ? buildBuChart(p, false) : {};
  });
  protected readonly weightedBuChart = computed(() => {
    const p = this.pipeline();
    return p ? buildBuChart(p, true) : {};
  });
  protected readonly ordersChart = computed(() => {
    const o = this.orders();
    return o ? buildOrdersChart(o) : {};
  });
  protected readonly closeMonthChart = computed(() => {
    const p = this.pipeline();
    return p ? buildCloseMonthChart(p, this.now() ?? new Date()) : null;
  });

  // ---- drill-down ----
  protected readonly drillVisible = signal(false);
  protected readonly drillTitle = signal('');
  protected readonly drillRows = signal<OppRow[]>([]);
  protected readonly drillSummary = computed(() => {
    const rows = this.drillRows();
    const total = rows.reduce((s, o) => s + (o.contractValuePaise ?? 0), 0);
    return `${rows.length} opportunities | Total Value: ${formatCrores(total)}`;
  });

  // ---- columns ----
  private readonly closeMonthColumn: TableColumn<OppRow> = {
    header: 'Close Month',
    value: (o) => (o.expectedCloseMonth ? formatMonth(o.expectedCloseMonth) : '-'),
    cellClass: (o) =>
      o.expectedCloseMonth ? 'text-sm font-medium ' + closeMonthClass(o.expectedCloseMonth, this.now() ?? new Date()) : '',
  };
  private readonly baseColumns: TableColumn<OppRow>[] = [
    { header: 'Title', field: 'title', bold: true },
    { header: 'Account', field: 'accountName' },
    { header: 'BU', field: 'businessUnitName' },
    { header: 'Stage', field: 'stage', tag: (o) => stageSeverity(o.stage) },
    { header: 'Value (₹)', align: 'right', value: (o) => formatCrores(o.contractValuePaise ?? 0) },
    { header: 'Prob%', align: 'right', value: (o) => `${o.probabilityPct ?? '-'}%` },
  ];
  protected readonly mainColumns: TableColumn<OppRow>[] = [
    ...this.baseColumns,
    { header: 'Weighted (₹)', align: 'right', bold: true, value: (o) => formatCrores(weightedValue(o)) },
    { header: 'Owner', field: 'ownerName' },
    this.closeMonthColumn,
  ];
  protected readonly drillColumns: TableColumn<OppRow>[] = [...this.baseColumns, { header: 'Owner', field: 'ownerName' }];

  // ---- chart options (click → drill-down) ----
  private readonly hover = {
    onHover: (evt: { native: MouseEvent }, elements: unknown[]) => {
      const canvas = evt.native?.target as HTMLCanvasElement | null;
      if (canvas) canvas.style.cursor = elements.length > 0 ? 'pointer' : 'default';
    },
  };
  private readonly axis = (v: string | number) => formatCroresShort(Number(v));

  protected readonly barOptions = {
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { callback: this.axis } } },
    maintainAspectRatio: false,
    ...this.hover,
    onClick: (_e: unknown, els: ClickElements) => this.onClick(els, (i) => this.drillByStage(i)),
  };
  protected readonly doughnutOptions = {
    plugins: { legend: { position: 'bottom' as const } },
    maintainAspectRatio: false,
    ...this.hover,
    onClick: (_e: unknown, els: ClickElements) => this.onClick(els, (i) => this.drillByBu(i)),
  };
  protected readonly stackedBarOptions = {
    plugins: { legend: { position: 'bottom' as const } },
    scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true, ticks: { callback: this.axis } } },
    maintainAspectRatio: false,
    ...this.hover,
    onClick: (_e: unknown, els: ClickElements) => this.onClick(els, (i) => this.drillByOrderMonth(i)),
  };
  protected readonly closeMonthBarOptions = {
    plugins: {
      legend: { position: 'bottom' as const },
      tooltip: {
        callbacks: {
          label: (ctx: { dataset: { label: string }; raw: number }) =>
            `${ctx.dataset.label}: ₹${formatCroresShort(ctx.raw)}`,
        },
      },
    },
    scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true, ticks: { callback: this.axis } } },
    maintainAspectRatio: false,
    ...this.hover,
    onClick: (_e: unknown, els: ClickElements) => this.onClick(els, (i) => this.drillByCloseMonth(i)),
  };

  protected fmt(paise: number): string {
    return formatCrores(paise);
  }

  protected onFiltersChanged(v: FilterValues): void {
    this.filtersChange.emit({ buId: v['buId'] ?? null, stage: v['stage'] ?? null, ownerId: v['ownerId'] ?? null });
  }

  protected onDrillRowClick(row: OppRow): void {
    this.drillVisible.set(false);
    this.opportunityClick.emit(row.id);
  }

  private onClick(els: ClickElements, handler: (index: number) => void): void {
    const first = els[0];
    if (first) handler(first.index);
  }

  private openDrill(title: string, rows: OppRow[]): void {
    this.drillTitle.set(title);
    this.drillRows.set(rows);
    this.drillVisible.set(true);
  }

  private drillByStage(index: number): void {
    const p = this.pipeline();
    const stage = p?.byStage[index]?.stage;
    if (!p || !stage) return;
    this.openDrill(`Stage: ${stage}`, p.opportunities.filter((o) => o.stage === stage));
  }

  private drillByBu(index: number): void {
    const p = this.pipeline();
    const bu = p?.byBu[index];
    if (!p || !bu) return;
    this.openDrill(`Business Unit: ${bu.buName}`, p.opportunities.filter((o) => o.businessUnitId === bu.buId));
  }

  private drillByCloseMonth(index: number): void {
    const p = this.pipeline();
    if (!p) return;
    // Index refers to the chart's filled month range, not byCloseMonth.
    const month = closeMonthKeys(p, this.now() ?? new Date())[index];
    if (!month) return;
    this.openDrill(`Close Month: ${formatMonth(month)}`, p.opportunities.filter((o) => o.expectedCloseMonth === month));
  }

  private drillByOrderMonth(index: number): void {
    const o = this.orders();
    if (!o) return;
    const month = [...new Set(o.byMonthBu.map((r) => r.month))].sort()[index];
    if (!month) return;
    this.openDrill(`Orders Booked: ${formatMonth(month)}`, o.opportunities.filter((op) => op.expectedCloseMonth === month));
  }
}
