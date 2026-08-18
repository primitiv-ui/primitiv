import { test, expect, type Page } from "@playwright/test";

/*
 * Real-browser proof for the tabular-figures fix
 * (docs/interface-audit.md, `better-typography`: numbers that change must not
 * shift layout — `font-variant-numeric: tabular-nums` on Pagination, Data Table
 * and the Carousel progress text).
 *
 * Why a browser test: whether the declaration does anything depends on the
 * *rendered face*, not the CSS. The shipped body face (Asta Sans) draws
 * proportional figures by default — `1` is 48.8 units against `4`'s 61.5 at
 * 100px — but does implement `tnum`, so the declaration works. The shipped
 * heading face (Khand) implements no `tnum` at all, so the same declaration
 * would be inert anywhere Khand renders. Nothing but laying out digits in a real
 * engine distinguishes those cases, and the audit initially recorded the fix as
 * inert on exactly that mistake.
 *
 * This is the guard for a font-pair coupling, like the Prose measure test: swap
 * the body face for one without `tnum` and these numbers start shifting again
 * with the stylesheets untouched. That failure should be loud.
 *
 * Not covered: `.primitiv-carousel__progress-text`. It is a contract part a
 * consumer applies themselves rather than something the wrapper renders, so the
 * kitchen-sink has no instance of it to measure.
 *
 * Run: cd apps/kitchen-sink && ./node_modules/.bin/playwright test --project=chromium
 */

const NARROW = "1111111111";
const WIDE = "8888888888";

/**
 * Widths of a narrow- and a wide-digit run measured in `selector`'s own
 * inherited text context, so the reading includes whatever font and
 * font-variant-numeric that element actually resolves.
 */
async function digitRuns(page: Page, selector: string) {
  return page.evaluate(
    ({ selector, NARROW, WIDE }) => {
      const el = document.querySelector(selector);
      if (!el) throw new Error(`no element matched ${selector}`);
      const probe = document.createElement("span");
      probe.style.cssText = "position:absolute;white-space:pre;visibility:hidden";
      el.appendChild(probe);
      const widthOf = (text: string) => {
        probe.textContent = text;
        return probe.getBoundingClientRect().width;
      };
      const narrow = widthOf(NARROW);
      const wide = widthOf(WIDE);
      probe.remove();
      return { narrow, wide, fontFamily: getComputedStyle(el).fontFamily };
    },
    { selector, NARROW, WIDE },
  );
}

test.describe("tabular figures", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 1000 });
    await page.goto("/");
    // The whole measurement is font-dependent, so the real face must have loaded
    // — against a fallback every number here describes the wrong typeface.
    await page.evaluate(() => document.fonts.ready);
  });

  for (const [name, selector] of [
    ["Pagination", ".primitiv-pagination"],
    ["Data Table", ".primitiv-data-table"],
  ] as const) {
    test(`${name} advances every figure equally`, async ({ page }) => {
      const { narrow, wide, fontFamily } = await digitRuns(page, selector);
      expect(wide, `${name} renders in ${fontFamily}`).toBeCloseTo(narrow, 1);
    });
  }

  test("the declaration is doing the work — the body default still shifts", async ({ page }) => {
    // Without this, the suite would pass just as happily on a font whose figures
    // are uniform anyway, and would stop testing our own fix. Body text carries
    // no tabular-nums, so it must still be proportional.
    const { narrow, wide } = await digitRuns(page, "body");
    expect(Math.abs(wide - narrow)).toBeGreaterThan(1);
  });
});
