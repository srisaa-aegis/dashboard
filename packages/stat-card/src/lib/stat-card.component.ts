import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** A single KPI tile: a small label above a large value. */
@Component({
  selector: 'sd-stat-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div class="text-sm text-gray-500 font-medium">{{ label() }}</div>
      <div class="text-3xl font-bold mt-1" [class]="valueClass()">{{ value() }}</div>
    </div>
  `,
})
export class StatCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  /** Tailwind classes for the value colour, e.g. `text-blue-700`. */
  readonly valueClass = input<string>('text-gray-800');
}
