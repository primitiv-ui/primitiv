// The Select element on a plain HTML page, in a real browser: what jsdom cannot
// vouch for — the Popover API's top layer and light dismiss, real focus, and a
// real form submitting and validating through the hidden native select.
import { expect, test } from "./fixtures";

type Page = import("@playwright/test").Page;

const open = async (page: Page, query = "") => {
  await page.goto(`/select.html${query}`);
  await page.waitForFunction(() => customElements.get("primitiv-select"));
  // The element wires its trigger's button once it has upgraded.
  await expect(trigger(page)).toHaveAttribute("aria-haspopup", "listbox");
};

const trigger = (page: Page) => page.getByRole("button", { name: "Fruit select" });
const option = (page: Page, name: string) => page.getByRole("option", { name, exact: true });

test("adopts the server's markup: the chosen item shows in the trigger", async ({ page }) => {
  await open(page, "?value=banana");
  await expect(trigger(page)).toHaveText("Banana");
  await expect(page.getByRole("listbox")).toBeHidden();
});

test("opens in the top layer with focus on the chosen item, and chooses with the keyboard", async ({ page }) => {
  await open(page);
  await trigger(page).click();
  await expect(page.getByRole("listbox")).toBeVisible();
  await expect(option(page, "Apple")).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("listbox")).toBeHidden();
  await expect(trigger(page)).toBeFocused();
  await expect(page.locator("#select")).toHaveAttribute("value", "banana");
});

test("typing jumps to the item it starts", async ({ page }) => {
  await open(page);
  await trigger(page).click();
  await page.keyboard.press("c");
  await expect(option(page, "Cherry")).toBeFocused();
});

test("Escape closes without choosing, back to the trigger", async ({ page }) => {
  await open(page);
  await trigger(page).click();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("listbox")).toBeHidden();
  await expect(trigger(page)).toBeFocused();
  await expect(trigger(page)).toHaveText("Apple");
});

test("a press outside light-dismisses the list", async ({ page }) => {
  await open(page);
  await trigger(page).click();
  await expect(page.getByRole("listbox")).toBeVisible();
  await page.mouse.click(5, 300);
  await expect(page.getByRole("listbox")).toBeHidden();
  await expect(page.locator("#select")).not.toHaveAttribute("open", "");
});

test("a disabled item is skipped and never chosen", async ({ page }) => {
  await open(page, "?disabled=banana");
  await trigger(page).click();
  await page.keyboard.press("ArrowDown");
  await expect(option(page, "Cherry")).toBeFocused();
});

test("the form submits the chosen value under the select's name", async ({ page }) => {
  await open(page, "?name=fruit");
  await trigger(page).click();
  await option(page, "Cherry").click();
  await page.locator("#submit").click();
  await expect(page.locator("#submitted")).toHaveText('[["fruit","cherry"]]');
});

test("a required select blocks an empty submit", async ({ page }) => {
  await open(page, "?name=fruit&required&value=");
  await page.locator("#submit").click();
  await expect(page.locator("#submitted")).toHaveText("");
  expect(await page.locator("form").evaluate((form: HTMLFormElement) => form.checkValidity())).toBe(false);
  await trigger(page).click();
  await option(page, "Apple").click();
  await page.locator("#submit").click();
  await expect(page.locator("#submitted")).toHaveText('[["fruit","apple"]]');
});

test("the hidden native select is not a Tab stop", async ({ page }) => {
  await open(page, "?name=fruit");
  await page.locator("#before").focus();
  await page.keyboard.press("Tab");
  await expect(trigger(page)).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.locator("#submit")).toBeFocused();
});

test("a cancelled change event keeps the value", async ({ page }) => {
  await open(page);
  await page.evaluate(() =>
    document.getElementById("select")?.addEventListener("primitiv-select-change", (e) => e.preventDefault()),
  );
  await trigger(page).click();
  await option(page, "Cherry").click();
  await expect(page.locator("#select")).toHaveAttribute("value", "apple");
});
