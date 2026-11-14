# drilldown-dialog

Modal showing a data-table of the rows behind a chart segment, with a summary line. Depends on `data-table`.

Selector: `sd-drilldown-dialog`

```html
<sd-drilldown-dialog [(visible)]="open" title="Stage: Lead" [rows]="rows" [columns]="cols" summary="3 items" />
```

API: visible (two-way), title, rows, columns, summary, width, emptyMessage; output rowClick


