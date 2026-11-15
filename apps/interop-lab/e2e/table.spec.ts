// The Table expand trigger on a plain HTML page, in a real browser: the HTML
// parser keeping it inside the table, real focus, Space's click suppression,
// and the attribute contract a server relies on.
import { expect, test } from "./fixtures";

const open = async (page: import("@playwright/test").Page, query = "") => {
  await page.goto(`/table.html${query}`);
  await page.waitForFunction(() => customElements.get("primitiv-table-expand-trigger"));
};

const trigger = (page: import("@playwright/test").Page, name: string) =>
  page.getByRole("button", { name: `Show details for ${name}`, exact: true });
const detail = (page: import("@playwright/test").Page, name: string) => page.locator(`#table-${name.toLowerCase()}-details`);

test("the parser keeps the trigger inside its cell, and the closed detail rows stay out of the row count", async ({ page }) => {
  await open(page);
  await expect(page.locator("td > primitiv-table-expand-trigger")).toHaveCount(2);
  await expect(trigger(page, "Ada")).toHaveAttribute("aria-expanded", "false");
  await expect(detail(page, "Ada")).toBeHidden();
  // The header row and the two data rows.
  await expect(page.getByRole("table").getByRole("row")).toHaveCount(3);
});

test("clicking opens one row's detail and reflects expanded, leaving the other row alone", async ({ page }) => {
  await open(page);
  await trigger(page, "Ada").click();
  await expect(page.locator("primitiv-table-expand-trigger").first()).toHaveAttribute("expanded", "");
  await expect(detail(page, "Ada")).toBeVisible();
  await expect(detail(page, "Grace")).toBeHidden();
  await trigger(page, "Ada").click();
  await expect(detail(page, "Ada")).toBeHidden();
});

test("Enter and Space toggle exactly once each", async ({ page }) => {
  await open(page);
  await trigger(page, "Grace").focus();
  await page.keyboard.press("Enter");
  await expect(trigger(page, "Grace")).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press(" ");
  await expect(trigger(page, "Grace")).toHaveAttribute("aria-expanded", "false");
});

test("adopts a row the server rendered expanded", async ({ page }) => {
  await open(page, "?expanded=Grace");
  await expect(trigger(page, "Grace")).toHaveAttribute("aria-expanded", "true");
  await expect(detail(page, "Grace")).toBeVisible();
});

test("a disabled trigger stays focusable and never toggles", async ({ page }) => {
  await open(page, "?disabled");
  await page.keyboard.press("Tab");
  await expect(trigger(page, "Ada")).toBeFocused();
  await page.keyboard.press("Enter");
  // aria-disabled reads as disabled to Playwright's actionability check.
  await trigger(page, "Ada").click({ force: true });
  await expect(trigger(page, "Ada")).toHaveAttribute("aria-expanded", "false");
});

test("a force-mounted detail row stays rendered but aria-hidden while closed", async ({ page }) => {
  await open(page, "?force-mount");
  await expect(detail(page, "Ada")).not.toHaveAttribute("hidden");
  await expect(detail(page, "Ada")).toHaveAttribute("aria-hidden", "true");
  await trigger(page, "Ada").click();
  await expect(detail(page, "Ada")).not.toHaveAttribute("aria-hidden");
});

test("a cancelled change event keeps the row closed", async ({ page }) => {
  await open(page);
  await page.evaluate(() =>
    document.addEventListener("primitiv-table-expand-change", (e) => e.preventDefault()),
  );
  await trigger(page, "Ada").click();
  await expect(trigger(page, "Ada")).toHaveAttribute("aria-expanded", "false");
  await expect(detail(page, "Ada")).toBeHidden();
});
