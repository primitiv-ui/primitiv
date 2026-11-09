// The Collapsible element on a plain HTML page, in a real browser: the shared
// contract where jsdom cannot vouch for it (real focus, Space's click
// suppression), plus the attribute contract a server relies on.
import { expect, test } from "./fixtures";

const open = async (page: import("@playwright/test").Page, query = "") => {
  await page.goto(`/collapsible.html${query}`);
  await page.waitForFunction(() => customElements.get("primitiv-collapsible"));
};

const trigger = (page: import("@playwright/test").Page) => page.getByRole("button", { name: "Toggle", exact: true });
const panel = (page: import("@playwright/test").Page) => page.locator("primitiv-collapsible-content");

test("adopts the server's markup: a closed panel stays hidden", async ({ page }) => {
  await open(page);
  await expect(trigger(page)).toHaveAttribute("aria-expanded", "false");
  await expect(trigger(page)).toHaveAttribute("aria-controls", "collapsible-content");
  await expect(panel(page)).toBeHidden();
});

test("clicking toggles and reflects the state into open", async ({ page }) => {
  await open(page);
  await trigger(page).click();
  await expect(page.locator("#collapsible")).toHaveAttribute("open", "");
  await expect(panel(page)).toHaveText("Hidden content");
  await trigger(page).click();
  await expect(page.locator("#collapsible")).not.toHaveAttribute("open");
  await expect(panel(page)).toBeHidden();
});

test("Enter and Space toggle exactly once each", async ({ page }) => {
  await open(page);
  await trigger(page).focus();
  await page.keyboard.press("Enter");
  await expect(trigger(page)).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press(" ");
  await expect(trigger(page)).toHaveAttribute("aria-expanded", "false");
});

test("a disabled collapsible stays focusable and never toggles", async ({ page }) => {
  await open(page, "?disabled");
  await page.keyboard.press("Tab");
  await expect(trigger(page)).toBeFocused();
  await page.keyboard.press("Enter");
  // aria-disabled reads as disabled to Playwright's actionability check.
  await trigger(page).click({ force: true });
  await expect(trigger(page)).toHaveAttribute("aria-expanded", "false");
});

test("a collapsed-height panel shows a readable preview while closed", async ({ page }) => {
  await open(page, "?collapsed-height=24");
  await expect(panel(page)).toBeVisible();
  await expect(panel(page)).toHaveAttribute("data-clamped", "true");
  await expect(panel(page)).toHaveCSS("--primitiv-collapsible-collapsed-height", "24px");
});

test("a cancelled change event keeps it closed", async ({ page }) => {
  await open(page);
  await page.evaluate(() =>
    document.getElementById("collapsible")?.addEventListener("primitiv-collapsible-change", (e) => e.preventDefault()),
  );
  await trigger(page).click();
  await expect(trigger(page)).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("#collapsible")).not.toHaveAttribute("open");
});
