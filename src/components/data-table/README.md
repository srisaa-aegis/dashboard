# data-table

Paginated table described by `TableColumn<T>[]` (field or value fn, align, bold, tag severity, cell class). Rows are clickable.

Selector: `sd-data-table`

```html
<sd-data-table [rows]="rows" [columns]="cols" (rowClick)="open($event)" />
```

API: rows, columns, rowsPerPage, rowsPerPageOptions, emptyMessage; output rowClick


