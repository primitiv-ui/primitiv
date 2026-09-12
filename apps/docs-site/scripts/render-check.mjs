#!/usr/bin/env node
/*
 * Render a docs-site page in real Chromium, report what a browser actually
 * sees, and optionally screenshot a section.
 *
 * WHY THIS EXISTS
 * ---------------
 * `next build` does not surface render-time React errors, and `jsdom` never
 * loads a stylesheet — so neither the build nor a unit test can tell you that
 * a section renders at all, that an asset 404s, or that text overflows its
 * container. Every docs-site defect found on 2026-09-11/12 was caught by
 * looking at a real render: a duplicate caption baked into an asset, a glyph
 * centring against a three-line figure, a figure overflowing into a divider,
 * four dividers hanging beside stacked tiles, and a comment claiming
 * behaviour its CSS did not have.
 *
 * Playwright resolves from the repo root (`@playwright/test`), not from
 * apps/docs-site, so run this from the root.
 *
 * USAGE
 * -----
 *   pnpm --filter docs-site dev                 # or: next dev --port 4100
 *   node apps/docs-site/scripts/render-check.mjs [options]
 *
 *   --url <url>          default http://localhost:4100/
 *   --width <px>         default 1280 (pass twice for two passes)
 *   --scheme <l|d>       light | dark (default dark)
 *   --motion <r|n>       reduce | no-preference (default no-preference)
 *   --section <id>       aria-labelledby / aria-label to scope and shoot
 *   --out <dir>          screenshot directory (default: none, no screenshot)
 *
 * It exits non-zero if the page logs an error, a request 404s, or a scoped
 * section is missing — so it is usable as a gate, not only as an eyeball.
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/* The pinned build ships only the old-headless binary that current Chrome
   removed, so point at the standalone shell rather than `chrome`. */
const BIN = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : process.argv[i + 1];
};
const all = (name) =>
  process.argv.reduce((acc, v, i) => (v === `--${name}` ? [...acc, process.argv[i + 1]] : acc), []);

const url = arg("url", "http://localhost:4100/");
const widths = all("width").length ? all("width").map(Number) : [1280];
const scheme = arg("scheme", "dark").startsWith("l") ? "light" : "dark";
const motion = arg("motion", "no").startsWith("r") ? "reduce" : "no-preference";
const section = arg("section", null);
const out = arg("out", null);

const browser = await chromium.launch({ executablePath: BIN });
let failed = false;

for (const width of widths) {
  const context = await browser.newContext({
    viewport: { width, height: 1000 },
    colorScheme: scheme,
    reducedMotion: motion,
  });
  const page = await context.newPage();

  const errors = [];
  const broken = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error") errors.push(`console: ${m.text()}`); });
  page.on("response", (r) => {
    if (r.status() >= 400) broken.push(`${r.status()} ${new URL(r.url()).pathname}`);
  });

  await page.goto(url, { waitUntil: "networkidle" });

  let target = page;
  if (section) {
    const locator = page.locator(
      `section[aria-labelledby="${section}"], section[aria-label="${section}"]`,
    );
    if ((await locator.count()) === 0) {
      console.error(`✗ ${width}px — no section matching "${section}"`);
      failed = true;
      await context.close();
      continue;
    }
    await locator.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    target = locator;
  }

  /* Overflow is the defect class a screenshot catches and properties do not:
     any element whose text is wider or taller than the box it sits in. */
  const overflowing = await page.evaluate((sel) => {
    const root = sel
      ? document.querySelector(`section[aria-labelledby="${sel}"], section[aria-label="${sel}"]`)
      : document.body;
    if (!root) return [];
    return [...root.querySelectorAll("*")]
      .filter((el) => el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflow === "visible")
      .slice(0, 8)
      .map((el) => `${el.tagName.toLowerCase()}.${el.className || "(no class)"}`.slice(0, 70));
  }, section);

  if (out) {
    fs.mkdirSync(out, { recursive: true });
    const file = path.join(out, `${section ?? "page"}-${scheme}-${width}.png`);
    await target.screenshot({ path: file });
    console.log(`  shot ${file}`);
  }

  const ok = !errors.length && !broken.length && !overflowing.length;
  console.log(`${ok ? "✓" : "✗"} ${width}px ${scheme}${motion === "reduce" ? " reduced-motion" : ""}`);
  for (const e of errors) console.log(`    error    ${e}`);
  for (const b of broken) console.log(`    request  ${b}`);
  for (const o of overflowing) console.log(`    overflow ${o}`);
  if (!ok) failed = true;

  await context.close();
}

await browser.close();
process.exit(failed ? 1 : 0);
