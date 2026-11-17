#!/usr/bin/env node
// The size budget for the no-build browser bundles (RFC 0033 §7.3): each
// per-component `dist/cdn/<component>.js`, with the chunks it loads, must stay
// within BUDGET, and the all-in-one `dist/primitiv-web.js` (core included)
// within BUDGET per component it defines — it carries every component by design,
// so it grows with each one; the per-component files are what a page pays for
// one. Run after `pnpm build`; CI runs it on every change to the package.
import { readdirSync, readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";

// 4.5 KB per component since Navigation Menu (RFC 0033 §7.3): eight elements,
// hover intent, a shared viewport and published geometry come to 4.2 KB with
// their chunks, after Dropdown had already taken the opening 3 KB to 4 KB.
const BUDGET = Number(process.env.PRIMITIV_WEB_BUDGET ?? 4608);
// Carousel alone carries its own ceiling (RFC 0033 §7.3): eleven elements over
// two scroll engines — native scroll-snap sync, and the infinite loop's
// transform track with drag, fling and seam copies — plus autoplay and the
// progress properties React writes, came to 9.1 KB, twice any other component.
// Doubling the shared budget for it would stop the gate meaning anything for
// the rest, and splitting the loop into a second file is what Dropdown's
// submenus were spared.
const OWN_BUDGETS = { "carousel.js": 10240 };
const budgetFor = (name) => OWN_BUDGETS[name] ?? BUDGET;
const components = readdirSync(new URL("../src/define/", import.meta.url)).filter(
  (file) => file.endsWith(".ts") && file !== "index.ts",
).length;
const bundleBudget =
  BUDGET * components + Object.values(OWN_BUDGETS).reduce((extra, own) => extra + own - BUDGET, 0);
const file = new URL("../dist/primitiv-web.js", import.meta.url);
const raw = readFileSync(file);
const gzipped = gzipSync(raw, { level: 9 }).length;

console.log(
  `primitiv-web.js: ${raw.length} B minified, ${gzipped} B gzipped (budget ${bundleBudget} B for ${components} components)`,
);
let over = gzipped > bundleBudget;
if (over) console.error(`over budget by ${gzipped - bundleBudget} B`);

// Each per-component CDN file (`dist/cdn/<component>.js`) is held to the same
// budget, counting the shared chunks it imports, since a page loading one
// component downloads all of them.
const cdn = new URL("../dist/cdn/", import.meta.url);
const chunkImports = (code) =>
  [...code.matchAll(/from\s*"\.\/(chunks\/[^"]+)"/g)].map(([, path]) => path);
for (const name of readdirSync(cdn).filter((file) => file.endsWith(".js"))) {
  const entry = readFileSync(new URL(name, cdn));
  const files = [entry, ...chunkImports(entry.toString()).map((path) => readFileSync(new URL(path, cdn)))];
  const size = files.reduce((total, code) => total + gzipSync(code, { level: 9 }).length, 0);
  console.log(`cdn/${name}: ${size} B gzipped with its chunks (budget ${budgetFor(name)} B)`);
  if (size > budgetFor(name)) {
    console.error(`cdn/${name} is over budget by ${size - budgetFor(name)} B`);
    over = true;
  }
}
if (over) process.exit(1);
