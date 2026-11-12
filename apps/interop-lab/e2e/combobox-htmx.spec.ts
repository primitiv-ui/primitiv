// The HTMX swap cases (RFC 0033 §7.4), run against Combobox: parts that arrive,
// leave and move after first render, with no framework in between — and the
// server filtering the open list on every query.
import { expect, test } from "./fixtures";

type Page = import("@playwright/test").Page;

test.beforeEach(async ({ page }) => {
  await page.goto("/combobox-htmx.html");
  await page.waitForFunction(() => customElements.get("primitiv-combobox") && "htmx" in window);
});

const fieldOf = (page: Page, id: string) => page.getByRole("combobox", { name: `Framework ${id}` });
const optionIn = (page: Page, id: string, name: string) =>
  page.locator(`#${id}`).getByRole("option", { name, exact: true });

/** Open `id`'s list from its field and commit `name` with a click. */
const commit = async (page: Page, id: string, name: string) => {
  await fieldOf(page, id).click();
  await page.keyboard.press("ArrowDown");
  await optionIn(page, id, name).click();
};

test("1. a whole combobox arriving in a fragment upgrades with no script call", async ({ page }) => {
  await page.click("#load-combobox");
  await expect(fieldOf(page, "swapped")).toHaveValue("Preact");
  await commit(page, "swapped", "Svelte");
  await expect(page.locator("#swapped")).toHaveAttribute("value", "svelte");
});

test("2. an out-of-band item joins the list in DOM order", async ({ page }) => {
  await page.click("#load-oob");
  await fieldOf(page, "oob").click();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Enter");
  await expect(fieldOf(page, "oob")).toHaveValue("Solid");
});

test("3. a server re-render with a new value shows its text", async ({ page }) => {
  await page.click("#load-value");
  await expect(fieldOf(page, "rerendered")).toHaveValue("Svelte");
});

test("4. an hx-preserve'd combobox keeps its value and handles each event once", async ({ page }) => {
  await commit(page, "preserved", "Preact");
  await page.click("#swap-preserve");
  await expect(page.getByText("Swapped region")).toBeVisible();
  await expect(page.locator("#preserved")).toHaveAttribute("value", "preact");
  await expect(fieldOf(page, "preserved")).toHaveValue("Preact");
  await page.evaluate(() => {
    const seen: string[] = [];
    document.getElementById("preserved")?.addEventListener("primitiv-combobox-change", (e) => {
      seen.push((e as CustomEvent<{ value: string }>).detail.value);
    });
    (window as unknown as { __seen: string[] }).__seen = seen;
  });
  await commit(page, "preserved", "Vue");
  expect(await page.evaluate(() => (window as unknown as { __seen: string[] }).__seen)).toEqual(["vue"]);
});

test("5. history restore brings back the value the user committed", async ({ page }) => {
  await commit(page, "history", "Svelte");
  await page.click("#go-two");
  await expect(page.locator("#page-two")).toBeVisible();
  await page.goBack();
  await expect(page.locator("#history")).toHaveAttribute("value", "svelte");
  await expect(fieldOf(page, "history")).toHaveValue("Svelte");
});

test("6. hx-trigger posts each change, and an hx-on handler can veto one", async ({ page }) => {
  await commit(page, "echo", "Preact");
  await expect(page.getByTestId("echo")).toContainText("server saw preact");
  await commit(page, "echo", "Vue");
  await expect(page.locator("#echo")).toHaveAttribute("value", "preact");
  await expect(fieldOf(page, "echo")).toHaveValue("Preact");
});

test("7. the server filters: each query swaps the matching items into the open list", async ({ page }) => {
  await fieldOf(page, "filtered").click();
  await page.keyboard.type("s");
  await expect(page.locator("#filtered").getByRole("option")).toHaveText(["Svelte"]);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(fieldOf(page, "filtered")).toHaveValue("Svelte");
  await expect(page.locator("#filtered")).toHaveAttribute("value", "svelte");
});

test("8. hx-include reads the value through the hidden input", async ({ page }) => {
  await commit(page, "included", "Vue");
  await page.click("#send-include");
  await expect(page.getByTestId("included")).toHaveText("server saw vue");
});
