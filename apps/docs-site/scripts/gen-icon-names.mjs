/*
 * The docs site's icon data, from `@primitiv-ui/icons` itself:
 *
 * - `icon-names.generated.json` names every glyph by the opening of its paths,
 *   so the docs can replace an inline `<svg>` in Elements markup with a comment
 *   naming the icon that belongs there (src/lib/icon-placeholders.ts).
 * - `icons.generated.json` is the icon gallery (/icons/): each icon's name, its
 *   React export, and the plain SVG the package publishes in `svg/`.
 *
 *   node scripts/gen-icon-names.mjs           # write
 *   node scripts/gen-icon-names.mjs --check   # fail if a committed file is stale
 *
 * A glyph is recognised by the first characters of each of its paths, which
 * tells apart the icons that share an outline (info, success and error are one
 * circle). Generated rather than read at runtime because both are used in the
 * browser, where there is no filesystem.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const pkg = resolve(here, "../../../packages/icons");
const sources = join(pkg, "icons/svg");
const published = join(pkg, "svg");
const content = (name) => resolve(here, `../src/content/${name}`);

const pathKey = (svg) => [...svg.matchAll(/\sd="([^"]{0,16})/g)].map((m) => m[1]).join("|");

const files = readdirSync(sources)
  .filter((file) => file.endsWith(".svg"))
  .sort();

const names = Object.fromEntries(
  files.map((file) => [pathKey(readFileSync(join(sources, file), "utf8")), file.slice(0, -4)]),
);

/* The package's barrel, in file order, is the source of each React export
   name: a name can be overridden there (`grid` exports `GridIcon`). */
const exports = [...readFileSync(join(pkg, "src/icons/index.ts"), "utf8").matchAll(/export \{ (\w+) \}/g)].map(
  (m) => m[1],
);
if (exports.length !== files.length) {
  throw new Error(`The icons barrel exports ${exports.length} icons but icons/svg has ${files.length}.`);
}
const icons = files.map((file, i) => ({
  name: file.slice(0, -4),
  component: exports[i],
  svg: readFileSync(join(published, file), "utf8").trim(),
}));

const outputs = [
  ["icon-names.generated.json", `${JSON.stringify(names, null, 2)}\n`],
  ["icons.generated.json", `${JSON.stringify(icons, null, 2)}\n`],
];

if (process.argv.includes("--check")) {
  for (const [file, json] of outputs) {
    if (readFileSync(content(file), "utf8") !== json) {
      console.error(`${file} is stale: run \`pnpm gen:icon-names\`.`);
      process.exit(1);
    }
  }
} else {
  for (const [file, json] of outputs) {
    writeFileSync(content(file), json);
    console.log(`wrote ${content(file)}`);
  }
}
