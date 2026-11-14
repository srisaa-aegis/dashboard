import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import {
  DashboardComponent,
  DashboardFilterOptions,
  DashboardFilters,
  OrdersData,
  PipelineData,
} from '../src';
import { DemoDataService } from './demo-data.service';

/** Hosting app: owns the data, reacts to the dashboard's events. The dashboard knows nothing about this file. */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [DashboardComponent],
  template: `
    <header class="bg-slate-800 text-white px-6 py-3 flex items-center justify-between">
      <span class="font-semibold">stl-dashboard — demo host</span>
      <span class="text-xs text-slate-300">data: data/*.js</span>
    </header>

    <main class="p-6 max-w-7xl mx-auto">
      <sd-dashboard
        [pipeline]="pipeline()"
        [orders]="orders()"
        [loading]="loading()"
        [filterOptions]="filterOptions()"
        (filtersChange)="onFilters($event)"
        (opportunityClick)="log('opportunityClick', $event)"
        (newOpportunity)="log('newOpportunity', '')"
      />

      <section class="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 class="text-sm font-semibold text-gray-700 mb-2">Events received by the host</h3>
        @if (events().length === 0) {
          <div class="text-sm text-gray-400">Click a row, a chart segment's row, a filter or "New Opportunity".</div>
        }
        <ul class="text-sm font-mono text-gray-600 space-y-1">
          @for (e of events(); track e.id) {
            <li>{{ e.text }}</li>
          }
        </ul>
      </section>
    </main>
  `,
})
export class AppComponent implements OnInit {
  private readonly data = inject(DemoDataService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly pipeline = signal<PipelineData | null>(null);
  protected readonly orders = signal<OrdersData | null>(null);
  protected readonly loading = signal(true);
  protected readonly filterOptions = signal<DashboardFilterOptions>({ businessUnits: [], stages: [], owners: [] });
  protected readonly events = signal<Array<{ id: number; text: string }>>([]);

  private inflight: Subscription | null = null;
  private eventId = 0;

  ngOnInit(): void {
    this.data.filterOptions$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((o) => this.filterOptions.set(o));
    this.load({ buId: null, stage: null, ownerId: null });
  }

  protected onFilters(f: DashboardFilters): void {
    this.log('filtersChange', JSON.stringify(f));
    this.load(f);
  }

  protected log(name: string, payload: string): void {
    this.events.update((l) => [{ id: ++this.eventId, text: `${name}${payload ? ' → ' + payload : ''}` }, ...l].slice(0, 8));
  }

  private load(f: DashboardFilters): void {
    this.inflight?.unsubscribe();
    this.loading.set(true);
    this.inflight = this.data.load(f).subscribe({
      next: (s) => {
        this.pipeline.set(s.pipeline);
        this.orders.set(s.orders);
        this.loading.set(false);
      },
      error: (e: unknown) => {
        console.error('demo data failed to load', e);
        this.loading.set(false);
      },
    });
  }
}
