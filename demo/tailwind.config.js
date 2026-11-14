/** The dashboard packages use Tailwind utility classes, so their built output must be scanned too. */
module.exports = {
  content: ['./src/**/*.{html,ts}', '../packages/*/dist/**/*.mjs'],
  theme: { extend: {} },
  plugins: [],
};
