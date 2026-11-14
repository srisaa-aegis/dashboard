import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

export type TagSeverity = 'info' | 'success' | 'warn' | 'danger' | 'secondary' | 'contrast';

export interface TableColumn<T> {
  header: string;
  /** Property to display when `value` is not given. */
  field?: keyof T & string;
  /** Custom text for the cell. */
  value?: (row: T) => string;
  align?: 'left' | 'right';
  bold?: boolean;
  /** Render the cell as a PrimeNG tag with this severity. */
  tag?: (row: T) => TagSeverity;
  /** Extra Tailwind classes for the cell. */
  cellClass?: (row: T) => string;
}

/** Paginated table whose columns are described by data. Rows are clickable. */
@Component({
  selector: 'sd-data-table',
  standalone: true,
  imports: [TableModule, TagModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-table
      [value]="asArray(rows())"
      styleClass="p-datatable-sm"
      [paginator]="true"
      [rows]="rowsPerPage()"
      [rowsPerPageOptions]="rowsPerPageOptions()"
    >
      <ng-template pTemplate="header">
        <tr>
          @for (c of columns(); track c.header) {
            <th [class.text-right]="c.align === 'right'">{{ c.header }}</th>
          }
        </tr>
      </ng-template>
      <ng-template pTemplate="body" let-row>
        <tr class="cursor-pointer hover:bg-gray-50" (click)="rowClick.emit(row)">
          @for (c of columns(); track c.header) {
            <td [class]="cellClasses(c, row)">
              @if (c.tag) {
                <p-tag [value]="text(c, row)" [severity]="c.tag(row)" />
              } @else {
                {{ text(c, row) }}
              }
            </td>
          }
        </tr>
      </ng-template>
      <ng-template pTemplate="emptymessage">
        <tr>
          <td [attr.colspan]="columns().length" class="text-center text-gray-400 py-8">{{ emptyMessage() }}</td>
        </tr>
      </ng-template>
    </p-table>
  `,
})
export class DataTableComponent<T extends object = Record<string, unknown>> {
  readonly rows = input.required<readonly T[]>();
  readonly columns = input.required<readonly TableColumn<T>[]>();
  readonly rowsPerPage = input<number>(20);
  readonly rowsPerPageOptions = input<number[]>([10, 20, 50]);
  readonly emptyMessage = input<string>('No records found');
  readonly rowClick = output<T>();

  asArray(rows: readonly T[]): T[] {
    return rows as T[];
  }

  text(c: TableColumn<T>, row: T): string {
    if (c.value) return c.value(row);
    if (!c.field) return '';
    const v: unknown = row[c.field];
    return v === null || v === undefined || v === '' ? '-' : String(v);
  }

  cellClasses(c: TableColumn<T>, row: T): string {
    return [c.align === 'right' ? 'text-right' : '', c.bold ? 'font-medium' : '', c.cellClass?.(row) ?? '']
      .filter(Boolean)
      .join(' ');
  }
}
