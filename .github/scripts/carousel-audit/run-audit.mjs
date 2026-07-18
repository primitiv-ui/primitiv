// Drives the REAL, built Carousel Builder (apps/kitchen-sink) through a
// pairwise-combinatorial set of its variant axes, checking after each one
// that something is actually visible and nothing threw — then writes a
// results.json + a self-contained report.html for a human to skim (screenshot
// thumbnails included) and re-run.
//
// This is a Chromium-only structural/logic smoke test: it catches thrown
// errors, wrongly-hidden slides, and collapsed layout, but NOT iOS-Safari-only
// rendering/compositing bugs (several of which this investigation already hit)
// — a real device pass is still the final word.
//
// Usage: AUDIT_BASE_URL=http://localhost:4174 node run-audit.mjs <out-dir>
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { generatePairwiseCases } from "./pairwise.mjs";
import { FACTORS, DEFAULTS, APPLICATION_ORDER, CONTROLS } from "./factors.mjs";
import { renderReport } from "./report.mjs";

const baseURL = process.env.AUDIT_BASE_URL ?? "http://localhost:4174";
const outDir = process.argv[2] ?? "./carousel-audit-out";
const screenshotsDir = path.join(outDir, "screenshots");

async function applyAxis(page, axis, value) {
  const control = CONTROLS[axis];
  if (!control) throw new Error(`no control mapping for axis "${axis}"`);
  if (control.kind === "radio-group") {
    // The fieldset's accessible name is its <legend>'s full text content, which
    // can carry an appended " — <hint/note>" (an em dash — RadioField shows a
    // live hint, or a reason when the field is disabled for the current
    // combination) — an exact match on the bare legend would miss it whenever
    // that's showing. Match the legend followed by either end-of-string or that
    // exact separator — NOT a bare prefix match, which would make "radius" also
    // match the unrelated "radius (container)" legend (a literal, non-hint
    // parenthetical suffix some other legends use to disambiguate themselves).
    const escaped = control.legend.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    await page
      .getByRole("group", { name: new RegExp(`^${escaped}($| \\u2014 )`) })
      .getByRole("radio", { name: value, exact: true })
      .click({ force: true, timeout: 5000 });
  } else if (control.kind === "checkbox") {
    if (value === "true") {
      await page
        .getByRole("checkbox", { name: control.label, exact: true })
        .click({ force: true, timeout: 5000 });
    }
  } else if (control.kind === "range") {
    await page
      .locator(`label:has-text("${control.labelText}") input[type=range]`)
      .first()
      .fill(value, { timeout: 5000 });
  } else {
    throw new Error(`unknown control kind "${control.kind}" for axis "${axis}"`);
  }
}

async function runCase(page, index, testCase) {
  const consoleErrors = [];
  const pageErrors = [];
  const onConsole = (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  };
  const onPageError = (err) => pageErrors.push(err.message);
  page.on("console", onConsole);
  page.on("pageerror", onPageError);

  const delta = {};
  for (const axis of APPLICATION_ORDER) {
    if (testCase[axis] !== DEFAULTS[axis]) delta[axis] = testCase[axis];
  }

  const record = {
    index,
    delta,
    fullCase: testCase,
    appliedOk: true,
    applyError: null,
    anySlideVisible: false,
    slideCount: 0,
    consoleErrors: [],
    pageErrors: [],
    screenshot: null,
    pass: false,
  };

  try {
    await page.goto(`${baseURL}/carousel/builder`, { waitUntil: "load", timeout: 20000 });
    // The builder mounts async (React root + accordion animation); wait for a
    // known-stable landmark before driving controls.
    await page.getByRole("group", { name: "placement", exact: true }).waitFor({ timeout: 10000 });

    for (const axis of APPLICATION_ORDER) {
      if (testCase[axis] === DEFAULTS[axis]) continue;
      await applyAxis(page, axis, testCase[axis]);
    }

    // Settle: CSS transitions (glide, accordion), the infinite engine's
    // ResizeObserver re-home, and React's own re-render all need a beat.
    await page.waitForTimeout(600);

    const inspect = await page.evaluate(() => {
      const slides = [...document.querySelectorAll("[data-carousel-slide][data-index]")];
      const results = slides.map((el) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return {
          visible:
            r.width > 0 &&
            r.height > 0 &&
            cs.visibility !== "hidden" &&
            cs.display !== "none" &&
            cs.opacity !== "0",
        };
      });
      return {
        slideCount: slides.length,
        anySlideVisible: results.some((r) => r.visible),
      };
    });
    record.slideCount = inspect.slideCount;
    record.anySlideVisible = inspect.anySlideVisible;

    const shotName = `case-${String(index).padStart(3, "0")}.png`;
    const carousel = page.locator(".primitiv-carousel").first();
    if (await carousel.count()) {
      await carousel.screenshot({ path: path.join(screenshotsDir, shotName) }).catch(() => {});
      record.screenshot = shotName;
    }
  } catch (err) {
    record.appliedOk = false;
    record.applyError = err instanceof Error ? err.message : String(err);
  }

  page.off("console", onConsole);
  page.off("pageerror", onPageError);
  record.consoleErrors = consoleErrors;
  record.pageErrors = pageErrors;
  record.pass =
    record.appliedOk &&
    record.slideCount > 0 &&
    record.anySlideVisible &&
    record.pageErrors.length === 0;

  return record;
}

async function main() {
  await mkdir(screenshotsDir, { recursive: true });

  let cases = generatePairwiseCases(FACTORS);
  console.log(`Generated ${cases.length} pairwise cases.`);
  // Optional cap for a fast smoke run (e.g. iterating on the script itself) —
  // unset for the real audit, which is fast enough (~30 cases, under a
  // minute) to always run in full.
  if (process.env.AUDIT_LIMIT) cases = cases.slice(0, Number(process.env.AUDIT_LIMIT));

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 500, height: 900 } });

  const results = [];
  for (let i = 0; i < cases.length; i++) {
    process.stdout.write(`case ${i + 1}/${cases.length}... `);
    const record = await runCase(page, i, cases[i]);
    console.log(record.pass ? "PASS" : "FAIL");
    results.push(record);
  }

  await browser.close();

  const passCount = results.filter((r) => r.pass).length;
  await writeFile(
    path.join(outDir, "results.json"),
    JSON.stringify({ generatedAt: new Date().toISOString(), passCount, total: results.length, results }, null, 2),
  );
  await writeFile(path.join(outDir, "index.html"), renderReport(results));

  console.log(`\n${passCount}/${results.length} cases passed.`);
  console.log(`Report written to ${path.join(outDir, "index.html")}`);

  if (passCount < results.length) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
