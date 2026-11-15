// The HTMX swap cases (RFC 0033 §7.4), run against a table's expandable rows:
// triggers and detail rows that arrive, leave and move after first render,
// with no framework in between.
import { expect, test } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await page.goto("/table-htmx.html");
  await page.waitForFunction(() => customElements.get("primitiv-table-expand-trigger") && "htmx" in window);
});

const triggerIn = (page: import("@playwright/test").Page, table: string, name = "Ada") =>
  page.locator(`#${table}`).getByRole("button", { name: `Show details for ${name}`, exact: true });
const detailOf = (page: import("@playwright/test").Page, table: string, name = "Ada") =>
  page.locator(`#${table}-${name.toLowerCase()}-details`);

test("1. a whole table arriving in a fragment upgrades with no script call", async ({ page }) => {
  await page.click("#load-table");
  await expect(triggerIn(page, "swapped")).toHaveAttribute("aria-expanded", "true");
  await triggerIn(page, "swapped").click();
  await expect(detailOf(page, "swapped")).toBeHidden();
});

test("2. a table swapped into another's detail row stays independent of it", async ({ page }) => {
  await page.click("#load-nested");
  await triggerIn(page, "inner", "Linus").click();
  await expect(detailOf(page, "inner", "Linus")).toBeVisible();
  await expect(triggerIn(page, "outer")).toHaveAttribute("aria-expanded", "true");
  await triggerIn(page, "inner", "Linus").click();
  await expect(detailOf(page, "inner", "Linus")).toBeHidden();
  await expect(detailOf(page, "outer")).toBeVisible();
});

test("3. rows arriving in an existing body upgrade and toggle", async ({ page }) => {
  await page.click("#load-rows");
  await expect(triggerIn(page, "grow", "Linus")).toHaveAttribute("aria-expanded", "false");
  await triggerIn(page, "grow", "Linus").click();
  await expect(detailOf(page, "grow", "Linus")).toBeVisible();
  await expect(detailOf(page, "grow")).toBeHidden();
});

test("4. a detail row re-rendered out of band is still its trigger's", async ({ page }) => {
  await page.click("#load-oob");
  await expect(detailOf(page, "oob")).toHaveText("Fresh details");
  await triggerIn(page, "oob").click();
  await expect(detailOf(page, "oob")).toBeHidden();
  await expect(detailOf(page, "oob")).toHaveAttribute("data-state", "closed");
});

test("5. a server re-render, now expanded, opens the row", async ({ page }) => {
  await page.click("#load-expanded");
  await expect(triggerIn(page, "rerendered")).toHaveAttribute("aria-expanded", "true");
  await expect(detailOf(page, "rerendered")).toBeVisible();
});

test("6. an hx-preserve'd table keeps its rows' state and handles each event once", async ({ page }) => {
  await triggerIn(page, "preserved").click();
  await page.click("#swap-preserve");
  await expect(page.getByText("Swapped region")).toBeVisible();
  await expect(detailOf(page, "preserved")).toBeVisible();
  await page.evaluate(() => {
    const seen: boolean[] = [];
    document.getElementById("preserved")?.addEventListener("primitiv-table-expand-change", (e) => {
      seen.push((e as CustomEvent<{ expanded: boolean }>).detail.expanded);
    });
    (window as unknown as { __seen: boolean[] }).__seen = seen;
  });
  await triggerIn(page, "preserved").click();
  expect(await page.evaluate(() => (window as unknown as { __seen: boolean[] }).__seen)).toEqual([false]);
  await expect(detailOf(page, "preserved")).toBeHidden();
});

test("7. history restore brings back a row the user left open", async ({ page }) => {
  await triggerIn(page, "history", "Grace").click();
  await page.click("#go-two");
  await expect(page.locator("#page-two")).toBeVisible();
  await page.goBack();
  await expect(triggerIn(page, "history", "Grace")).toHaveAttribute("aria-expanded", "true");
  await expect(detailOf(page, "history", "Grace")).toBeVisible();
  await expect(detailOf(page, "history")).toBeHidden();
});

test("8. a lazy detail row fetches its content the first time it opens, once", async ({ page }) => {
  await triggerIn(page, "lazy").click();
  const content = page.getByTestId("lazy-content");
  await expect(content).toBeVisible();
  const first = await content.textContent();
  await triggerIn(page, "lazy").click();
  await triggerIn(page, "lazy").click();
  await expect(content).toHaveText(first ?? "");
});

test("9. hx-trigger posts each change, and an hx-on handler can veto one", async ({ page }) => {
  await triggerIn(page, "echo").click();
  await expect(page.getByTestId("echo")).toContainText("server saw true");
  await triggerIn(page, "echo").click();
  await expect(triggerIn(page, "echo")).toHaveAttribute("aria-expanded", "true");
  await expect(detailOf(page, "echo")).toBeVisible();
});
