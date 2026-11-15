// The HTMX swap cases (RFC 0033 §7.4), run against Tree: parts that arrive,
// leave and move after first render, with no framework in between.
import { expect, test } from "./fixtures";

type Page = import("@playwright/test").Page;

test.beforeEach(async ({ page }) => {
  await page.goto("/tree-htmx.html");
  await page.waitForFunction(() => customElements.get("primitiv-tree") && "htmx" in window);
});

const itemIn = (page: Page, root: string, name: string) =>
  page.locator(`#${root}`).getByRole("treeitem", { name, exact: true }).first();

test("1. a whole tree arriving in a fragment upgrades with no script call", async ({ page }) => {
  await page.click("#load-tree");
  await expect(itemIn(page, "swapped", "API")).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#swapped primitiv-tree-selection-path [aria-current]")).toHaveText("API");
  await itemIn(page, "swapped", "Blog").click();
  await expect(page.locator("#swapped")).toHaveAttribute("value", "blog");
});

test("2. a tree swapped into another's item keeps its own items", async ({ page }) => {
  await page.click("#load-nested");
  await page.getByRole("treeitem", { name: "Post", exact: true }).click();
  await expect(page.locator("#inner")).toHaveAttribute("value", "post");
  await expect(page.locator("#outer")).not.toHaveAttribute("value");
  await expect(page.getByRole("treeitem", { name: "Post", exact: true })).toHaveAttribute("aria-level", "1");
});

test("3. a branch's children arriving out of band join it, a level down", async ({ page }) => {
  await page.click("#load-oob");
  await expect(itemIn(page, "oob", "One")).toHaveAttribute("aria-level", "2");
  await itemIn(page, "oob", "Lazy").focus();
  await page.keyboard.press("ArrowDown");
  await expect(itemIn(page, "oob", "One")).toBeFocused();
});

test("4. a server re-render, now selected, selects it", async ({ page }) => {
  await page.click("#load-selected");
  await expect(itemIn(page, "rerendered", "Blog")).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#rerendered primitiv-tree-selection-path")).toHaveText("Blog");
});

test("5. an hx-preserve'd tree keeps its state and handles each event once", async ({ page }) => {
  await itemIn(page, "preserved", "Docs").click();
  await page.click("#swap-preserve");
  await expect(page.getByText("Swapped region")).toBeVisible();
  await expect(page.locator("#preserved")).toHaveAttribute("value", "docs");
  await page.evaluate(() => {
    const seen: string[][] = [];
    document.getElementById("preserved")?.addEventListener("primitiv-tree-change", (e) => {
      seen.push((e as CustomEvent<{ value: string[] }>).detail.value);
    });
    (window as unknown as { __seen: string[][] }).__seen = seen;
  });
  await itemIn(page, "preserved", "Blog").click({ modifiers: ["Control"] });
  expect(await page.evaluate(() => (window as unknown as { __seen: string[][] }).__seen)).toEqual([["docs", "blog"]]);
});

test("6. history restore brings back the selection the user left", async ({ page }) => {
  await itemIn(page, "history", "API").click();
  await page.click("#go-two");
  await expect(page.locator("#page-two")).toBeVisible();
  await page.goBack();
  await expect(itemIn(page, "history", "API")).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#history primitiv-tree-selection-path [aria-current]")).toHaveText("API");
});

test("7. hx-trigger posts each change, and an hx-on handler can veto one", async ({ page }) => {
  await itemIn(page, "echo", "Docs").click();
  await expect(page.getByTestId("echo")).toContainText("server saw docs");
  await itemIn(page, "echo", "Blog").click();
  await expect(page.locator("#echo")).toHaveAttribute("value", "docs");
});
