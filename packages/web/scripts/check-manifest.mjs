#!/usr/bin/env node
// Every tag the package defines must appear in the generated Custom Elements
// Manifest (RFC 0033 §5.6.4), which editors, Storybook and framework type
// generators read. The analyzer can only see a tag through its
// `@customElement` JSDoc, so a new element missing that tag would silently
// drop out of every tool; this fails the build instead. Run after `pnpm build`.
import { readdirSync, readFileSync } from "node:fs";

const manifest = JSON.parse(readFileSync(new URL("../dist/custom-elements.json", import.meta.url), "utf8"));
// Every component's elements module: `src/<component>/elements.ts`.
const src = new URL("../src/", import.meta.url);
const sources = readdirSync(src, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .flatMap((entry) => {
    try {
      return [readFileSync(new URL(`${entry.name}/elements.ts`, src), "utf8")];
    } catch {
      return [];
    }
  });

const defined = sources.flatMap((source) =>
  [...source.matchAll(/^const \w+ = "(primitiv-[a-z-]+)";$/gm)].map((m) => m[1]),
);
const listed = new Set(
  manifest.modules.flatMap((module) => (module.declarations ?? []).map((d) => d.tagName)).filter(Boolean),
);
const missing = defined.filter((tag) => !listed.has(tag));

console.log(`custom-elements.json: ${listed.size} tag(s) for ${defined.length} defined`);
if (defined.length === 0 || missing.length > 0) {
  console.error(`missing from the manifest: ${missing.join(", ") || "(no tags found in source)"}`);
  process.exit(1);
}
