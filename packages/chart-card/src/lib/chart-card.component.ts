import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ChartModule } from 'primeng/chart';

export type ChartCardType = 'bar' | 'pie' | 'doughnut' | 'line';

/**
 * A titled card around a Chart.js chart (via PrimeNG's p-chart).
 * `data` and `options` are plain Chart.js objects; click handlers live in `options.onClick`.
 */
@Component({
  selector: 'sd-chart-card',
  standalone: true,
  imports: [ChartModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 class="text-md font-semibold text-gray-700 mb-4">{{ title() }}</h3>
      @if (hasData()) {
        <p-chart [type]="type()" [data]="data()" [options]="options()" [height]="height()" />
      } @else {
        <div class="text-gray-400 text-center py-12">{{ emptyText() }}</div>
      }
    </div>
  `,
})
export class ChartCardComponent {
  readonly title = input.required<string>();
  readonly type = input.required<ChartCardType>();
  readonly data = input<unknown>({});
  readonly options = input<unknown>({});
  readonly height = input<string>('300px');
  /** When false the empty message is shown instead of the chart. */
  readonly hasData = input<boolean>(true);
  readonly emptyText = input<string>('No data');
}
