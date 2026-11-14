/*
 * The token reference page's data: every design token, by category, with the
 * value the token layer gives it in each mode.
 *
 *   node scripts/gen-token-reference.mjs           # write
 *   node scripts/gen-token-reference.mjs --check   # fail if the committed file is stale
 *
 * Categories come from the DTCG source (`packages/tokens/src/*.json`): its
 * files and top-level groups are already the system's own taxonomy. Values come
 * from the emitted layer this site ships (`src/styles/primitiv/tokens.css`), so
 * the page shows exactly what a stylesheet reads — an alias as the
 * `var(--primitiv-…)` it emits, a literal as its converted unit — and nothing
 * here converts a value. A source token with no emitted property fails the run.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../../..");
const SOURCE = (file) => JSON.parse(readFileSync(resolve(root, "packages/tokens/src", file), "utf8"));
const CSS = readFileSync(resolve(here, "../src/styles/primitiv/tokens.css"), "utf8");
const REGISTRY = JSON.parse(readFileSync(resolve(root, "registry/registry.json"), "utf8")).components;
const OUT = resolve(here, "../src/content/token-reference.generated.json");

/* ── The emitted layer, one map per block ─────────────────────────────────── */

const blocks = {};
for (const [, selector, body] of CSS.matchAll(/\n {2}([^{}\n][^{}]*?)\s*\{([^{}]*)\}/g)) {
  const key = selector.replace(/\s+/g, " ").trim();
  const values = (blocks[key] ??= {});
  for (const [, name, value] of body.matchAll(/(--primitiv-[\w-]+):\s*([^;]+);/g)) values[name] = value.trim();
}
const block = (selector) => {
  const found = blocks[selector];
  if (!found) throw new Error(`tokens.css has no ${selector} block`);
  return found;
};
const BASE = block(":root");
const THEME = { light: block(':root, [data-theme="light"]'), dark: block('[data-theme="dark"]') };
const DENSITY = {
  dense: block('[data-density="dense"]'),
  compact: block('[data-density="compact"]'),
  comfortable: block(':root, [data-density="comfortable"]'),
  spacious: block('[data-density="spacious"]'),
};

/* ── The source, as leaves ────────────────────────────────────────────────── */

function* leaves(node, path = []) {
  if (node && typeof node === "object" && "$value" in node) {
    yield { path, type: node.$type ?? null };
    return;
  }
  for (const [key, child] of Object.entries(node ?? {})) if (!key.startsWith("$")) yield* leaves(child, [...path, key]);
}

const property = (path) => `--primitiv-${path.join("-")}`;

const missing = [];
const valueIn = (map, name) => {
  if (!(name in map)) missing.push(name);
  return map[name] ?? "";
};

/** Tokens of one source, grouped by `groupOf(path)`, valued in every mode. */
const collect = ({ file, mode, modes, groupOf, include = () => true }) => {
  const data = SOURCE(file);
  const source = mode ? data[mode] : data;
  const groups = new Map();
  for (const { path, type } of leaves(source)) {
    if (!include(path)) continue;
    const name = property(path);
    const title = groupOf(path);
    if (!groups.has(title)) groups.set(title, []);
    groups.get(title).push({ name, type, values: modes.map((map) => valueIn(map, name)) });
  }
  return [...groups].map(([title, tokens]) => ({ title, tokens }));
};

const one = [BASE];
const themes = [THEME.light, THEME.dark];
const densities = [DENSITY.dense, DENSITY.compact, DENSITY.comfortable, DENSITY.spacious];

const isComponent = (group) =>
  group in REGISTRY || Object.keys(REGISTRY).some((name) => group.startsWith(`${name}-`));

const primitives = (groups) => (path) => groups.includes(path[0]);

