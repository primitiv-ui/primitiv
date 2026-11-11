#!/usr/bin/env node
// Every tag the package defines must appear in the generated Custom Elements
// Manifest (RFC 0033 §5.6.4), which editors, Storybook and framework type
// generators read. The analyzer can only see a tag through its
// `@customElement` JSDoc, so a new element missing that tag would silently
// drop out of every tool; this fails the build instead. Run after `pnpm build`.
import { readFileSync } from "node:fs";

const manifest = JSON.parse(readFileSync(new URL("../dist/custom-elements.json", import.meta.url), "utf8"));
// Every tag the package defines, as its own `define…()` functions define them:
// each runs against a registry that only records the names. (The elements are
// safe to import without a DOM, so this needs none.)
const entry = await import(new URL("../dist/index.js", import.meta.url).href);
const defined = [];
const recorder = { get: () => undefined, define: (name) => defined.push(name) };
for (const [name, value] of Object.entries(entry)) {
  if (name.startsWith("define") && typeof value === "function") value(recorder);
}
const listed = new Set(
  manifest.modules.flatMap((module) => (module.declarations ?? []).map((d) => d.tagName)).filter(Boolean),
);
const missing = defined.filter((tag) => !listed.has(tag));

console.log(`custom-elements.json: ${listed.size} tag(s) for ${defined.length} defined`);
if (defined.length === 0 || missing.length > 0) {
  console.error(`missing from the manifest: ${missing.join(", ") || "(no tags found in source)"}`);
  process.exit(1);
}
