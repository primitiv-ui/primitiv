import { test, expect, type Page } from "@playwright/test";

// Elements mode previews render the REAL custom elements (`@primitiv-ui/web`),
// not the React component styled to look like them, because a developer
// reading the Elements page opens devtools and expects the DOM to match the
// code tab. Elements is the default framework and opens headless.

const FRAMEWORK_KEY = "primitiv-docs-framework";

/** An example on a component page: the block that follows its heading. */
const cell = (page: Page, id: string) => page.locator(`h3#${id} + *`);

test("the Tabs playground and examples are defined <primitiv-tabs> elements", async ({
  page,
}) => {
  await page.goto("/components/tabs/");
  const tabs = page.locator(".docs-elements-preview primitiv-tabs");
  await expect(tabs.first()).toBeAttached();
  // The element wired the APG roles onto the <button> it wraps — which only
  // happens once the definition has loaded (it is imported on demand).
  await expect(tabs.first().locator("button").first()).toHaveAttribute("role", "tab");
  expect(await page.evaluate(() => !!customElements.get("primitiv-tabs"))).toBe(true);
  // Headless by default: no Primitiv classes on the element.
  await expect(tabs.first()).not.toHaveAttribute("class", /primitiv-tabs/);
});

test("the Controlled example follows primitiv-tabs-change", async ({ page }) => {
  await page.goto("/components/tabs/");
  const example = cell(page, "controlled");
  const tab = example.getByRole("tab", { name: "Accessibility" });
  await tab.click();
  await expect(tab).toHaveAttribute("aria-selected", "true");
  await expect(example.locator("[data-active-value]")).toHaveText("a11y");
});

test("the Button icon examples render real glyphs, not placeholders", async ({
  page,
}) => {
  await page.goto("/components/button/");
  await expect(cell(page, "with-icons").locator(".docs-elements-preview svg path")).toHaveCount(4);
});

test("React mode renders the React component, not the elements", async ({ page }) => {
  await page.addInitScript(
    ([key]) => localStorage.setItem(key, JSON.stringify("react")),
    [FRAMEWORK_KEY],
  );
  await page.goto("/components/tabs/");
  await expect(page.getByRole("tab").first()).toBeVisible();
  await expect(page.locator("primitiv-tabs")).toHaveCount(0);
});
