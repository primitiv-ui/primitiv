// `primitiv add tabs` on the elements surface, end to end (RFC 0033 §8): the
// CLI's copied stylesheets and printed markup, in a real browser.
import { readFileSync } from "node:fs";

import { expect, test } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await page.goto("/styled.html");
  await page.waitForFunction(() => customElements.get("primitiv-tabs") && customElements.get("primitiv-accordion"));
});

const tab = (page: import("@playwright/test").Page, name: string) => page.getByRole("tab", { name, exact: true });

test("add printed the links and the script a plain HTML site needs", () => {
  const output = readFileSync("styled-site/add-output.txt", "utf8");
  expect(output).toContain('<link rel="stylesheet" href="primitiv/index.css">');
  expect(output).toMatch(/<script type="module" src="https:\/\/cdn\.jsdelivr\.net\/npm\/@primitiv-ui\/web@[\d.]+\/dist\/cdn\/tabs\.js"><\/script>/);
});

test("the copied stylesheets style the printed markup", async ({ page }) => {
  await expect(page.getByRole("tablist", { name: "Sections" })).toHaveCSS("display", "flex");
  const padding = await page.getByRole("tabpanel").evaluate((panel) => getComputedStyle(panel).paddingBlockStart);
  expect(parseFloat(padding)).toBeGreaterThan(0);
});

test("a trigger's wrapper takes no box, so its button lays out as React's does", async ({ page }) => {
  await expect(page.locator("primitiv-tabs-trigger").first()).toHaveCSS("display", "contents");
});

test("the printed markup is a working tab set", async ({ page }) => {
  await expect(tab(page, "One")).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel")).toHaveText("First panel");
  await tab(page, "One").focus();
  await page.keyboard.press("ArrowRight");
  await expect(tab(page, "Two")).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel")).toHaveText("Second panel");
});

const accordionTrigger = (page: import("@playwright/test").Page, name: string) =>
  page.getByRole("button", { name, exact: true });

test("add accordion printed the per-component script for its first release", () => {
  const output = readFileSync("styled-site/add-accordion-output.txt", "utf8");
  expect(output).toMatch(/@primitiv-ui\/web@[\d.]+\/dist\/cdn\/accordion\.js/);
});

test("the accordion's wrappers take the boxes React's markup has", async ({ page }) => {
  await expect(page.locator("primitiv-accordion-trigger").first()).toHaveCSS("display", "contents");
  await expect(page.locator("primitiv-accordion-item").first()).toHaveCSS("display", "block");
  await expect(page.locator("primitiv-accordion")).toHaveCSS("display", "flex");
});

test("the printed accordion is styled and working, its closed panels collapsed rather than display:none", async ({ page }) => {
  await expect(accordionTrigger(page, "One")).toHaveAttribute("aria-expanded", "true");
  await expect(accordionTrigger(page, "One")).toHaveCSS("display", "flex");
  await expect(page.getByRole("region", { name: "One" })).toHaveText("First panel");
  const second = page.locator("primitiv-accordion-content").nth(1);
  await expect(second).toHaveCSS("display", "grid");
  await expect(page.getByRole("region")).toHaveCount(1);

  await accordionTrigger(page, "Two").click();
  await expect(page.getByRole("region", { name: "Two" })).toHaveText("Second panel");
  await expect(page.locator(".primitiv-accordion__trigger-icon").nth(1)).toHaveAttribute("data-state", "open");
  await expect(page.getByRole("region")).toHaveCount(1);
});
