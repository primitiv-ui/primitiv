import { test, expect, type Page } from "@playwright/test";

/*
 * Real-browser proof that a control's boundary clears WCAG 1.4.11
 * (docs/interface-audit.md, `better-colors`: `border/default` measured 2.24:1
 * light and 2.66:1 dark against `surface/default`).
 *
 * There is already a token-level guard in
 * packages/tokens/src/dark-mode-content.test.ts. It proves the *token* clears
 * 3:1; it cannot prove a control renders that token, or what background the
 * border actually sits on — and 1.4.11 is about the rendered pair, which is the
 * principle the colour pass itself insists on. A component pointing its border at
 * a different role, or sitting on a raised surface rather than the page, passes
 * the token test and fails the user.
 *
 * So this walks up from the real element to the first ancestor that actually
 * paints a background, and measures against that.
 *
 * Run: cd apps/kitchen-sink && ./node_modules/.bin/playwright test --project=chromium
 */

const THRESHOLD = 3;

/** Contrast of an element's border against the nearest painted background behind it. */
async function borderContrast(page: Page, selector: string) {
  return page.evaluate((selector) => {
    const parse = (c: string): [number, number, number, number] => {
      const n = c.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0, 0];
      return [n[0] ?? 0, n[1] ?? 0, n[2] ?? 0, n[3] ?? 1];
    };
    const lum = ([r, g, b]: number[]) => {
      const ch = (v: number) => {
        const c = v / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
    };
    const el = document.querySelector(selector);
    if (!el) throw new Error(`no element matched ${selector}`);
    const cs = getComputedStyle(el);
    const border = parse(cs.borderTopColor);

    // Walk up for the first ancestor that actually paints — a transparent
    // background means the border sits on whatever is behind it, not on nothing.
    let node: Element | null = el.parentElement;
    let bg: [number, number, number, number] = [255, 255, 255, 1];
    while (node) {
      const c = parse(getComputedStyle(node).backgroundColor);
      if (c[3] > 0) {
        bg = c;
        break;
      }
      node = node.parentElement;
    }
    const ratio = (() => {
      const [a, b] = [lum(border), lum(bg)].sort((x, y) => y - x);
      return (a + 0.05) / (b + 0.05);
    })();
    return {
      borderColor: cs.borderTopColor,
      borderWidth: cs.borderTopWidth,
      background: `rgb(${bg[0]}, ${bg[1]}, ${bg[2]})`,
      ratio: Number(ratio.toFixed(2)),
    };
  }, selector);
}

test.describe("control boundary contrast", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 1000 });
    await page.goto("/");
  });

  for (const theme of ["light", "dark"] as const) {
    test(`an Input's border clears ${THRESHOLD}:1 in ${theme} mode`, async ({ page }) => {
      await page.evaluate((t) => {
        document.documentElement.dataset.theme = t;
      }, theme);
      const { ratio, borderColor, background } = await borderContrast(page, ".primitiv-input");
      expect(ratio, `${borderColor} on ${background}`).toBeGreaterThanOrEqual(THRESHOLD);
    });
  }

  test("a Card's border is deliberately NOT held to it", async ({ page }) => {
    // Card binds `border/subtle`, which draws a container edge rather than a
    // control boundary — decoration, and exempt from 1.4.11. Asserting that keeps
    // someone from "fixing" Card to match Input and darkening every card edge in
    // the system on a misreading of the requirement.
    const { ratio } = await borderContrast(page, ".primitiv-card");
    expect(ratio).toBeLessThan(THRESHOLD);
  });
});
