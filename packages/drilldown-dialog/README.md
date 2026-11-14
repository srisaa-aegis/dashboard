# @srisaa/drilldown-dialog

Modal showing a data-table of the rows behind a chart segment, with a summary line. Depends on `@srisaa/data-table`.

Selector: `sd-drilldown-dialog`

```html
<sd-drilldown-dialog [(visible)]="open" title="Stage: Lead" [rows]="rows" [columns]="cols" summary="3 items" />
```

API: visible (two-way), title, rows, columns, summary, width, emptyMessage; output rowClick

Peer deps: Angular 19+, PrimeNG 19+. Uses Tailwind utility classes: add this package's `dist` to your Tailwind `content`.

Build: `npm run build` (ng-packagr) -> `dist/`.
