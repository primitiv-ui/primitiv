/*
 * Generates the eight content pages' data from the Figma builder's `PAGES`.
 *
 *   node scripts/gen-content-pages.mjs           # write
 *   node scripts/gen-content-pages.mjs --check   # fail if the committed file is stale
 *
 * Why generate rather than author the pages in TSX: `scripts/figma/
 * docs-content-pages.js` already holds every page as data — eyebrow, title,
 * lede, and sections of short block tuples — and
 * `scripts/figma/verify-docs-content-pages.mjs` already proves that data matches
 * the sixteen settled Figma frames. Retyping 85 paragraphs into components would
 * create a third copy of the copy, free to drift from both the canvas and the
 * markdown it came from. So the Figma builder's `PAGES` is the one
 * machine-readable source, and both renderers read it: Figma by being pasted
 * into `figma_execute`, the site through this generator.
 *
 * `PAGES` is a plain top-level `const` in a file whose remaining statements
 * touch the `figma` global, so the slice between `const PAGES` and `const ALL`
 * is evaluated on its own rather than importing the module.
 *
 * Two things happen here that the renderer then does not have to:
 *
 * - **Link labels become real hrefs.** The Figma data carries only the label
 *   ("Tokens and theming →"), because a canvas link goes nowhere. `ROUTES` maps
 *   every one, and an unmapped label throws — so adding a next-step link to a
 *   page fails loudly here rather than rendering a dead link on the site.
 * - **Headings get ids.** Each section's first block is its `h2`, and its text
 *   is the matching `toc` entry (asserted below, all eight pages). That is what
 *   lets the TOC, the `aria-labelledby` and the anchor all come from one string.
 */

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const BUILDER = resolve(here, "../../../scripts/figma/docs-content-pages.js");
const OUT = resolve(here, "../src/content/pages.generated.json");

/** Route for each page key — the order is the order they appear in the nav. */
const PAGE_ROUTES = {
  "start-here": "/start-here/",
  "what-primitiv-is": "/concepts/what-primitiv-is/",
  tokens: "/concepts/tokens/",
  density: "/concepts/density/",
  composition: "/concepts/composition/",
  accessibility: "/concepts/accessibility/",
  "registry-cli": "/registry-cli/",
  figma: "/figma/",
};

/**
 * Every link label the pages use, mapped to its destination.
 *
 * Keyed by the label with the trailing arrow and whitespace stripped, so the
 * `links` form ("Design in Figma →") and the `doors` form ("Design in Figma")
 * resolve through the same entry.
 */
const ROUTES = {
  Components: "/components/",
  "Browse components": "/components/",
  "Tokens and theming": "/concepts/tokens/",
  Density: "/concepts/density/",
  "Density and the Context tier": "/concepts/density/",
  Composition: "/concepts/composition/",
  Accessibility: "/concepts/accessibility/",
  "The registry and CLI": "/registry-cli/",
  "Design in Figma": "/figma/",
};

const href = (label) => {
  const key = label.replace(/\s*→\s*$/, "").trim();
  const route = ROUTES[key];
  if (!route) {
    throw new Error(
      `No route for the link label ${JSON.stringify(label)}. Add it to ROUTES ` +
        `in scripts/gen-content-pages.mjs, or fix the label in ` +
        `scripts/figma/docs-content-pages.js.`,
    );
  }
  return route;
};

/** `The four parts` → `the-four-parts`. The heading text is the anchor. */
const slug = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const readPages = () => {
  const src = readFileSync(BUILDER, "utf8");
  const start = src.indexOf("const PAGES = {");
  const end = src.indexOf("const ALL = Object.keys(PAGES);");
  if (start < 0 || end < 0) {
    throw new Error(`Could not find the PAGES literal in ${BUILDER}`);
  }
  return new Function(`${src.slice(start, end)}; return PAGES;`)();
};

/**
 * The Prism language for a code block, since the Figma data carries none.
 *
 * Every block on the eight pages is one of five shapes and the discriminators
 * are unambiguous — a shell transcript prefixes every line with `$ `, JSX opens
 * with a capitalised tag while HTML opens with a lowercase one. `text` is for
 * the one block that is not source at all (`radius = height × 0.1875`), where
 * highlighting would colour an equation as if it were code. An `language` in
 * the block's options wins, for anything a future page adds that this misses.
 */
