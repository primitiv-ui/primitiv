// The Accordion element on a plain HTML page, in a real browser: the shared
// contract where jsdom cannot vouch for it (`:dir()`, real focus, Space's click
// suppression), plus the attribute contract a server relies on.
import { expect, test } from "./fixtures";

const open = async (page: import("@playwright/test").Page, query = "") => {
  await page.goto(`/accordion.html${query}`);
  await page.waitForFunction(() => customElements.get("primitiv-accordion"));
};

const trigger = (page: import("@playwright/test").Page, name: string) =>
  page.getByRole("button", { name, exact: true });

test("adopts the server's markup: the open item expanded, its panel a named region", async ({ page }) => {
  await open(page);
  await expect(trigger(page, "One")).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("region", { name: "One" })).toHaveText("First panel");
  await expect(page.getByRole("region")).toHaveCount(1);
});

test("clicking toggles and reflects the open items into value", async ({ page }) => {
  await open(page, "?multiple");
  await trigger(page, "Three").click();
  await expect(page.locator("#accordion")).toHaveAttribute("value", "one three");
  await trigger(page, "One").click();
  await expect(page.locator("#accordion")).toHaveAttribute("value", "three");
  await expect(page.getByRole("region")).toHaveText("Third panel");
});

test("Enter and Space toggle exactly once each", async ({ page }) => {
  await open(page, "?value=");
  await trigger(page, "Two").focus();
  await page.keyboard.press("Enter");
  await expect(trigger(page, "Two")).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press(" ");
  await expect(trigger(page, "Two")).toHaveAttribute("aria-expanded", "false");
});

test("the arrows move focus past a disabled trigger, wrapping", async ({ page }) => {
  await open(page, "?disabled=two");
  await trigger(page, "One").focus();
  await page.keyboard.press("ArrowDown");
  await expect(trigger(page, "Three")).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(trigger(page, "One")).toBeFocused();
  // aria-disabled reads as disabled to Playwright's actionability check.
  await trigger(page, "Two").click({ force: true });
  await expect(trigger(page, "Two")).toHaveAttribute("aria-expanded", "false");
});

test("Tab visits every trigger: there is no roving tab stop", async ({ page }) => {
  await open(page);
  await trigger(page, "One").focus();
  await page.keyboard.press("Tab");
  await expect(trigger(page, "Two")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(trigger(page, "Three")).toBeFocused();
});

test("horizontal arrows mirror under an inherited dir=rtl", async ({ page }) => {
  await open(page, "?orientation=horizontal&dir=rtl");
  await trigger(page, "One").focus();
  await page.keyboard.press("ArrowLeft");
  await expect(trigger(page, "Two")).toBeFocused();
});

test("a cancelled change event keeps the item closed", async ({ page }) => {
  await open(page);
  await page.evaluate(() =>
    document.getElementById("accordion")?.addEventListener("primitiv-accordion-change", (e) => e.preventDefault()),
  );
  await trigger(page, "Two").click();
  await expect(trigger(page, "Two")).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("#accordion")).toHaveAttribute("value", "one");
});
