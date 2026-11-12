// The HTMX swap cases (RFC 0033 §7.4), run against Listbox: parts that
// arrive, leave and move after first render, with no framework in between.
import { expect, test } from "./fixtures";

type Page = import("@playwright/test").Page;

test.beforeEach(async ({ page }) => {
  await page.goto("/listbox-htmx.html");
  await page.waitForFunction(() => customElements.get("primitiv-listbox") && "htmx" in window);
});

const optionIn = (page: Page, root: string, name: string) =>
  page.locator(`#${root}`).getByRole("option", { name, exact: true });
const cursorIn = (page: Page, root: string) =>
  page.evaluate((root) => {
    const id = document.getElementById(root)?.getAttribute("aria-activedescendant");
    return id ? document.getElementById(id)?.textContent : null;
  }, root);

test("1. a whole listbox arriving in a fragment upgrades with no script call", async ({ page }) => {
  await page.click("#load-list");
  await expect(optionIn(page, "swapped", "Banana")).toHaveAttribute("aria-selected", "true");
  await optionIn(page, "swapped", "Carrot").click();
  await expect(page.locator("#swapped")).toHaveAttribute("value", "carrot");
});

test("2. an out-of-band group joins the listbox, named and in DOM order", async ({ page }) => {
  await page.click("#load-group");
  await expect(page.locator("#grouped").getByRole("group", { name: "Herbs" })).toBeVisible();
  await page.locator("#grouped").focus();
  await page.keyboard.press("End");
  expect(await cursorIn(page, "grouped")).toBe("Basil");
});

test("3. an out-of-band option joins the existing listbox", async ({ page }) => {
  await page.click("#load-oob");
  await expect(optionIn(page, "oob", "Date")).toHaveAttribute("aria-selected", "false");
  await page.locator("#oob").focus();
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  await expect(page.locator("#oob")).toHaveAttribute("value", "date");
});

test("4. a server re-render with a new value selects it", async ({ page }) => {
  await page.click("#load-value");
  await expect(optionIn(page, "rerendered", "Carrot")).toHaveAttribute("aria-selected", "true");
  await expect(optionIn(page, "rerendered", "Apple")).toHaveAttribute("aria-selected", "false");
});

test("5. an hx-preserve'd listbox keeps its state and handles each event once", async ({ page }) => {
  await optionIn(page, "preserved", "Banana").click();
  await page.click("#swap-preserve");
  await expect(page.getByText("Swapped region")).toBeVisible();
  await expect(page.locator("#preserved")).toHaveAttribute("value", "banana");
  await page.evaluate(() => {
    const seen: string[][] = [];
    document.getElementById("preserved")?.addEventListener("primitiv-listbox-change", (e) => {
      seen.push((e as CustomEvent<{ value: string[] }>).detail.value);
    });
    (window as unknown as { __seen: string[][] }).__seen = seen;
  });
  await optionIn(page, "preserved", "Carrot").click();
  expect(await page.evaluate(() => (window as unknown as { __seen: string[][] }).__seen)).toEqual([["carrot"]]);
});

test("6. history restore brings back the options the user left selected", async ({ page }) => {
  await optionIn(page, "history", "Banana").click();
  await page.click("#go-two");
  await expect(page.locator("#page-two")).toBeVisible();
  await page.goBack();
  await expect(optionIn(page, "history", "Banana")).toHaveAttribute("aria-selected", "true");
  await expect(optionIn(page, "history", "Apple")).toHaveAttribute("aria-selected", "true");
});

test("7. hx-trigger posts each change, and an hx-on handler can veto one", async ({ page }) => {
  await optionIn(page, "echo", "Banana").click();
  await expect(page.getByTestId("echo")).toContainText("server saw banana");
  await optionIn(page, "echo", "Carrot").click();
  await expect(page.locator("#echo")).toHaveAttribute("value", "banana");
  await expect(optionIn(page, "echo", "Carrot")).toHaveAttribute("aria-selected", "false");
});

test("8. horizontal arrows mirror inside a right-to-left fragment", async ({ page }) => {
  await page.click("#load-rtl");
  await page.locator("#rtl").focus();
  await page.keyboard.press("ArrowLeft");
  expect(await cursorIn(page, "rtl")).toBe("Avocado");
});
