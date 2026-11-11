// The CheckboxCard element on a plain HTML page, in a real browser: the button
// as a tri-state checkbox, Space and Enter as its own click, and the attribute
// contract a server relies on.
import { expect, test } from "./fixtures";

const open = async (page: import("@playwright/test").Page, query = "") => {
  await page.goto(`/checkbox-card.html${query}`);
  await page.waitForFunction(() => customElements.get("primitiv-checkbox-card"));
};

const card = (page: import("@playwright/test").Page) => page.getByRole("checkbox", { name: "Email updates" });

test("adopts the server's markup: a checkbox stating the state it was rendered with", async ({ page }) => {
  await open(page, "?checked=indeterminate");
  await expect(card(page)).toHaveAttribute("aria-checked", "mixed");
  await expect(card(page).locator("primitiv-checkbox-card-indicator")).toHaveAttribute("data-state", "indeterminate");
});

test("a click checks and unchecks, reflected into the checked attribute; a mixed card resolves to checked", async ({ page }) => {
  await open(page, "?checked=indeterminate");
  await card(page).click();
  await expect(page.locator("#card")).toHaveAttribute("checked", "");
  await card(page).click();
  await expect(page.locator("#card")).not.toHaveAttribute("checked");
  await expect(card(page).locator("primitiv-checkbox-card-indicator")).toHaveAttribute("hidden", "");
});

test("Space and Enter toggle exactly once each, and Tab reaches it", async ({ page }) => {
  await open(page);
  await page.keyboard.press("Tab");
  await expect(card(page)).toBeFocused();
  await page.keyboard.press(" ");
  await expect(card(page)).toHaveAttribute("aria-checked", "true");
  await page.keyboard.press("Enter");
  await expect(card(page)).toHaveAttribute("aria-checked", "false");
});

test("a disabled card stays focusable and never toggles", async ({ page }) => {
  await open(page, "?disabled");
  await card(page).click({ force: true });
  await expect(card(page)).toHaveAttribute("aria-checked", "false");
  await expect(card(page)).toHaveAttribute("aria-disabled", "true");
});

test("a cancelled change event keeps the state", async ({ page }) => {
  await open(page);
  await page.evaluate(() =>
    document.getElementById("card")?.addEventListener("primitiv-checkbox-card-change", (e) => e.preventDefault()),
  );
  await card(page).click();
  await expect(card(page)).toHaveAttribute("aria-checked", "false");
});
