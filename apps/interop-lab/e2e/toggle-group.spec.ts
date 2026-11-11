// The ToggleGroup element on a plain HTML page, in a real browser: the shared
// contract where jsdom cannot vouch for it (`:dir()`, real focus and Tab order,
// Space's click suppression), plus the attribute contract a server relies on.
import { expect, test } from "./fixtures";

const open = async (page: import("@playwright/test").Page, query = "") => {
  await page.goto(`/toggle-group.html${query}`);
  await page.waitForFunction(() => customElements.get("primitiv-toggle-group"));
};

const item = (page: import("@playwright/test").Page, name: string) => page.getByRole("button", { name, exact: true });

test("adopts the server's markup: a named group with the pressed item pressed", async ({ page }) => {
  await open(page);
  await expect(page.getByRole("group", { name: "Formatting group" })).toBeVisible();
  await expect(item(page, "Bold")).toHaveAttribute("aria-pressed", "true");
  await expect(item(page, "Italic")).toHaveAttribute("aria-pressed", "false");
});

test("clicking toggles and reflects the pressed items into value", async ({ page }) => {
  await open(page, "?multiple");
  await item(page, "Underline").click();
  await expect(page.locator("#group")).toHaveAttribute("value", "bold underline");
  await item(page, "Bold").click();
  await expect(page.locator("#group")).toHaveAttribute("value", "underline");
});

test("Enter and Space toggle exactly once each", async ({ page }) => {
  await open(page, "?value=");
  await item(page, "Italic").focus();
  await page.keyboard.press("Enter");
  await expect(item(page, "Italic")).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press(" ");
  await expect(item(page, "Italic")).toHaveAttribute("aria-pressed", "false");
});

test("Tab enters at the pressed item and leaves in one step; the stop follows the arrows", async ({ page }) => {
  await open(page, "?value=italic");
  await page.keyboard.press("Tab");
  await expect(item(page, "Italic")).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(item(page, "Underline")).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await expect(item(page, "Underline")).toBeFocused();
});

test("the arrows move focus past a disabled item, wrapping", async ({ page }) => {
  await open(page, "?disabled=italic");
  await item(page, "Bold").focus();
  await page.keyboard.press("ArrowRight");
  await expect(item(page, "Underline")).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(item(page, "Bold")).toBeFocused();
  // aria-disabled reads as disabled to Playwright's actionability check.
  await item(page, "Italic").click({ force: true });
  await expect(item(page, "Italic")).toHaveAttribute("aria-pressed", "false");
});

test("horizontal arrows mirror under an inherited dir=rtl", async ({ page }) => {
  await open(page, "?dir=rtl");
  await item(page, "Bold").focus();
  await page.keyboard.press("ArrowLeft");
  await expect(item(page, "Italic")).toBeFocused();
});

test("a cancelled change event keeps the item unpressed", async ({ page }) => {
  await open(page);
  await page.evaluate(() =>
    document.getElementById("group")?.addEventListener("primitiv-toggle-group-change", (e) => e.preventDefault()),
  );
  await item(page, "Italic").click();
  await expect(item(page, "Italic")).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator("#group")).toHaveAttribute("value", "bold");
});
