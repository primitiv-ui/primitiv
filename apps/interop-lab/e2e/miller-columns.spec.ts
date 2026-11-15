// The Miller Columns elements on a plain HTML page, in a real browser: sibling
// columns opening along the path, real focus moving between them, and the
// attribute contract a server relies on.
import { expect, test } from "./fixtures";

const open = async (page: import("@playwright/test").Page, query = "") => {
  await page.goto(`/miller-columns.html${query}`);
  await page.waitForFunction(() => customElements.get("primitiv-miller-columns"));
};

const item = (page: import("@playwright/test").Page, name: string) => page.getByRole("treeitem", { name, exact: true });

test("adopts the server's markup: only the columns on the path are shown", async ({ page }) => {
  await open(page, "?value=docs");
  await expect(page.getByRole("tree", { name: "Files" })).toBeVisible();
  await expect(page.getByRole("group")).toHaveCount(2);
  await expect(item(page, "Docs")).toHaveAttribute("aria-expanded", "true");
  await expect(item(page, "Intro")).toBeHidden();
});

test("a click opens a branch's column and reflects the path into value", async ({ page }) => {
  await open(page);
  await item(page, "Docs").click();
  await item(page, "Guides").click();
  await expect(page.locator("#miller")).toHaveAttribute("value", "docs guides");
  await expect(item(page, "Intro")).toBeVisible();
});

test("ArrowRight steps into a branch's column and ArrowLeft back out, with real focus", async ({ page }) => {
  await open(page);
  await item(page, "Docs").focus();
  await page.keyboard.press("ArrowRight");
  await expect(item(page, "Guides")).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(item(page, "Docs")).toBeFocused();
});

test("mirrors the step keys right to left", async ({ page }) => {
  await open(page, "?dir=rtl");
  await item(page, "Docs").focus();
  await page.keyboard.press("ArrowLeft");
  await expect(item(page, "Guides")).toBeFocused();
});

test("the strip is a single tab stop", async ({ page }) => {
  await open(page, "?value=docs");
  await page.keyboard.press("Tab");
  await expect(item(page, "Docs")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.locator("primitiv-miller-columns-tree :focus")).toHaveCount(0);
});

test("a disabled item is skipped and never selected", async ({ page }) => {
  await open(page, "?disabled=blog");
  // aria-disabled reads as disabled to Playwright's actionability check.
  await item(page, "Blog").click({ force: true });
  await expect(page.locator("#miller")).toHaveAttribute("value", "");
  await item(page, "Docs").focus();
  await page.keyboard.press("ArrowDown");
  await expect(item(page, "Readme")).toBeFocused();
});

test("a cancelled change event keeps the path", async ({ page }) => {
  await open(page);
  await page.evaluate(() =>
    document.getElementById("miller")?.addEventListener("primitiv-miller-columns-change", (e) => e.preventDefault()),
  );
  await item(page, "Docs").click();
  await expect(page.getByRole("group")).toHaveCount(1);
});
