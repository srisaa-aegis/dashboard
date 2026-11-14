import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterField {
  key: string;
  label: string;
  options: readonly FilterOption[];
  placeholder?: string;
  /** Show a search box inside the dropdown. */
  searchable?: boolean;
}

export type FilterValues = Record<string, string | null>;

/** A row of dropdown filters plus a Reset button. */
@Component({
  selector: 'sd-filter-bar',
  standalone: true,
  imports: [FormsModule, ButtonModule, SelectModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        @for (f of fields(); track f.key) {
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-gray-700">{{ f.label }}</label>
            <p-select
              appendTo="body"
              [ngModel]="values()[f.key] ?? null"
              (ngModelChange)="set(f.key, $event)"
              [options]="asArray(f.options)"
              optionLabel="label"
              optionValue="value"
              [filter]="f.searchable ?? false"
              [showClear]="true"
              [placeholder]="f.placeholder ?? 'All'"
              class="w-full"
            />
          </div>
        }
        <p-button label="Reset" icon="pi pi-refresh" severity="secondary" [outlined]="true" (onClick)="reset()" />
      </div>
    </div>
  `,
})
export class FilterBarComponent {
  readonly fields = input.required<readonly FilterField[]>();
  /** Current value per field key (two-way bindable). */
  readonly values = model<FilterValues>({});
  /** Emits the full set of values whenever one changes or on reset. */
  readonly changed = output<FilterValues>();

  asArray(options: readonly FilterOption[]): FilterOption[] {
    return options as FilterOption[];
  }

  set(key: string, value: string | null): void {
    const next = { ...this.values(), [key]: value ?? null };
    this.values.set(next);
    this.changed.emit(next);
  }

  reset(): void {
    const next: FilterValues = {};
    for (const f of this.fields()) next[f.key] = null;
    this.values.set(next);
    this.changed.emit(next);
  }
}
