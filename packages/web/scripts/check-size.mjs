#!/usr/bin/env node
// The size budget for the no-build browser bundle (RFC 0033 §7.3): the gzipped
// `dist/primitiv-web.js`, core included, must stay within BUDGET, and so must
// each per-component `dist/cdn/<component>.js` with the chunks it loads. Run after
// `pnpm build`; CI runs it on every change to the package.
import { readdirSync, readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";

const BUDGET = Number(process.env.PRIMITIV_WEB_BUDGET ?? 3072);
const file = new URL("../dist/primitiv-web.js", import.meta.url);
const raw = readFileSync(file);
const gzipped = gzipSync(raw, { level: 9 }).length;

console.log(`primitiv-web.js: ${raw.length} B minified, ${gzipped} B gzipped (budget ${BUDGET} B)`);
let over = gzipped > BUDGET;
if (over) console.error(`over budget by ${gzipped - BUDGET} B`);

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
  console.log(`cdn/${name}: ${size} B gzipped with its chunks (budget ${BUDGET} B)`);
  if (size > BUDGET) {
    console.error(`cdn/${name} is over budget by ${size - BUDGET} B`);
    over = true;
  }
}
if (over) process.exit(1);
