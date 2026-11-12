// The SplitButton element on a plain HTML page, in a real browser: one action
// welded to a dropdown menu, ArrowDown from the action, the derived trigger
// name, and the attribute contract a server relies on.
import { expect, test } from "./fixtures";

const open = async (page: import("@playwright/test").Page, query = "") => {
  await page.goto(`/split-button.html${query}`);
  await page.waitForFunction(() => customElements.get("primitiv-split-button"));
};

const group = (page: import("@playwright/test").Page) => page.locator("#split");
const action = (page: import("@playwright/test").Page) => page.getByRole("button", { name: "Save", exact: true });
const trigger = (page: import("@playwright/test").Page) => page.getByRole("button", { name: "More Save" });

test("adopts the server's markup: a group of an action and a menu button named after it", async ({ page }) => {
  await open(page);
  await expect(page.getByRole("group")).toHaveAttribute("data-state", "closed");
  await expect(trigger(page)).toHaveAttribute("aria-haspopup", "menu");
  await expect(trigger(page)).toHaveAttribute("aria-labelledby", "split-trigger split-action");
});

test("adopts a menu rendered open", async ({ page }) => {
  await open(page, "?open");
  await expect(group(page)).toHaveAttribute("data-state", "open");
  await expect(page.getByRole("menu")).toBeVisible();
});

test("Tab reaches both halves; ArrowDown on the action opens the menu on its first item", async ({ page }) => {
  await open(page);
  await page.keyboard.press("Tab");
  await expect(action(page)).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(trigger(page)).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("ArrowDown");
  await expect(group(page)).toHaveAttribute("data-state", "open");
  await expect(page.getByRole("menuitem", { name: "Save and close" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(group(page)).toHaveAttribute("data-state", "closed");
  await expect(trigger(page)).toBeFocused();
});

test("a click on the action runs it and leaves the menu closed; choosing an item closes the menu", async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    document.querySelector("primitiv-split-button-action button")?.addEventListener("click", () => {
      (window as unknown as { __ran: number }).__ran = ((window as unknown as { __ran?: number }).__ran ?? 0) + 1;
    });
  });
  await action(page).click();
  expect(await page.evaluate(() => (window as unknown as { __ran: number }).__ran)).toBe(1);
  await expect(group(page)).toHaveAttribute("data-state", "closed");
  await trigger(page).click();
  await page.getByRole("menuitem", { name: "Save as draft" }).click();
  await expect(group(page)).toHaveAttribute("data-state", "closed");
});

test("a disabled group disables both halves", async ({ page }) => {
  await open(page, "?disabled");
  await expect(action(page)).toBeDisabled();
  await expect(trigger(page)).toBeDisabled();
  await expect(group(page)).toHaveAttribute("data-disabled", "");
});
