import { test, expect } from "@playwright/test";

// The expander's chevron is an SVG with no width/height attributes inside a
// flex button. WebKit (iOS Safari) shrank it to nothing, leaving the control
// column empty, until the glyph opted out of flex shrinking as the sort icon
// and Pagination's chevrons already do. Run in CI's webkit and mobile-safari
// projects, which is the point of this test.
for (const framework of ["react", "elements"]) {
test(`every expand trigger's chevron keeps its size (${framework})`, async ({ page }) => {
  await page.addInitScript(
    ([key, value]) => localStorage.setItem(key, JSON.stringify(value)),
    ["primitiv-docs-framework", framework],
  );
  await page.goto("/components/data-table/");
  const triggers = page.getByRole("button", { name: /^Show details for / });
  await expect(triggers.first()).toBeVisible();
  // React's trigger names a generated id; the Elements markup names "<row>-details".
  // Waiting for the right one keeps the measurement off a page mid-swap.
  await expect(triggers.first()).toHaveAttribute("aria-controls", framework === "react" ? /detail-row$/ : /-details$/);
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
  // The button keeps its square too: the preview's min-content release must not
  // cancel a component's own minimum, which is what collapsed it in Safari.
  const buttons = await triggers.evaluateAll((all) => all.map((b) => [Math.round(b.getBoundingClientRect().width), Math.round(b.getBoundingClientRect().height)]));
  for (const [width, height] of buttons) expect(width).toBe(height);
  for (const [width, height] of sizes) {
    expect(width).toBeGreaterThan(0);
    expect(width).toBe(height);
  }
});
}