const sections = [
  {
    id: "colour-palette",
    title: "Colour palette",
    intro:
      "The raw ramps every colour role points at, one family each. Reach for a role below rather than a step here: a role follows the theme and keeps its contrast, a step does not.",
    modes: ["Light", "Dark"],
    groups: collect({ file: "palette.json", mode: "light", modes: themes, groupOf: (p) => (p.length > 2 ? p[1] : "absolute") }),
  },
  {
    id: "colour-roles",
    title: "Colour roles",
    intro:
      "What a colour is for: surfaces, text, borders, actions and feedback. These are the tokens a stylesheet uses, and each one changes with the theme (`data-theme`).",
    modes: ["Light", "Dark"],
    groups: collect({ file: "intent.json", mode: "light", modes: themes, groupOf: (p) => p[0] }),
  },
  {
    id: "spacing-and-size",
    title: "Spacing, size, radius and borders",
    intro: "The fixed scales. A step's name is its size in pixels at the default root font size, so `--primitiv-space-16` is `1rem`.",
    modes: ["Value"],
    groups: collect({
      file: "primitives.json",
      modes: one,
      groupOf: (p) => p[0],
      include: primitives(["space", "size", "radii", "border-width"]),
    }),
  },
  {
    id: "typography",
    title: "Typography",
    intro: "The type primitives. Text styles that change with density are under Type and layout.",
    modes: ["Value"],
    groups: collect({
      file: "primitives.json",
      modes: one,
      groupOf: (p) => p[0],
      include: primitives(["font-family", "font-weight", "font-size", "font-style", "line-height", "letter-spacing"]),
    }),
  },
  {
    id: "opacity-and-interaction",
    title: "Opacity and interaction",
    intro: "The opacity scale, and the state treatments built on it.",
    modes: ["Value"],
    groups: [
      ...collect({ file: "primitives.json", modes: one, groupOf: (p) => p[0], include: primitives(["opacity"]) }),
      ...collect({ file: "interaction.json", modes: one, groupOf: () => "interaction" }),
    ],
  },
  {
    id: "elevation",
    title: "Elevation",
    intro: "Shadows. `--primitiv-elevation-*` names a depth; `--primitiv-shadow-*` is the ramp it draws from.",
    modes: ["Value"],
    groups: collect({ file: "elevation.json", modes: one, groupOf: (p) => p[0] }),
  },
  {
    id: "motion",
    title: "Motion",
    intro: "Durations, easings, and the transitions named for what they move.",
    modes: ["Value"],
    groups: collect({ file: "motion.json", modes: one, groupOf: (p) => p[0] }),
  },
  {
    id: "breakpoints",
    title: "Breakpoints",
    intro: "Custom properties cannot be read inside a media query, so these are for reference: write the value itself in `@media`.",
    modes: ["Value"],
    groups: collect({ file: "breakpoint.json", modes: one, groupOf: (p) => p[0] }),
  },
  {
    id: "type-and-layout",
    title: "Type and layout",
    intro:
      "Text styles, control geometry and flow spacing. Each changes with density: set `data-density` on any container, and everything inside it follows.",
    modes: ["Dense", "Compact", "Comfortable", "Spacious"],
    groups: collect({
      file: "context.json",
      mode: "comfortable",
      modes: densities,
      groupOf: (p) => p[0],
      include: (p) => !isComponent(p[0]),
    }),
  },
  {
    id: "component-tokens",
    title: "Component tokens",
    intro:
      "The tokens one component reads, by density. Primitiv's stylesheets use these; restyle a component through its own custom properties, listed on its page, rather than overriding these.",
    modes: ["Dense", "Compact", "Comfortable", "Spacious"],
    groups: collect({
      file: "context.json",
      mode: "comfortable",
      modes: densities,
      groupOf: (p) => p[0],
      include: (p) => isComponent(p[0]),
    }).sort((a, b) => a.title.localeCompare(b.title)),
  },
];

if (missing.length) {
  throw new Error(`tokens.css emits no property for ${missing.length} source token(s): ${missing.slice(0, 10).join(", ")}`);
}

const json = `${JSON.stringify({ sections }, null, 1)}\n`;

if (process.argv.includes("--check")) {
  if (readFileSync(OUT, "utf8") !== json) {
    console.error("token-reference.generated.json is stale: run `pnpm gen:token-reference`.");
    process.exit(1);
  }
} else {
  writeFileSync(OUT, json);
  const count = sections.reduce((n, s) => n + s.groups.reduce((m, g) => m + g.tokens.length, 0), 0);
  console.log(`wrote ${OUT} (${count} tokens)`);
}
