# Dashboard packages + demo

The sales-pipeline dashboard extracted from SrisaaERP into independent Angular packages, plus a demo host app.
This folder is its own npm run workspace, outside the ERP repo.

```
packages/
  stat-card/         @srisaa/stat-card          KPI tile
  chart-card/        @srisaa/chart-card         titled card around a Chart.js chart (PrimeNG p-chart)
  data-table/        @srisaa/data-table         paginated, column-driven, clickable table
  filter-bar/        @srisaa/filter-bar         dropdown filters + Reset
  drilldown-dialog/  @srisaa/drilldown-dialog   modal with a data-table and a summary line  (uses data-table)
  dashboard/         @srisaa/dashboard          the full dashboard                           (uses all of the above)
demo/                hosting app; ALL data comes from demo/public/data/*.js
```

Each package is built with ng-packagr (Ivy partial compilation) into its own `dist/`.
The dashboard is purely presentational: it does no HTTP and no routing. The host passes data in and handles events.

## Commands

```bash
npm install
npm run dev              # builds the packages, then serves the demo at http://localhost:4300
npm run build            # packages + demo
npm run build:standalone # (re)generates ./standalone, openable by double-click (see below)
npm run typecheck        # packages + demo (development build)
npm run test             # Jest unit tests for the dashboard's pure logic (formatters, chart builders)
```

Packages must be built before the demo (`npm run build:packages`; `dev`, `build` and `typecheck` do it for you), because the demo consumes their `dist/`.

## Run without a server

`standalone/index.html` is a self-contained build of the demo (like a plain HTML demo page): **double-click it** or open it in a browser, no server or install needed.
It is one classic-script bundle (`demo.js`), `demo.css` and the data files in `standalone/data/*.js`. Edit those data files and refresh to change what the dashboard shows.
Regenerate it after changing the packages or the demo code with `npm run build:standalone`; that overwrites `standalone/` from `demo/public/data/`, which is the source of truth for the data.

## Using the dashboard in an app

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
| `filtersChange` | `{ buId, stage, ownerId }` (host filters and re-supplies data) |
| `opportunityClick` | opportunity id |
| `newOpportunity` | – |

Types live in `packages/dashboard/src/lib/models.ts`. Money is integer **paise**.

### Host requirements
- Angular 19+, `primeng` 19+, `chart.js` 4+, a PrimeNG theme (`providePrimeNG`), `provideAnimationsAsync()`, PrimeIcons CSS.
- **Tailwind**: the components use Tailwind utility classes. Add the package output to your Tailwind `content`:
  `'./node_modules/@srisaa/*/dist/**/*.mjs'` (the demo uses `../packages/*/dist/**/*.mjs`).

## Demo data

`demo/public/data/`: `opportunities.js` (active pipeline), `orders.js` (won orders; `expectedCloseMonth` = booking month),
`filters.js` (BUs, stages, owners). `demo/src/app/demo-data.service.ts` reads them from `window.__DEMO_DATA__` (plain scripts, so `file://` works) and does the filtering and aggregation a
back-end would. Edit the data and refresh to see the dashboard change.
