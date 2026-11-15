// The Tree elements on a plain HTML page, in a real browser: what jsdom cannot
// vouch for — real focus and the roving tab stop, the real modifier keys, and
// `:dir()` — plus the attribute contract a server relies on.
import { expect, test } from "./fixtures";

type Page = import("@playwright/test").Page;

const open = async (page: Page, query = "") => {
  await page.goto(`/tree.html${query}`);
  await page.waitForFunction(() => document.querySelector("primitiv-tree")?.getAttribute("role") === "tree");
};

const item = (page: Page, name: string) => page.getByRole("treeitem", { name, exact: true });
const tree = (page: Page) => page.locator("#tree");

test("adopts the server's markup: a tree with one tab stop and its collapsed groups hidden", async ({ page }) => {
  await open(page);
  await expect(page.getByRole("tree", { name: "Site" })).toBeVisible();
  await expect(page.getByRole("treeitem")).toHaveCount(2);
  await expect(item(page, "Docs")).toHaveAttribute("tabindex", "0");
  await expect(item(page, "Blog")).toHaveAttribute("tabindex", "-1");
});

test("Tab lands on the tab stop, and the arrow keys expand, enter and travel", async ({ page }) => {
  await open(page);
  await page.keyboard.press("Tab");
  await expect(item(page, "Docs")).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(item(page, "Docs")).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("ArrowRight");
  await expect(item(page, "Guides")).toBeFocused();
  await page.keyboard.press("End");
  await expect(item(page, "Blog")).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await expect(item(page, "Blog")).toBeFocused();
});

test("a click on a row toggles and selects its branch, and the path follows", async ({ page }) => {
  await open(page, "?expanded=docs");
  await page.getByText("Guides", { exact: true }).click();
  await expect(tree(page)).toHaveAttribute("value", "guides");
  await expect(tree(page)).toHaveAttribute("expanded", "docs guides");
  await expect(page.locator("primitiv-tree-selection-path [aria-current]")).toHaveText("Guides");
});

test("real Shift and Control clicks select a range and add to it", async ({ page }) => {
  await open(page, "?multiple&expanded=docs,guides");
  await item(page, "Intro").click();
  await item(page, "API").click({ modifiers: ["Shift"] });
  await item(page, "Blog").click({ modifiers: ["Control"] });
  await expect(tree(page)).toHaveAttribute("value", "intro setup api blog");
});

test("an inherited rtl leaves the tree's arrows as they are, since it is a vertical widget", async ({ page }) => {
  await open(page, "?rtl");
  await item(page, "Docs").focus();
  await page.keyboard.press("ArrowRight");
  await expect(item(page, "Docs")).toHaveAttribute("aria-expanded", "true");
});

test("a listener can veto a selection", async ({ page }) => {
  await open(page);
  await page.evaluate(() =>
    document.getElementById("tree")?.addEventListener("primitiv-tree-change", (e) => e.preventDefault()),
  );
  await item(page, "Blog").click();
  await expect(tree(page)).not.toHaveAttribute("value");
  await expect(item(page, "Blog")).toHaveAttribute("aria-selected", "false");
});
