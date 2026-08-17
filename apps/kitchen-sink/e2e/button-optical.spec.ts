import { test, expect, type Page } from "@playwright/test";

/*
 * Real-browser proof for Button's optical icon inset
 * (docs/interface-audit.md finding 01, tokens `framed-control/{size}/icon-optical-inset`).
 *
 * Why a browser test and not a unit test: the rule is
 *
 *   .primitiv-button:has(> svg:first-child):has(> .primitiv-button__label)
 *
 * so it depends on real selector matching against real children AND on
 * `calc()` resolving a chain of custom properties down to a used value. jsdom
 * neither implements `:has()` layout effects nor computes `calc()` on custom
 * properties, so nothing below is observable there. This measures the used
 * padding the engine actually applies.
 *
 * The load-bearing assertion is the ICON-ONLY case. An icon-only button is its
 * own `:first-child` and `:last-child`, so without the
 * `:has(> .primitiv-button__label)` guard both rules would fire and a control
 * that must stay symmetric would pull in on both sides. That guard is the whole
 * reason the rule is written the way it is, and this is what proves it holds.
 *
 * Run: npx playwright test -c apps/kitchen-sink/playwright.config.ts --project=chromium
 */

type Padding = { start: number; end: number };

async function paddingOf(page: Page, testId: string): Promise<Padding> {
  return page.getByTestId(testId).evaluate((el) => {
    const cs = getComputedStyle(el);
    // Read the physical sides: the sheet sets the logical properties, but
    // getComputedStyle resolves them to used physical values in an LTR page.
    return { start: parseFloat(cs.paddingLeft), end: parseFloat(cs.paddingRight) };
  });
}

test.describe("Button optical icon inset", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("button-optical").waitFor();
  });

  test("a label-only button stays symmetric", async ({ page }) => {
    const { start, end } = await paddingOf(page, "btn-label-only");
    expect(start).toBeCloseTo(end, 1);
  });

  test("an icon-only button stays symmetric — the :has(label) guard holds", async ({ page }) => {
    const { start, end } = await paddingOf(page, "btn-icon-only");
    const base = await paddingOf(page, "btn-label-only");
    expect(start).toBeCloseTo(end, 1);
    // and it is the FULL padding, not the inset one: an icon-only control must
    // not shrink just because its only child is an svg.
    expect(start).toBeCloseTo(base.start, 1);
  });

  test("a leading icon pulls only the leading side in", async ({ page }) => {
    const base = await paddingOf(page, "btn-label-only");
    const { start, end } = await paddingOf(page, "btn-leading");
    expect(start).toBeLessThan(base.start);
    expect(end).toBeCloseTo(base.end, 1);
  });

  test("a trailing icon pulls only the trailing side in", async ({ page }) => {
    const base = await paddingOf(page, "btn-label-only");
    const { start, end } = await paddingOf(page, "btn-trailing");
    expect(end).toBeLessThan(base.end);
    expect(start).toBeCloseTo(base.start, 1);
  });

  test("icons on both sides pull both in, and stay symmetric", async ({ page }) => {
    const base = await paddingOf(page, "btn-label-only");
    const { start, end } = await paddingOf(page, "btn-both");
    expect(start).toBeLessThan(base.start);
    expect(end).toBeLessThan(base.end);
    expect(start).toBeCloseTo(end, 1);
  });

  test("the inset equals the token, not an arbitrary nudge", async ({ page }) => {
    const base = await paddingOf(page, "btn-label-only");
    const { start } = await paddingOf(page, "btn-leading");
    // Resolve what the token layer says the inset should be at the rendered size,
    // so this asserts the wiring rather than a hard-coded pixel count — it keeps
    // holding if the density mode or the token's value changes.
    const expected = await page.getByTestId("btn-leading").evaluate((el) => {
      const raw = getComputedStyle(el)
        .getPropertyValue("--primitiv-button-icon-optical-inset")
        .trim();
      // The custom property resolves to a length (rem); convert via a probe so
      // the comparison is in the same px units as the padding read above.
      const probe = document.createElement("div");
      probe.style.cssText = `position:absolute;visibility:hidden;width:${raw}`;
      el.appendChild(probe);
      const px = probe.getBoundingClientRect().width;
      probe.remove();
      return px;
    });
    expect(expected).toBeGreaterThan(0);
    expect(base.start - start).toBeCloseTo(expected, 1);
  });
});
