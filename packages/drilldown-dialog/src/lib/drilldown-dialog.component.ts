import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { DataTableComponent, TableColumn } from '@srisaa/data-table';

/** Modal that lists the rows behind a chart segment, with a one-line summary. */
@Component({
  selector: 'sd-drilldown-dialog',
  standalone: true,
  imports: [DialogModule, DataTableComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-dialog [header]="title()" [(visible)]="visible" [modal]="true" [style]="{ width: width() }">
      <sd-data-table
        [rows]="rows()"
        [columns]="columns()"
        [rowsPerPage]="10"
        [emptyMessage]="emptyMessage()"
        (rowClick)="rowClick.emit($event)"
      />
      @if (summary()) {
        <div class="mt-3 text-sm text-gray-500">{{ summary() }}</div>
      }
    </p-dialog>
  `,
})
export class DrilldownDialogComponent<T extends object = Record<string, unknown>> {
  readonly visible = model<boolean>(false);
  readonly title = input<string>('');
  readonly rows = input.required<readonly T[]>();
  readonly columns = input.required<readonly TableColumn<T>[]>();
  readonly summary = input<string>('');
  readonly width = input<string>('900px');
  readonly emptyMessage = input<string>('No records for this selection');
  readonly rowClick = output<T>();
}
