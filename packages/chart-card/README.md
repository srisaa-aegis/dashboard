# @srisaa/chart-card

Titled card around a Chart.js chart (PrimeNG p-chart). Click handling goes in the Chart.js `options.onClick`.

Selector: `sd-chart-card`

```html
<sd-chart-card title="By stage" type="bar" [data]="data" [options]="opts" [hasData]="true" />
```

API: title, type (bar|pie|doughnut|line), data, options, height, hasData, emptyText

Peer deps: Angular 19+, PrimeNG 19+. Uses Tailwind utility classes: add this package's `dist` to your Tailwind `content`.

Build: `npm run build` (ng-packagr) -> `dist/`.
