// The Listbox element on a plain HTML page, in a real browser: the shared
// contract where jsdom cannot vouch for it (`:dir()`, real focus and Tab order,
// scrolling the cursor into view), plus the attribute contract a server relies on.
import { expect, test } from "./fixtures";

type Page = import("@playwright/test").Page;

const open = async (page: Page, query = "") => {
  await page.goto(`/listbox.html${query}`);
  await page.waitForFunction(() => customElements.get("primitiv-listbox"));
  // The element writes role="listbox" once it has upgraded.
  await expect(page.locator("#list")).toHaveAttribute("role", "listbox");
};

const option = (page: Page, name: string) => page.getByRole("option", { name, exact: true });
const cursor = (page: Page) =>
  page.evaluate(() => {
    const id = document.getElementById("list")?.getAttribute("aria-activedescendant");
    return id ? document.getElementById(id)?.textContent : null;
  });

test("adopts the server's markup: a named listbox with the selected option selected", async ({ page }) => {
  await open(page);
  await expect(page.getByRole("listbox", { name: "Produce list" })).toBeVisible();
  await expect(option(page, "Apple")).toHaveAttribute("aria-selected", "true");
  await expect(option(page, "Banana")).toHaveAttribute("aria-selected", "false");
});

test("Tab focuses the listbox with the cursor on the selected option, and Tab leaves in one step", async ({ page }) => {
  await open(page, "?value=banana");
  await page.keyboard.press("Tab");
  await expect(page.locator("#list")).toBeFocused();
  expect(await cursor(page)).toBe("Banana");
  await expect(option(page, "Banana")).toHaveAttribute("data-highlighted", "");
  await page.keyboard.press("Tab");
  await expect(page.locator("#after")).toBeFocused();
  expect(await cursor(page)).toBeNull();
});

test("the arrows move the cursor and Enter selects, reflecting the value", async ({ page }) => {
  await open(page);
  await page.keyboard.press("Tab");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(page.locator("#list")).toHaveAttribute("value", "banana");
  await expect(page.locator("#list")).toBeFocused();
});

test("clicking toggles options in a multiple listbox", async ({ page }) => {
  await open(page, "?multiple");
  await option(page, "Carrot").click();
  await expect(page.locator("#list")).toHaveAttribute("value", "apple carrot");
  await option(page, "Apple").click();
  await expect(page.locator("#list")).toHaveAttribute("value", "carrot");
});

test("typing jumps to the next option starting with what was typed", async ({ page }) => {
  await open(page);
  await page.keyboard.press("Tab");
  await page.keyboard.press("c");
  expect(await cursor(page)).toBe("Carrot");
});

test("the cursor scrolls into view inside a scrolling list", async ({ page }) => {
  await open(page, "?scroll");
  await page.keyboard.press("Tab");
  await page.keyboard.press("End");
  expect(await cursor(page)).toBe("Carrot");
  await expect(option(page, "Carrot")).toBeInViewport();
  expect(await page.locator("#list").evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
});

test("a disabled option is skipped and never chosen", async ({ page }) => {
  await open(page, "?disabled=avocado");
  await page.keyboard.press("Tab");
  await page.keyboard.press("ArrowDown");
  expect(await cursor(page)).toBe("Banana");
  await option(page, "Avocado").click({ force: true });
  await expect(page.locator("#list")).toHaveAttribute("value", "apple");
});

test("horizontal arrows mirror under an inherited dir=rtl", async ({ page }) => {
  await open(page, "?dir=rtl&orientation=horizontal");
  await page.keyboard.press("Tab");
  await page.keyboard.press("ArrowLeft");
  expect(await cursor(page)).toBe("Avocado");
});

test("a cancelled change event keeps the selection", async ({ page }) => {
  await open(page);
  await page.evaluate(() =>
    document.getElementById("list")?.addEventListener("primitiv-listbox-change", (e) => e.preventDefault()),
  );
  await option(page, "Banana").click();
  await expect(page.locator("#list")).toHaveAttribute("value", "apple");
});
