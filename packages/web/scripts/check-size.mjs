#!/usr/bin/env node
// The size budget for the no-build browser bundle (RFC 0033 §7.3): the gzipped
// `dist/primitiv-web.js`, core included, must stay within BUDGET. Run after
// `pnpm build`; CI runs it on every change to the package.
import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";

const BUDGET = Number(process.env.PRIMITIV_WEB_BUDGET ?? 3072);
const file = new URL("../dist/primitiv-web.js", import.meta.url);
const raw = readFileSync(file);
const gzipped = gzipSync(raw, { level: 9 }).length;

console.log(`primitiv-web.js: ${raw.length} B minified, ${gzipped} B gzipped (budget ${BUDGET} B)`);
if (gzipped > BUDGET) {
  console.error(`over budget by ${gzipped - BUDGET} B`);
  process.exit(1);
}
