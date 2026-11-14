# filter-bar

Row of dropdown filters plus Reset.

Selector: `sd-filter-bar`

```html
<sd-filter-bar [fields]="fields" [(values)]="values" (changed)="reload($event)" />
```

API: fields (FilterField[]), values (two-way); output changed


