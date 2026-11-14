/*
 * Names every `@primitiv-ui/icons` glyph by the opening of its paths, so the
 * docs can replace an inline `<svg>` in Elements markup with a comment naming
 * the icon that belongs there (src/lib/icon-placeholders.ts).
 *
 *   node scripts/gen-icon-names.mjs           # write
 *   node scripts/gen-icon-names.mjs --check   # fail if the committed file is stale
 *
 * A glyph is recognised by the first characters of each of its paths, which
 * tells apart the icons that share an outline (info, success and error are one
 * circle). Generated rather than read at runtime because the code tabs render
 * in the browser, where there is no filesystem.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const icons = resolve(here, "../../../packages/icons/icons/svg");
const out = resolve(here, "../src/content/icon-names.generated.json");

const pathKey = (svg) => [...svg.matchAll(/\sd="([^"]{0,16})/g)].map((m) => m[1]).join("|");

const names = Object.fromEntries(
  readdirSync(icons)
    .filter((file) => file.endsWith(".svg"))
    .sort()
    .map((file) => [pathKey(readFileSync(join(icons, file), "utf8")), file.slice(0, -4)]),
);
const json = `${JSON.stringify(names, null, 2)}\n`;

if (process.argv.includes("--check")) {
  if (readFileSync(out, "utf8") !== json) {
    console.error("icon-names.generated.json is stale: run `pnpm gen:icon-names`.");
    process.exit(1);
  }
} else {
  writeFileSync(out, json);
  console.log(`wrote ${out}`);
}
