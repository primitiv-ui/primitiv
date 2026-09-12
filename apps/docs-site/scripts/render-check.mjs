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
     any element whose content is wider than the box it sits in.
     `overflow: visible` is the first filter — an element that scrolls or clips
     is doing so deliberately.

     HORIZONTAL ONLY, and that is a conclusion rather than an oversight — it was
     extended to the vertical axis and reverted the same hour. `scrollHeight`
     exceeds `clientHeight` on essentially every piece of trimmed type in this
     codebase, because the registry uses `text-box-trim`: measured on the home
     page, the hero heading reads 24px over a 112px box and a proof figure 11
     over 64, both correct on screen. The magnitudes scale with font-size, so
     they are LARGER than real defects — the colour sheet's clipped swatch was
     4px — and no threshold separates them. A precise clipping detector (a child
     whose rect leaves a `hidden` ancestor's rect) was also tried: quiet, but it
     missed that same swatch, because the clipper was the grandparent. A vertical
     clip needs the screenshot this script can already take.

     The second filter is an ancestor the USER CAN SCROLL, and without it this
     cried wolf on real designs: a Code Block with `wrap={false}` scrolls at its
     `<pre>` on purpose (an anatomy tree's aligned trailing `//` annotations ARE
     its content), and the `<code>` and every `token-line` inside that `<pre>`
     are then wider than their box with visible overflow — six flags per page
     for one intended scroller. `Table`'s scroll area is the same.

     `auto`/`scroll` ONLY, never `hidden`, and that distinction is the whole
     thing: `hidden` clips, so content is being silently cut off, which is the
     defect this check exists to find. A first pass excused any non-visible
     ancestor and went green on the very bug it had just caught — the playground
     control grid sits inside a `Card`, whose `overflow: hidden` clips media to
     the corner radius, so "someone above handles it" was false. Verified in
     both directions afterwards: reverted CSS fails, fixed CSS passes.

     A scrollable ancestor counts whether or not IT currently measures as
     overflowing. `overflow-x: auto` is an author saying "scroll this if it does
     not fit", so anything inside is intended; requiring the ancestor to overflow
     too left a Code Block's own `<code>` flagged under a `<pre>` that was
     already handling it.

     The third filter is an element with NO CHILDREN AND NO TEXT: it has nothing
     that can be clipped, so a few pixels of difference there is the box model,
     not content. `Slider`'s 18px thumb measured 22 — its 2px border each side —
     and reported on every thumb on the page. */
  const overflowing = await page.evaluate((sel) => {
    const root = sel
      ? document.querySelector(`section[aria-labelledby="${sel}"], section[aria-label="${sel}"]`)
      : document.body;
    if (!root) return [];
    const insideScroller = (el) => {
      for (let p = el.parentElement; p && p !== root; p = p.parentElement) {
        const { overflowX } = getComputedStyle(p);
        if (overflowX === "auto" || overflowX === "scroll") return true;
      }
      return false;
    };
    /* Nothing inside to clip — see the note above on Slider's thumb. */
    const empty = (el) => el.children.length === 0 && el.textContent.trim() === "";
    return [...root.querySelectorAll("*")]
      .filter(
        (el) =>
          el.scrollWidth > el.clientWidth + 1 &&
          getComputedStyle(el).overflow === "visible" &&
          !insideScroller(el) &&
          !empty(el),
      )
      .slice(0, 8)
      .map((el) => `${el.tagName.toLowerCase()}.${el.className || "(no class)"}`.slice(0, 70));
  }, section);

  /*
   * WCAG 2.1 SC 1.4.10 Reflow (AA), tested directly: content must reflow without
   * requiring scrolling in TWO dimensions at a width equivalent to 320 CSS
   * pixels — the width a 1280px viewport reaches at 400% zoom, which is why 320
   * is the number and why it is a conformance floor rather than a nice-to-have.
   *
   * This is the criterion itself, and it is stricter and far less ambiguous than
   * the element scan above: a page can have elements overflowing their boxes
   * while the document does not scroll (an ancestor clips them — a different
   * defect, content cut off), and a page can scroll horizontally with no single
   * element flagged. So both run.
   *
   * The SC's exception is "parts of the content which require two-dimensional
   * layout for usage or meaning" — a data table, a diagram, a toolbar. The
   * accepted technique for those is an internal scroll container, which keeps
   * the PAGE one-dimensional, so this assertion is the right one to hold
   * unconditionally.
   */
  const reflow = await page.evaluate(() => {
    const d = document.documentElement;
    return d.scrollWidth > d.clientWidth + 1
      ? { over: d.scrollWidth - d.clientWidth, width: d.clientWidth }
      : null;
  });

  if (out) {
    fs.mkdirSync(out, { recursive: true });
    const file = path.join(out, `${section ?? "page"}-${scheme}-${width}.png`);
    await target.screenshot({ path: file });
    console.log(`  shot ${file}`);
  }

  const ok = !errors.length && !broken.length && !overflowing.length && !reflow;
  console.log(`${ok ? "✓" : "✗"} ${width}px ${scheme}${motion === "reduce" ? " reduced-motion" : ""}`);
  for (const e of errors) console.log(`    error    ${e}`);
  for (const b of broken) console.log(`    request  ${b}`);
  if (reflow) {
    console.log(
      `    reflow   WCAG 1.4.10: the page scrolls horizontally — ` +
        `${reflow.width}px viewport needs ${reflow.width + reflow.over}px`,
    );
  }
  for (const o of overflowing) console.log(`    overflow ${o}`);
  if (!ok) failed = true;

  await context.close();
}

await browser.close();
process.exit(failed ? 1 : 0);
