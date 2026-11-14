# @srisaa/filter-bar

Row of dropdown filters plus Reset.

Selector: `sd-filter-bar`

```html
<sd-filter-bar [fields]="fields" [(values)]="values" (changed)="reload($event)" />
```

API: fields (FilterField[]), values (two-way); output changed

Peer deps: Angular 19+, PrimeNG 19+. Uses Tailwind utility classes: add this package's `dist` to your Tailwind `content`.

Build: `npm run build` (ng-packagr) -> `dist/`.
