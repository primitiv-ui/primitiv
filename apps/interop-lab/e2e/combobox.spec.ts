// The Combobox element on a plain HTML page, in a real browser: what jsdom
// cannot vouch for — the Popover API's top layer and light dismiss, real focus
// staying in the field, a page's own filter, and a real form submitting the value.
import { expect, test } from "./fixtures";

type Page = import("@playwright/test").Page;

const open = async (page: Page, query = "") => {
  await page.goto(`/combobox.html${query}`);
  await page.waitForFunction(() => customElements.get("primitiv-combobox"));
  // The element wires its field once it has upgraded.
  await expect(field(page)).toHaveAttribute("role", "combobox");
};

const field = (page: Page) => page.getByRole("combobox", { name: "Framework combobox" });
const listbox = (page: Page) => page.getByRole("listbox");
const option = (page: Page, name: string) => page.getByRole("option", { name, exact: true });

test("adopts the server's markup: the committed item's text stays in the field", async ({ page }) => {
  await open(page, "?value=vue");
  await expect(field(page)).toHaveValue("Vue");
  await expect(listbox(page)).toBeHidden();
});

test("typing opens the list in the top layer, the page's filter narrows it, and Enter commits", async ({ page }) => {
  await open(page);
  await field(page).click();
  await page.keyboard.type("pr");
  await expect(listbox(page)).toBeVisible();
  await expect(option(page, "Preact")).toBeVisible();
  await expect(option(page, "React")).toBeHidden();
  await page.keyboard.press("ArrowDown");
  await expect(field(page)).toHaveAttribute("aria-activedescendant", (await option(page, "Preact").getAttribute("id"))!);
  await page.keyboard.press("Enter");
  await expect(listbox(page)).toBeHidden();
  await expect(field(page)).toHaveValue("Preact");
  await expect(field(page)).toBeFocused();
  await expect(page.locator("#combobox")).toHaveAttribute("value", "preact");
});

test("ArrowDown opens a closed list without placing a cursor", async ({ page }) => {
  await open(page);
  await field(page).click();
  await page.keyboard.press("ArrowDown");
  await expect(listbox(page)).toBeVisible();
  await expect(field(page)).not.toHaveAttribute("aria-activedescendant");
});

test("a click commits and focus stays in the field", async ({ page }) => {
  await open(page);
  await field(page).click();
  await page.keyboard.press("ArrowDown");
  await option(page, "Svelte").click();
  await expect(field(page)).toHaveValue("Svelte");
  await expect(field(page)).toBeFocused();
  await expect(listbox(page)).toBeHidden();
});

test("Escape closes and puts the committed text back over the query", async ({ page }) => {
  await open(page, "?value=react");
  await field(page).click();
  await page.keyboard.press("End");
  await page.keyboard.type("zz");
  await expect(listbox(page)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(listbox(page)).toBeHidden();
  await expect(field(page)).toHaveValue("React");
});

test("a press outside light-dismisses the list the same way", async ({ page }) => {
  await open(page, "?value=react");
  await field(page).click();
  await page.keyboard.press("End");
  await page.keyboard.type("x");
  await expect(listbox(page)).toBeVisible();
  await page.mouse.click(5, 300);
  await expect(listbox(page)).toBeHidden();
  await expect(field(page)).toHaveValue("React");
  await expect(page.locator("#combobox")).not.toHaveAttribute("open", "");
});

test("the empty message shows only while nothing matches", async ({ page }) => {
  await open(page);
  await field(page).click();
  await page.keyboard.type("r");
  await expect(page.getByText("No matches")).toBeHidden();
  await page.keyboard.type("x");
  await expect(page.getByText("No matches")).toBeVisible();
});

test("a disabled item is skipped and never committed", async ({ page }) => {
  await open(page, "?disabled=react");
  await field(page).click();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await expect(field(page)).toHaveAttribute("aria-activedescendant", (await option(page, "Preact").getAttribute("id"))!);
});

test("the form submits the committed value, not the field's text, under the combobox's name", async ({ page }) => {
  await open(page, "?name=framework");
  await field(page).click();
  await page.keyboard.type("v");
  await option(page, "Vue").click();
  await page.locator("#submit").click();
  await expect(page.locator("#submitted")).toHaveText('[["framework","vue"]]');
});

test("a cancelled change event keeps the value and its text", async ({ page }) => {
  await open(page, "?value=react");
  await page.evaluate(() =>
    document.getElementById("combobox")?.addEventListener("primitiv-combobox-change", (e) => e.preventDefault()),
  );
  await field(page).click();
  await page.keyboard.press("ArrowDown");
  await option(page, "Vue").click();
  await expect(page.locator("#combobox")).toHaveAttribute("value", "react");
  await expect(field(page)).toHaveValue("React");
});
