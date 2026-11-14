/*
 * The Utilities page's data (RFC 0034), from the utility classes the CLI emits.
 *
 *   node scripts/gen-utilities.mjs           # write
 *   node scripts/gen-utilities.mjs --check   # fail if the committed file is stale
 *
 * Reads `src/styles/primitiv/utilities.css`, the copy `primitiv utilities`
 * writes (and the token-drift workflow guards), so the page lists exactly what
 * the file holds. Each class is grouped by the property it sets, and its
 * responsive variants are listed once, with the breakpoint each one starts at.
 * Nothing here decides which classes exist: that is the emitter's table.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const CSS = readFileSync(resolve(here, "../src/styles/primitiv/utilities.css"), "utf8");
const OUT = resolve(here, "../src/content/utilities.generated.json");

/* The sections, in page order, and the first property that puts a class in one. */
const SECTIONS = [
  { id: "display", title: "Display", properties: ["display"] },
  {
    id: "flex-and-grid",
    title: "Flex and grid",
    properties: ["flex-direction", "flex-wrap", "align-items", "justify-content", "flex", "flex-shrink", "min-inline-size", "grid-template-columns"],
  },
  {
    id: "spacing",
    title: "Spacing",
    properties: ["gap", "padding", "padding-inline", "padding-block", "padding-block-start", "margin", "margin-inline", "margin-block-start", "margin-block-end"],
  },
  { id: "size", title: "Width and height", properties: ["inline-size", "max-inline-size", "block-size"] },
  { id: "text", title: "Text", properties: ["color", "font-family", "font-weight", "text-align", "overflow"] },
  {
    id: "surface",
    title: "Surface, border, radius and shadow",
    properties: ["background-color", "border-width", "border-color", "border-radius", "box-shadow"],
  },
  { id: "accessibility", title: "Accessibility", properties: ["position"] },
];

const rule = /^ {2}\.([^\s{]+) \{ (.+) \}$/;
const media = /^ {2}@media \(min-width: ([^)]+)\) \{$/;
const variant = /^ {4}\.(\w+)\\:([^\s{]+) \{/;

const sections = SECTIONS.map(({ id, title }) => ({ id, title, classes: [] }));
const breakpoints = [];
const responsive = new Set();
let current = null;

for (const line of CSS.split("\n")) {
  const opened = media.exec(line);
  if (opened) {
    current = { min: opened[1] };
    continue;
  }
  const responsiveRule = variant.exec(line);
  if (responsiveRule) {
    if (!current.name) breakpoints.push(Object.assign(current, { name: responsiveRule[1] }));
    responsive.add(responsiveRule[2]);
    continue;
  }
  const match = rule.exec(line);
  if (!match) continue;
  const [, name, body] = match;
  const declarations = body.split(/;\s*/).filter(Boolean);
  const property = declarations[0].split(":")[0];
  const section = SECTIONS.findIndex((s) => s.properties.includes(property));
  if (section === -1) throw new Error(`No section on the Utilities page for .${name} (${property})`);
  sections[section].classes.push({ name, declarations });
}

for (const section of sections) {
  for (const entry of section.classes) entry.responsive = responsive.has(entry.name);
}

const json = `${JSON.stringify({ sections, breakpoints }, null, 1)}\n`;

if (process.argv.includes("--check")) {
  if (readFileSync(OUT, "utf8") !== json) {
    console.error("utilities.generated.json is stale: run `pnpm gen:utilities`.");
    process.exit(1);
  }
} else {
  writeFileSync(OUT, json);
  const count = sections.reduce((n, s) => n + s.classes.length, 0);
  console.log(`wrote ${OUT} (${count} classes, ${responsive.size} responsive)`);
}
