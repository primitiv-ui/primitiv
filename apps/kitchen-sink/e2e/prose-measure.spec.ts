import { test, expect, type Page } from "@playwright/test";

/*
 * Real-browser proof for Prose's measure cap
 * (docs/interface-audit.md, `better-layout`/`better-typography`: cap the measure).
 *
 * Why a browser test, and why it counts characters rather than pixels: the cap is
 * `51ch`, and `ch` is the width of the "0" glyph in the *rendered* face. The
 * number of characters that actually fits therefore depends on the ratio between
 * that glyph and the average advance width of running text, which varies per
 * typeface — 0.747 for the shipped body face, so `65ch` would run ~87 characters.
 * Nothing short of laying out real text in a real engine can check that, and
 * asserting a pixel width would only restate the CSS.
 *
 * This is also the guard for a coupling nothing else catches: if the body font
 * pair changes, the ratio moves and the measure drifts out of the readable range
 * even though the stylesheet is untouched. That failure should be loud.
 *
 * Run: cd apps/kitchen-sink && ./node_modules/.bin/playwright test --project=chromium
 */

// The conventional readable range, and the whole point of the token.
const RANGE = { min: 60, max: 75 } as const;

const SAMPLE =
  "The palette engine resolves every swatch in OKLCH before it is written out, " +
  "which is what keeps a ramp's hue steady from its lightest step through to its " +
  "darkest one, and it is also why the gamut mapping has to run afterwards rather " +
  "than before: clamping a colour into sRGB changes its chroma, and a ramp that " +
  "was measured before that clamp is not the ramp anybody actually sees on their " +
  "screen. Measuring the rendered value is the only check that means anything.";

/**
 * Characters per rendered line for a paragraph in a flow region, optionally with
 * the measure cap applied. Counts real line breaks by walking a Range and
 * watching for the client rect's top edge to move.
 */
async function charsPerLine(page: Page, measure: boolean, sample: string) {
  return page.evaluate(
    ({ measure, sample }) => {
      const container = document.createElement("div");
      // The widest capped size, which is where an uncapped line is worst.
      container.className = "primitiv-container primitiv-container--lg";
      const flow = document.createElement("div");
      flow.className = measure ? "primitiv-flow primitiv-flow--measure" : "primitiv-flow";
      const p = document.createElement("p");
      p.textContent = sample;
      flow.appendChild(p);
      container.appendChild(flow);
      document.body.appendChild(container);

      const node = p.firstChild as Text;
      const range = document.createRange();
      const counts: number[] = [];
      let top: number | null = null;
      let run = 0;
      for (let i = 0; i < sample.length; i++) {
        range.setStart(node, i);
        range.setEnd(node, i + 1);
        const rect = range.getBoundingClientRect();
        if (rect.height === 0) continue;
        if (top === null) top = rect.top;
        if (Math.abs(rect.top - top) > 1) {
          counts.push(run);
          run = 0;
          top = rect.top;
        }
        run++;
      }
      container.remove();
      // Drop the last line: it ends the paragraph, so it is short by definition.
      return counts.slice(0, -1);
    },
    { measure, sample },
  );
}

test.describe("Prose measure cap", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1000 });
    await page.goto("/");
    // The cap is in `ch`, so the real face must be loaded before anything is
    // measured — against a fallback font every number here is wrong.
    await page.evaluate(() => document.fonts.ready);
  });

  test("a capped column lands in the readable range", async ({ page }) => {
    const lines = await charsPerLine(page, true, SAMPLE);
    expect(lines.length).toBeGreaterThan(1);
    // Per-line equality is the wrong assertion and an early version of this test
    // made it: ragged-right text breaks wherever the next word will not fit, so
    // individual lines legitimately run short (measured: 59 on one line of a
    // ~68-character column). What has to hold is that no line exceeds the
    // readable maximum, and that the column is not narrow on average.
    const sorted = [...lines].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    expect(Math.max(...lines)).toBeLessThanOrEqual(RANGE.max);
    expect(median).toBeGreaterThanOrEqual(RANGE.min);
  });

  test("without the modifier the column is uncapped — the cap is opt-in", async ({ page }) => {
    const lines = await charsPerLine(page, false, SAMPLE);
    // Not an endorsement of the uncapped width: this asserts that `.primitiv-flow`
    // alone still fills its parent, which is what lets a flow region wrap grids
    // and media without being squeezed into a reading column.
    expect(Math.max(...lines)).toBeGreaterThan(RANGE.max);
  });

  test("the cap is a knob, not a constant", async ({ page }) => {
    const narrowed = await page.evaluate(
      ({ sample }) => {
        const flow = document.createElement("div");
        flow.className = "primitiv-flow primitiv-flow--measure";
        flow.style.setProperty("--primitiv-prose-measure", "20ch");
        const p = document.createElement("p");
        p.textContent = sample;
        flow.appendChild(p);
        document.body.appendChild(flow);
        const width = p.getBoundingClientRect().width;
        flow.remove();
        return width;
      },
      { sample: SAMPLE },
    );
    const dflt = await page.evaluate(() => {
      const flow = document.createElement("div");
      flow.className = "primitiv-flow primitiv-flow--measure";
      document.body.appendChild(flow);
      const width = flow.getBoundingClientRect().width;
      flow.remove();
      return width;
    });
    expect(narrowed).toBeLessThan(dflt);
  });
});
