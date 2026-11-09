import { test, expect, type Page } from "@playwright/test";

// Elements mode previews render the REAL custom elements (`@primitiv-ui/web`),
// not the React component styled to look like them, because a developer
// reading the Elements page opens devtools and expects the DOM to match the
// code tab. Elements is the default framework and opens headless, but the
// preview is always the styled markup: bare markup previews as unstyled HTML.

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
  // Styled even under Headless (the default): the preview always shows the
  // finished component, as React mode's does; only the code tabs differ.
  await expect(tabs.first()).toHaveAttribute("class", /primitiv-tabs/);
});

test("the Controlled example follows primitiv-tabs-change", async ({ page }) => {
  await page.goto("/components/tabs/");
  const example = cell(page, "controlled");
  const tab = example.getByRole("tab", { name: "Accessibility" });
  await tab.click();
  await expect(tab).toHaveAttribute("aria-selected", "true");
  await expect(example.locator("[data-active-value]")).toHaveText("a11y");
});

test("the Accordion playground and examples are defined <primitiv-accordion> elements", async ({
  page,
}) => {
  await page.goto("/components/accordion/");
  const accordion = page.locator(".docs-elements-preview primitiv-accordion");
  await expect(accordion.first()).toBeAttached();
  const trigger = accordion.first().getByRole("button").first();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  expect(await page.evaluate(() => !!customElements.get("primitiv-accordion"))).toBe(true);
  // Styled under Headless too, its closed panels kept out of the a11y tree.
  await expect(accordion.first()).toHaveAttribute("class", /primitiv-accordion/);
  await expect(accordion.first().getByRole("region")).toHaveCount(1);
});

test("the Accordion Controlled example follows primitiv-accordion-change", async ({ page }) => {
  await page.goto("/components/accordion/");
  const example = cell(page, "controlled");
  const trigger = example.getByRole("button", { name: "Can I use the behaviour without the styles?" });
  // The definition loads on demand: wait for the element to have wired its button.
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.click();
  await expect(example.locator("[data-open-items]")).toHaveText("install, headless");
});

test("the Collapsible playground and examples are defined <primitiv-collapsible> elements", async ({
  page,
}) => {
  await page.goto("/components/collapsible/");
  const collapsible = page.locator(".docs-elements-preview primitiv-collapsible");
  await expect(collapsible.first()).toBeAttached();
  const trigger = collapsible.first().getByRole("button").first();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  expect(await page.evaluate(() => !!customElements.get("primitiv-collapsible"))).toBe(true);
  // Styled under Headless too.
  await expect(collapsible.first()).toHaveAttribute("class", /primitiv-collapsible/);
});

test("the Collapsible Controlled example follows primitiv-collapsible-change", async ({ page }) => {
  await page.goto("/components/collapsible/");
  const example = cell(page, "controlled");
  const trigger = example.getByRole("button", { name: "Release notes" });
  // The definition loads on demand: wait for the element to have wired its button.
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await trigger.click();
  await expect(example.locator("[data-open-state]")).toHaveText("closed");
});

test("the Collapsible read-more preview is clamped and swaps its label", async ({ page }) => {
  await page.goto("/components/collapsible/");
  const example = cell(page, "read-more");
  const content = example.locator("primitiv-collapsible-content");
  await expect(content).toHaveAttribute("data-clamped", "true");
  await expect(example.locator("script")).toHaveCount(0);
  await example.getByRole("button", { name: "Show more" }).click();
  await expect(example.getByRole("button", { name: "Show less" })).toHaveAttribute("aria-expanded", "true");
});

test("the Prose preview is plain markup whose children take the flow rhythm", async ({ page }) => {
  await page.goto("/components/prose/");
  const flow = page.locator(".docs-elements-preview .primitiv-flow").first();
  await expect(flow).toBeAttached();
  // No element to define: the class is the whole component.
  expect(await page.evaluate(() => !!customElements.get("primitiv-prose"))).toBe(false);
  // The owl spaces every direct child after the first.
  const first = await flow.locator("> *").first().evaluate((e) => getComputedStyle(e).marginBlockStart);
  const second = await flow.locator("> *").nth(1).evaluate((e) => getComputedStyle(e).marginBlockStart);
  expect(first).toBe("0px");
  expect(parseFloat(second)).toBeGreaterThan(0);
});

for (const [id, rootClass] of [
  ["blockquote", "primitiv-blockquote"],
  ["pull-quote", "primitiv-pull-quote"],
  ["list", "primitiv-list"],
  ["description-list", "primitiv-description-list"],
  ["figure", "primitiv-figure"],
  ["divider", "primitiv-divider"],
  ["box", "primitiv-box"],
  ["stack", "primitiv-stack"],
  ["grid", "primitiv-grid"],
  ["container", "primitiv-container"],
  ["center", "primitiv-center"],
  ["spacer", "primitiv-spacer"],
  ["aspect-ratio", "primitiv-aspect-ratio"],
  ["card", "primitiv-card"],
  ["input", "primitiv-input"],
  ["textarea", "primitiv-textarea"],
  ["field", "primitiv-field"],
  ["input-group", "primitiv-input-group"],
  ["checkbox", "primitiv-checkbox"],
  ["radio", "primitiv-radio"],
  ["switch", "primitiv-switch"],
] as const) {
  test(`the ${id} preview is styled markup with no element to define`, async ({ page }) => {
    await page.goto(`/components/${id}/`);
    const root = page.locator(`.docs-elements-preview .${rootClass}`).first();
    await expect(root).toBeAttached();
    // Scoped to the previews: other page chrome may still be defining itself.
    expect(
      await page.evaluate(
        () => document.querySelectorAll(".docs-elements-preview :not(:defined)").length,
      ),
    ).toBe(0);
    expect(await page.evaluate((name) => !!customElements.get(name), `primitiv-${id}`)).toBe(false);
  });
}

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

test("the Checkbox tri-state preview derives the parent from its children", async ({ page }) => {
  await page.goto("/components/checkbox/");
  const example = cell(page, "indeterminate");
  const all = example.locator("#notify-all");
  // One of three starts checked, so the parent is mixed.
  await expect.poll(() => all.evaluate((el: HTMLInputElement) => el.indeterminate)).toBe(true);
  await all.check({ force: true });
  await expect(example.locator('input[name="notify"]:checked')).toHaveCount(3);
  expect(await all.evaluate((el: HTMLInputElement) => el.indeterminate)).toBe(false);
});

test("the Radio value preview follows the selection", async ({ page }) => {
  await page.goto("/components/radio/");
  const example = cell(page, "controlled");
  await example.getByRole("radio", { name: "Team" }).check({ force: true });
  await expect(example.locator("#subscription-value")).toHaveText("team");
});

test("the Switch script preview sets the switch", async ({ page }) => {
  await page.goto("/components/switch/");
  const example = cell(page, "controlled");
  await example.getByRole("button", { name: "Turn on" }).click();
  await expect(example.getByRole("switch", { name: "Email notifications" })).toBeChecked();
  await example.getByRole("button", { name: "Turn off" }).click();
  await expect(example.getByRole("switch", { name: "Email notifications" })).not.toBeChecked();
});
