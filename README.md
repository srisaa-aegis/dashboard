# stl-dashboard

A sales-pipeline dashboard for Angular (PrimeNG + Chart.js + Tailwind). One package with three layers:

```
src/
  core/              pure TypeScript, no Angular: models, formatters, chart-data builders, aggregation
  components/        the child widgets, one folder each (each has its own index.ts and README)
    stat-card/         KPI tile
    chart-card/        titled card around a Chart.js chart
    data-table/        paginated, column-driven, clickable table
    filter-bar/        dropdown filters + Reset
    drilldown-dialog/  modal with a data-table and a summary line
  dashboard/         the dashboard component: composes the widgets, owns drill-down
  index.ts           public API (core + components + dashboard)
demo/                the hosting app (index.html + main.ts + data/*.js); dashboard.js is the built bundle
scripts/build-demo.js
test/                Jest tests for src/core
```

The dashboard is purely presentational: it does no HTTP and no routing. The host passes data in and handles events.
The widgets know nothing about each other except `drilldown-dialog`, which uses `data-table`.

## Demo (no server needed)

```bash
npm install
npm run demo        # builds demo/dashboard.js, then open demo/index.html
```

`demo/index.html` opens straight from disk (`file://`). All demo data lives in `demo/data/*.js`: edit and refresh.
`demo/main.ts` + `demo/app.component.ts` are the host app, `demo/demo-data.service.ts` is its fake back-end (it filters and
aggregates the data with `filterOpportunities`, `buildPipeline` and `buildOrders` from `src/core`).
`dashboard.js`, `dashboard.css` and `media/` are generated; re-run `npm run demo` after changing anything under `src/` or `demo/*.ts`.

## Scripts

| Script | |
|---|---|
| `npm run demo` | build the demo bundle (Angular compile + one classic-script bundle) |
| `npm test` | Jest tests for the pure core |
| `npm run typecheck` | core + Angular template type-check of the demo and library |
| `npm run build` | build the library with ng-packagr into `dist/` |

## Use it in an app

```ts
import { DashboardComponent } from 'stl-dashboard';
```
```html
<sd-dashboard
  [pipeline]="pipeline()" [orders]="orders()" [loading]="loading()" [filterOptions]="filterOptions()"
  (filtersChange)="reload($event)" (opportunityClick)="open($event)" (newOpportunity)="create()" />
```

| Input | Type | Notes |
|---|---|---|
| `pipeline` | `PipelineData \| null` | summary, byStage, byBu, byCloseMonth, opportunities |
| `orders` | `OrdersData \| null` | summary, byBu, byMonth, byMonthBu, opportunities |
| `loading` | `boolean` | |
| `filterOptions` | `DashboardFilterOptions` | business units, stages, owners |
| `title`, `subtitle`, `newButtonLabel` | `string` | empty `newButtonLabel` hides the button |
| `now` | `Date \| null` | reference date for close-month colouring; defaults to today |

| Output | Payload |
|---|---|
| `filtersChange` | `{ buId, stage, ownerId }`: the host filters and re-supplies data |
| `opportunityClick` | opportunity id |
| `newOpportunity` | none |

Types are in `src/core/models.ts`. Money is integer **paise**.

### Core only

```ts
import { buildPipeline, buildOrders, filterOpportunities, formatCrores } from 'stl-dashboard';
```
`buildPipeline(rows)` / `buildOrders(rows)` turn flat opportunity rows into the shapes the dashboard consumes; useful for a server
or for tests.

### Host requirements
- Angular 19+, `primeng` 19+, `chart.js` 4+, a PrimeNG theme (`providePrimeNG`), `provideAnimationsAsync()`, PrimeIcons CSS.
- **Tailwind**: the widgets use Tailwind utility classes. Add the library to your Tailwind `content`:
  `'./node_modules/stl-dashboard/dist/**/*.mjs'`.

## License

MIT, see [LICENSE](LICENSE).