const detectLanguage = (code) => {
  const lines = code.split("\n").filter((l) => l.trim() !== "");
  if (lines.every((l) => l.startsWith("$ "))) return "bash";
  if (code.trimStart().startsWith("{")) return "json";
  if (/^[.#:][\w-]/.test(code.trimStart()) && code.includes("{")) return "css";
  if (/^<[a-z]/.test(code.trimStart())) return "html";
  if (/^<[A-Z]|\bimport\b/.test(code.trimStart())) return "tsx";
  return "text";
};

/* Blocks pass through as-is apart from the two that need resolving: link labels
   become { label, href } pairs, and a `gap` keeps only what the site uses. */
const convert = (block) => {
  const [kind] = block;
  if (kind === "links") {
    return { kind, links: block[1].map((l) => ({ label: l.replace(/\s*→\s*$/, ""), href: href(l) })) };
  }
  if (kind === "doors") {
    return {
      kind,
      doors: block[1].map(([label, description]) => ({ label, href: href(label), description })),
    };
  }
  if (kind === "gap") return { kind, id: block[1], job: block[4] };
  if (kind === "group") return { kind, gap: block[1], blocks: block[2].map(convert) };
  if (kind === "p") return { kind, text: block[1], code: block[2] ?? [] };
  if (kind === "block") {
    return { kind, heading: block[1], text: block[2], code: block[3] ?? [] };
  }
  if (kind === "code") {
    const o = block[2] ?? {};
    return {
      kind,
      code: block[1],
      language: o.language ?? detectLanguage(block[1]),
      /* Figma's `tabbed` is its Code Block's `Show Header` boolean, and the
         header is what carries the copy control here too. */
      header: o.tabbed === true,
      lineNumbers: o.lineNumbers === true,
    };
  }
  if (kind === "alert") return { kind, tone: block[1], text: block[2] };
  if (kind === "defs") {
    return { kind, defs: block[1].map(([term, description]) => ({ term, description })) };
  }
  if (kind === "flags") {
    return { kind, flags: block[1].map(([flag, description]) => ({ flag, description })) };
  }
  if (kind === "h2" || kind === "h3" || kind === "h4") return { kind, text: block[1] };
  throw new Error(`Unknown block kind ${JSON.stringify(kind)}`);
};

const convertPage = (key, page) => {
  const sections = page.sections.map((section, i) => {
    const [heading] = section.blocks;
    if (heading[0] !== "h2") {
      throw new Error(`${key} section ${i} does not open with an h2`);
    }
    if (heading[1] !== page.toc[i]) {
      throw new Error(
        `${key} section ${i}: heading ${JSON.stringify(heading[1])} does not match ` +
          `its toc entry ${JSON.stringify(page.toc[i])}`,
      );
    }
    return {
      id: slug(heading[1]),
      title: heading[1],
      /* The h2 becomes the section's own heading element, so it is dropped from
         the block list rather than rendered twice. */
      blocks: section.blocks.slice(1).map(convert),
    };
  });

  return {
    key,
    route: PAGE_ROUTES[key],
    name: page.name,
    eyebrow: page.eyebrow,
    title: page.title,
    lede: page.lede,
    head: (page.head ?? []).map(convert),
    sections,
    /* Desktop-only two-column rows: an illustration beside the `count` blocks
       above it. Carried through so the site can make the same pairing. */
    pairs: page.pairs ?? [],
  };
};

const build = () => {
  const pages = readPages();
  const missing = Object.keys(pages).filter((k) => !PAGE_ROUTES[k]);
  if (missing.length > 0) {
    throw new Error(`No route for page(s) ${missing.join(", ")} — add them to PAGE_ROUTES.`);
  }
  const ordered = Object.keys(PAGE_ROUTES).map((key) => convertPage(key, pages[key]));
  return `${JSON.stringify(ordered, null, 2)}\n`;
};

const json = build();

if (process.argv.includes("--check")) {
  const committed = readFileSync(OUT, "utf8");
  if (committed !== json) {
    const digest = (s) => createHash("sha256").update(s).digest("hex").slice(0, 12);
    console.error(
      `src/content/pages.generated.json is stale (committed ${digest(committed)}, ` +
        `generated ${digest(json)}).\nRun: pnpm gen:content`,
    );
    process.exit(1);
  }
  console.log("content pages up to date");
} else {
  writeFileSync(OUT, json);
  console.log(`wrote ${OUT}`);
}
