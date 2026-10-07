#!/usr/bin/env node
// Post-build pass over a library's `tsc` output so npm consumers can load it
// anywhere — a bundler, a Next.js Server Component, or plain Node.
//
// 1. Fully specifies relative imports. Our source mixes `./Tabs.ts` (JSR needs
//    the extension; `tsc` rewrites it to `.js`) with extensionless `./types`,
//    which bundlers resolve but Node's ESM loader rejects — and Vite SSR,
//    test runners and scripts all load node_modules through Node. Every
//    relative specifier becomes `./x.js` or `./x/index.js`, in both the `.js`
//    and `.d.ts` files (`tsc` leaves `.ts` specifiers in declarations as-is).
// 2. With `--client`, prepends `"use client";` to every module except the pure
//    re-export barrels, so an App Router page can import the package directly.
//    Barrels stay unmarked: Next rejects `export *` inside a client boundary,
//    and the boundary forms at the leaf module a barrel re-exports from anyway.
//
// Usage: node scripts/finalize-dist.mjs <distDir> [--client]
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const [dist, ...flags] = process.argv.slice(2);
if (!dist) throw new Error("usage: finalize-dist.mjs <distDir> [--client]");
const client = flags.includes("--client");

const specifier = /(\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)(["'])(\.{1,2}\/[^"']*)\2/g;
const reexport = /^export (\*|\{[^}]*\}|type \{[^}]*\}) from ["'][^"']+["'];$/;

function fullySpecified(file, raw) {
  if (/\.(js|json|css)$/.test(raw)) return raw;
  // `tsc` rewrites `.ts`/`.tsx` specifiers in `.js` output but not in `.d.ts`.
  const spec = raw.replace(/\.tsx?$/, "");
  const base = join(dirname(file), spec);
  if (existsSync(`${base}.js`)) return `${spec}.js`;
  if (existsSync(join(base, "index.js"))) return `${spec}/index.js`;
  throw new Error(`${file}: cannot resolve "${spec}"`);
}

function isBarrel(source) {
  const lines = source.split("\n").map((line) => line.trim()).filter(Boolean);
  return lines.every((line) => reexport.test(line) || line === "export {};");
}

let rewritten = 0;
let marked = 0;
for (const entry of readdirSync(dist, { recursive: true })) {
  const file = join(dist, entry);
  const isJs = file.endsWith(".js");
  if (!isJs && !file.endsWith(".d.ts")) continue;
  const original = readFileSync(file, "utf8");
  let source = original.replace(
    specifier,
    (_, lead, quote, spec) => `${lead}${quote}${fullySpecified(file, spec)}${quote}`,
  );
  if (source !== original) rewritten++;
  if (client && isJs && !isBarrel(source) && !source.startsWith('"use client"')) {
    source = `"use client";\n${source}`;
    marked++;
  }
  if (source !== original) writeFileSync(file, source);
}
console.log(`${dist}: fully specified imports in ${rewritten} file(s)${client ? `, marked ${marked} client module(s)` : ""}`);
