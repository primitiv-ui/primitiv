import { test, expect } from "@playwright/test";

// The expander's chevron is an SVG with no width/height attributes inside a
// flex button. WebKit (iOS Safari) shrank it to nothing, leaving the control
// column empty, until the glyph opted out of flex shrinking as the sort icon
// and Pagination's chevrons already do. Run in CI's webkit and mobile-safari
// projects, which is the point of this test.
test("every expand trigger's chevron keeps its size", async ({ page }) => {
  await page.goto("/components/data-table/");
  const triggers = page.getByRole("button", { name: /^Show details for / });
  await expect(triggers.first()).toBeVisible();
  // Logged so a WebKit run says what it computed, pass or fail.
  console.log(
    JSON.stringify(
      await triggers.first().evaluate((button) => {
        const svg = button.querySelector("svg")!;
        const b = getComputedStyle(button);
        const s = getComputedStyle(svg);
        return {
          button: button.getBoundingClientRect().toJSON(),
          svg: svg.getBoundingClientRect().toJSON(),
          buttonCss: { display: b.display, inlineSize: b.inlineSize, minInlineSize: b.minInlineSize, color: b.color, opacity: b.opacity },
          svgCss: { display: s.display, width: s.width, height: s.height, flex: s.flex, color: s.color, stroke: s.stroke, visibility: s.visibility, transform: s.transform },
        };
      }),
    ),
  );
  const sizes = await triggers.evaluateAll((buttons) =>
    buttons.map((button) => {
      const box = button.querySelector("svg")!.getBoundingClientRect();
      return [Math.round(box.width), Math.round(box.height)];
    }),
  );
  expect(sizes.length).toBeGreaterThan(0);
  for (const [width, height] of sizes) {
    expect(width).toBeGreaterThan(0);
    expect(width).toBe(height);
  }
});
