import { test, expect, type Page } from "@playwright/test";

/*
 * Real-browser proof for heading letter-spacing
 * (docs/interface-audit.md, `better-typography`; tokens
 * `heading/h{1..6}/letter-spacing`).
 *
 * The unit test at packages/tokens/src/heading-tracking.test.ts proves the alias
 * table is right. It cannot prove the table reaches an element, and the failure
 * mode there is silent: a `var()` naming a custom property that does not exist
 * makes the whole declaration invalid, which the engine drops — leaving normal
 * tracking and no error anywhere. A wrong `@layer` order does the same. So the
 * assertions below are about the WIRING, not the values:
 *
 *   1. the used letter-spacing equals the resolved token, at every level;
 *   2. at least one level is actually non-zero (a typo'd var name passes 1 by
 *      resolving to `normal` everywhere, so 1 alone is not enough);
 *   3. flipping `data-density` changes it, proving the mode blocks reach the
 *      element rather than only the `:root` default landing.
 *
 * Measured on injected CLASSLESS h1-h6, not the page's own headings: several
 * carry `.ks-*` classes that set their own tracking, and the base sheet is what
 * is under test here.
 *
 * Run: cd apps/kitchen-sink && ./node_modules/.bin/playwright test --project=chromium
 */

const LEVELS = [1, 2, 3, 4, 5, 6] as const;

type Reading = { level: number; used: number; token: number; declared: boolean };

/** Used vs token-resolved letter-spacing for a classless heading at each level. */
async function readTracking(page: Page, density?: string): Promise<Reading[]> {
  return page.evaluate((mode) => {
    if (mode) document.documentElement.dataset.density = mode;
    else delete document.documentElement.dataset.density;

    const host = document.createElement("div");
    host.id = "tracking-probe";
    document.body.appendChild(host);
    const out: Reading[] = [];
    for (const level of [1, 2, 3, 4, 5, 6]) {
      const h = document.createElement(`h${level}`);
      h.textContent = "Probe";
      host.appendChild(h);
      const cs = getComputedStyle(h);
      // `letter-spacing: normal` computes to the keyword, not a length.
      const raw = cs.letterSpacing;
      const used = raw === "normal" ? 0 : parseFloat(raw);
      // Resolve the token independently so the comparison is in the same px
      // units. Via `margin-left`, not a measured width: tracking is negative (a
      // negative width is invalid and measures 0) and a measured box is snapped
      // to Chromium's 1/64px layout grid, which reports -0.075rem as -1.1875px.
      // A computed margin is the unsnapped absolute length.
      const value = cs.getPropertyValue(`--primitiv-heading-h${level}-letter-spacing`).trim();
      const ruler = document.createElement("div");
      ruler.style.marginLeft = value || "0px";
      host.appendChild(ruler);
      const token = parseFloat(getComputedStyle(ruler).marginLeft);
      out.push({ level, used, token, declared: value !== "" });
    }
    host.remove();
    return out;
  }, density);
}

test.describe("heading letter-spacing", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.locator("h1").first().waitFor();
  });

  test("every level's used tracking is the token's value", async ({ page }) => {
    for (const readings of [
      await readTracking(page),
      await readTracking(page, "compact"),
      await readTracking(page, "spacious"),
      await readTracking(page, "dense"),
    ]) {
      expect(readings).toHaveLength(LEVELS.length);
      for (const { level, used, token, declared } of readings) {
        // Assert the property EXISTS before comparing values: a var() naming a
        // property that does not exist leaves the element at `normal`, and the
        // undeclared property reads as "" → 0, so `used === token` would hold
        // for a completely unwired level.
        expect(declared, `h${level} declares a letter-spacing token`).toBe(true);
        expect(used, `h${level}`).toBeCloseTo(token, 2);
      }
    }
  });

  test("the default density actually tracks — it is not normal all the way down", async ({
    page,
  }) => {
    const readings = await readTracking(page);
    const tracked = readings.filter((r) => r.used !== 0);
    expect(tracked.length).toBeGreaterThan(0);
    // Headings tighten; nothing here should be tracked open.
    for (const { level, used } of readings) expect(used, `h${level}`).toBeLessThanOrEqual(0);
  });

  test("switching data-density retunes it", async ({ page }) => {
    const h1 = async (density?: string) => (await readTracking(page, density))[0].used;
    const [dense, comfortable, spacious] = [await h1("dense"), await h1("comfortable"), await h1("spacious")];
    // Dense h1 is 18px and takes no tracking; Spacious h1 is 88px and takes the
    // most. If the mode blocks were not reaching the element these would be equal.
    expect(dense).toBe(0);
    expect(comfortable).toBeLessThan(dense);
    expect(spacious).toBeLessThan(comfortable);
  });
});
