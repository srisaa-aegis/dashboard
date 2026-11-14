# @srisaa/dashboard

The pipeline dashboard. Depends on all the other packages. See the root README for inputs and outputs.

Selector: `sd-dashboard`

```html
<sd-dashboard [pipeline]="p" [orders]="o" [filterOptions]="f" />
```

API: see root README

Peer deps: Angular 19+, PrimeNG 19+. Uses Tailwind utility classes: add this package's `dist` to your Tailwind `content`.

Build: `npm run build` (ng-packagr) -> `dist/`.
