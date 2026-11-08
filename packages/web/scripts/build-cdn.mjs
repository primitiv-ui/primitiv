#!/usr/bin/env node
// The per-component browser files for pages with no build step (RFC 0033 §7.3):
// `dist/cdn/<component>.js` defines that component's elements and nothing else.
//
//   <script type="module"
//     src="https://cdn.jsdelivr.net/npm/@primitiv-ui/web@<version>/dist/cdn/tabs.js"></script>
//
// One esbuild run over every `src/define/<component>.ts`, with code splitting,
// so what components share (@primitiv-ui/core) lands once in `dist/cdn/chunks/`
// and each component file imports it by a relative URL. A page loading two
// components fetches the shared code once, and the relative imports resolve on
// any static host or CDN with no import map. `dist/primitiv-web.js` remains the
// everything-in-one-file option.
import { readdirSync } from "node:fs";
import { build } from "esbuild";

const define = new URL("../src/define/", import.meta.url);
const components = readdirSync(define).filter((file) => file.endsWith(".ts") && file !== "index.ts");

await build({
  entryPoints: components.map((file) => new URL(file, define).pathname),
  outdir: new URL("../dist/cdn/", import.meta.url).pathname,
  chunkNames: "chunks/[name]-[hash]",
  bundle: true,
  splitting: true,
  format: "esm",
  minify: true,
  target: "es2022",
});
console.log(`dist/cdn: ${components.map((file) => file.replace(/\.ts$/, ".js")).join(", ")}`);
