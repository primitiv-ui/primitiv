// The HTMX swap cases (RFC 0033 §7.4), run against Select: parts that arrive,
// leave and move after first render, with no framework in between.
import { expect, test } from "./fixtures";

type Page = import("@playwright/test").Page;

test.beforeEach(async ({ page }) => {
  await page.goto("/select-htmx.html");
  await page.waitForFunction(() => customElements.get("primitiv-select") && "htmx" in window);
});

const triggerOf = (page: Page, id: string) => page.getByRole("button", { name: `Fruit ${id}` });
const optionIn = (page: Page, id: string, name: string) =>
  page.locator(`#${id}`).getByRole("option", { name, exact: true });

test("1. a whole select arriving in a fragment upgrades with no script call", async ({ page }) => {
  await page.click("#load-select");
  await expect(triggerOf(page, "swapped")).toHaveText("Banana");
  await triggerOf(page, "swapped").click();
  await optionIn(page, "swapped", "Cherry").click();
  await expect(page.locator("#swapped")).toHaveAttribute("value", "cherry");
});

test("2. an out-of-band item joins the list in DOM order", async ({ page }) => {
  await page.click("#load-oob");
  await triggerOf(page, "oob").click();
  await page.keyboard.press("End");
  await expect(optionIn(page, "oob", "Date")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(triggerOf(page, "oob")).toHaveText("Date");
});

test("3. a server re-render with a new value shows it", async ({ page }) => {
  await page.click("#load-value");
  await expect(triggerOf(page, "rerendered")).toHaveText("Cherry");
});

test("4. an hx-preserve'd select keeps its value and handles each event once", async ({ page }) => {
  await triggerOf(page, "preserved").click();
  await optionIn(page, "preserved", "Banana").click();
  await page.click("#swap-preserve");
  await expect(page.getByText("Swapped region")).toBeVisible();
  await expect(page.locator("#preserved")).toHaveAttribute("value", "banana");
  await page.evaluate(() => {
    const seen: string[] = [];
    document.getElementById("preserved")?.addEventListener("primitiv-select-change", (e) => {
      seen.push((e as CustomEvent<{ value: string }>).detail.value);
    });
    (window as unknown as { __seen: string[] }).__seen = seen;
  });
  await triggerOf(page, "preserved").click();
  await optionIn(page, "preserved", "Cherry").click();
  expect(await page.evaluate(() => (window as unknown as { __seen: string[] }).__seen)).toEqual(["cherry"]);
});

test("5. history restore brings back the value the user chose", async ({ page }) => {
  await triggerOf(page, "history").click();
  await optionIn(page, "history", "Banana").click();
  await page.click("#go-two");
  await expect(page.locator("#page-two")).toBeVisible();
  await page.goBack();
  await expect(triggerOf(page, "history")).toHaveText("Banana");
});

test("6. hx-trigger posts each change, and an hx-on handler can veto one", async ({ page }) => {
  await triggerOf(page, "echo").click();
  await optionIn(page, "echo", "Banana").click();
  await expect(page.getByTestId("echo")).toContainText("server saw banana");
  await triggerOf(page, "echo").click();
  await optionIn(page, "echo", "Cherry").click();
  await expect(page.locator("#echo")).toHaveAttribute("value", "banana");
});

test("7. hx-include reads the value through the hidden native select", async ({ page }) => {
  await triggerOf(page, "included").click();
  await optionIn(page, "included", "Cherry").click();
  await page.click("#send-include");
  await expect(page.getByTestId("included")).toHaveText("server saw cherry");
});
