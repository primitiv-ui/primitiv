// The HTMX swap cases (RFC 0033 §7.4), run against Miller Columns: parts that
// arrive, leave and move after first render, with no framework in between.
import { expect, test } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await page.goto("/miller-columns-htmx.html");
  await page.waitForFunction(() => customElements.get("primitiv-miller-columns") && "htmx" in window);
});

const itemIn = (page: import("@playwright/test").Page, root: string, name: string) =>
  page.locator(`#${root}`).getByRole("treeitem", { name, exact: true });

test("1. a whole strip arriving in a fragment upgrades with no script call", async ({ page }) => {
  await page.click("#load-miller");
  await expect(itemIn(page, "swapped", "Intro")).toBeVisible();
  await expect(itemIn(page, "swapped", "Guides")).toHaveAttribute("data-terminal", "");
});

test("2. a strip swapped into another's preview panel keeps its own path", async ({ page }) => {
  await page.click("#load-nested");
  await expect(itemIn(page, "inner", "Post")).toBeVisible();
  await itemIn(page, "inner", "Readme").click();
  await expect(page.locator("#inner")).toHaveAttribute("value", "readme");
  await expect(page.locator("#outer")).toHaveAttribute("value", "readme");
  await expect(page.getByRole("tree", { name: "Outer" }).getByRole("treeitem")).toHaveCount(3);
});

test("3. a column arriving out of band makes its item a branch", async ({ page }) => {
  await expect(itemIn(page, "oob", "Blog")).not.toHaveAttribute("aria-expanded");
  await page.click("#load-oob");
  await expect(itemIn(page, "oob", "Blog")).toHaveAttribute("aria-expanded", "false");
  await itemIn(page, "oob", "Blog").click();
  await expect(itemIn(page, "oob", "Post")).toBeVisible();
});

test("4. a server re-render on a deeper path opens the deeper column", async ({ page }) => {
  await page.click("#load-deeper");
  await expect(itemIn(page, "rerendered", "Intro")).toBeVisible();
  await expect(page.locator("#rerendered")).toHaveAttribute("value", "docs guides");
});

test("5. an hx-preserve'd strip keeps its path and handles each event once", async ({ page }) => {
  await itemIn(page, "preserved", "Docs").click();
  await page.click("#swap-preserve");
  await expect(page.getByText("Swapped region")).toBeVisible();
  await expect(page.locator("#preserved")).toHaveAttribute("value", "docs");
  await page.evaluate(() => {
    const seen: string[][] = [];
    document.getElementById("preserved")?.addEventListener("primitiv-miller-columns-change", (e) => {
      seen.push((e as CustomEvent<{ value: string[] }>).detail.value);
    });
    (window as unknown as { __seen: string[][] }).__seen = seen;
  });
  await itemIn(page, "preserved", "API").click();
  expect(await page.evaluate(() => (window as unknown as { __seen: string[][] }).__seen)).toEqual([["docs", "api"]]);
});

test("6. history restore brings back the path the user opened", async ({ page }) => {
  await itemIn(page, "history", "Docs").click();
  await itemIn(page, "history", "Guides").click();
  await page.click("#go-two");
  await expect(page.locator("#page-two")).toBeVisible();
  await page.goBack();
  await expect(itemIn(page, "history", "Intro")).toBeVisible();
  await expect(itemIn(page, "history", "Guides")).toHaveAttribute("aria-selected", "true");
});

test("7. a lazy column fetches its items the first time it opens, once", async ({ page }) => {
  await itemIn(page, "lazy", "Blog").click();
  await expect(page.locator("#lazy").getByRole("treeitem", { name: /Lazy post/ })).toBeVisible();
  await itemIn(page, "lazy", "Readme").click();
  await itemIn(page, "lazy", "Blog").click();
  await expect(page.locator("#lazy").getByRole("treeitem", { name: /Lazy post/ })).toHaveCount(1);
});

test("8. hx-trigger posts each change of path, and an hx-on handler can veto one", async ({ page }) => {
  await itemIn(page, "echo", "Docs").click();
  await expect(page.getByTestId("miller-echo")).toContainText("server saw docs");
  await itemIn(page, "echo", "Blog").click();
  await expect(page.locator("#echo")).toHaveAttribute("value", "docs");
});
