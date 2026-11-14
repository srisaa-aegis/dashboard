// Turns the Angular build (ES modules + fetch) into a folder you can open by double-clicking index.html:
// one classic <script> bundle, one stylesheet, and the data/*.js files. Output: ../standalone/
import { build } from 'esbuild';
import { cpSync, mkdirSync, readdirSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(here, '../dist/standalone/browser');
const out = resolve(here, '../../standalone');

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

// 1. Bundle polyfills + app (+ any lazy chunks) into a single classic script.
await build({
  stdin: { contents: "import './polyfills.js';\nimport './main.js';\n", resolveDir: src, loader: 'js' },
  bundle: true,
  format: 'iife',
  minify: true,
  target: 'es2022',
  outfile: join(out, 'demo.js'),
  logLevel: 'warning',
});

// 2. Styles, fonts/icons and data files.
cpSync(join(src, 'styles.css'), join(out, 'demo.css'));
if (existsSync(join(src, 'media'))) cpSync(join(src, 'media'), join(out, 'media'), { recursive: true });
cpSync(join(src, 'data'), join(out, 'data'), { recursive: true });

// 3. A hand-written index.html with only classic scripts (module scripts and fetch are blocked on file://).
const dataScripts = readdirSync(join(out, 'data'))
  .filter((f) => f.endsWith('.js'))
  .map((f) => `<script src="data/${f}"></script>`)
  .join('\n');
writeFileSync(
  join(out, 'index.html'),
  `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>@srisaa/dashboard demo</title>
<link rel="stylesheet" href="demo.css" />
</head>
<body>
<app-root></app-root>
${dataScripts}
<script src="demo.js"></script>
</body>
</html>
`,
);
console.log('Standalone demo written to', out);
