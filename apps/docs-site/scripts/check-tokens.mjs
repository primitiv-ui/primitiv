/*
 * Guards this app's three CSS rules. All three fail SILENTLY in a browser,
 * which is why they need a script rather than review.
 *
 * 1. No phantom tokens. A `var(--primitiv-…)` that does not exist resolves to
 *    nothing and the declaration is dropped — the page looks subtly wrong with
 *    no error. The most dangerous of the three, because reaching for a token
 *    *feels* like doing the right thing. (Real example caught by this:
 *    `--primitiv-overline-md-font-size`, where the overline family turns out to
 *    be unsized.)
 *
 * 2. No magic numbers. A bare length is only allowed in a `--docs-*`
 *    declaration, so the site's own layout constants are named and appear once.
 *
 * 3. Every selector is `docs-` prefixed. This is the cost of choosing global
 *    CSS over modules: a bare element or attribute selector leaks onto every
 *    page in the app, which is a bug the workbench has actually shipped. The
 *    prefix is the only thing preventing it, so it is enforced rather than
 *    trusted.
 *
 * Run: node scripts/check-tokens.mjs
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const REGISTRY_STYLES = join("styles", "primitiv");

/**
 * The only selectors allowed to go unprefixed, and only in the two app-level
 * global sheets. `html`/`body`/`:root` are document-level by definition (and
 * `:root` is the only place a token can be re-pointed); the form controls are
 * here because no browser inherits `font` into them, so an app that sets a
 * document font MUST restate it for controls or they render in the system face
 * beside correctly-typeset text.
 */
const DOCUMENT_SELECTORS = new Set([
  "html",
  "body",
  ":root",
  "button",
  "input",
  "select",
  "textarea",
]);

/** Confining the exception to these files stops it spreading. */
const GLOBAL_SHEETS = new Set(["src/app/document.css", "src/app/fonts.css"]);

/**
 * A reset is global by definition, so this one file may use any bare element
 * selector. It is confined to `@layer primitiv.reset` (the lowest layer), so
 * nothing in it can out-rank a component rule.
 */
const RESET_SHEET = "src/app/reset.css";

const defined = new Set();
for (const f of ["tokens.css", "primitiv-base.css"]) {
  const txt = readFileSync(join(ROOT, "src", REGISTRY_STYLES, f), "utf8");
  for (const m of txt.matchAll(/(--primitiv-[\w-]+)\s*:/g)) defined.add(m[1]);
}

/** Every .css under src/, excluding the add-managed registry stylesheets. */
const sheets = [];
const walk = (dir) => {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) {
      if (p.includes(REGISTRY_STYLES)) continue;
      walk(p);
    } else if (entry.endsWith(".css")) {
      sheets.push(p);
    }
  }
};
walk(join(ROOT, "src"));

const problems = [];
for (const sheet of sheets) {
  const rel = relative(ROOT, sheet).split(sep).join("/");
  const lines = readFileSync(sheet, "utf8").split("\n");

  let inComment = false;
  lines.forEach((line, i) => {
    const at = `${rel}:${i + 1}`;

    // Track /* … */ blocks so prose in a header comment is never linted.
    if (inComment) {
      if (line.includes("*/")) inComment = false;
      return;
    }
    if (/^\s*\/\*/.test(line) && !line.includes("*/")) {
      inComment = true;
      return;
    }
    const code = line.replace(/\/\*.*?\*\//g, "");
    if (!code.trim()) return;

    // (1) phantom tokens
    for (const m of code.matchAll(/var\((--primitiv-[\w-]+)/g)) {
      if (!defined.has(m[1])) problems.push(`${at}  phantom token ${m[1]}`);
    }

    // (2) magic numbers — allowed only when declaring a --docs-* constant
    if (!/^\s*--docs-/.test(code) && !/@media|@container|@supports/.test(code)) {
      for (const m of code.matchAll(/(?<![\w-])(\d*\.?\d+)(rem|px|em)(?![\w-])/g)) {
        problems.push(
          `${at}  bare length ${m[1]}${m[2]} — use a token or a --docs-* constant`,
        );
      }
    }

    // (3) selector prefix. A selector line ends in `{` and is not an at-rule.
    if (/\{\s*$/.test(code) && !/^\s*@/.test(code)) {
      const selector = code.replace(/\{\s*$/, "").trim();
      for (const part of selector.split(",")) {
        const s = part.trim();
        if (!s) continue;
        // Document-root and bare form-control selectors are the deliberate
        // exception: the prefix rule exists to stop a selector LEAKING between
        // pages, and a document-level default is global on purpose. Confined to
        // src/app/document.css so it cannot spread.
        if (rel === RESET_SHEET) continue;
        if (DOCUMENT_SELECTORS.has(s) && GLOBAL_SHEETS.has(rel)) continue;
        // Otherwise every compound must be anchored by a .docs-* class, so
        // `.docs-x code` is fine but a bare `code` is not.
        if (!/\.docs-[\w-]+/.test(s)) {
          problems.push(`${at}  unprefixed selector "${s}" — must include a .docs-* class`);
        }
      }
    }
  });
}

if (problems.length) {
  console.error(`✗ ${problems.length} problem(s):\n`);
  for (const p of problems) console.error("  " + p);
  process.exit(1);
}
console.log(
  `✓ ${sheets.length} stylesheet(s): every --primitiv-* reference resolves ` +
    `(of ${defined.size} defined), no bare lengths outside --docs-* constants, ` +
    `every selector docs-prefixed.`,
);
