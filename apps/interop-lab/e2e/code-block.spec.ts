// The Code Block copy control on a plain HTML page, in a real browser and a
// real clipboard: what lands there is the code as the reader sees it.
import { expect, test } from "./fixtures";

test.use({ permissions: ["clipboard-read", "clipboard-write"] });

const open = async (page: import("@playwright/test").Page, query = "") => {
  await page.goto(`/code-block.html${query}`);
  await page.waitForFunction(() => customElements.get("primitiv-code-block-copy") && customElements.get("primitiv-tabs"));
};

const copyIn = (page: import("@playwright/test").Page, id: string) =>
  page.locator(`#${id}`).getByRole("button", { name: /^Cop/ });
const clipboard = (page: import("@playwright/test").Page) => page.evaluate(() => navigator.clipboard.readText());

test("copies the block's code as it is shown", async ({ page }) => {
  await open(page);
  await copyIn(page, "block").click();
  await expect.poll(() => clipboard(page)).toBe("const a = 1;\nconst b = 2;");
});

test("leaves an aria-hidden line-number gutter out of the copy", async ({ page }) => {
  await open(page, "?line-numbers");
  await copyIn(page, "block").click();
  await expect.poll(() => clipboard(page)).toBe("const a = 1;\nconst b = 2;");
});

test("reads Copied, showing its copied glyph, then goes back after two seconds", async ({ page }) => {
  await open(page);
  const button = copyIn(page, "block");
  await button.click();
  await expect(button).toHaveAccessibleName("Copied");
  await expect(button.locator('[data-copy-state="copied"]')).toBeVisible();
  await expect(button.locator('[data-copy-state="idle"]')).toBeHidden();
  await expect(button).toHaveAccessibleName("Copy code", { timeout: 4000 });
  await expect(button.locator('[data-copy-state="idle"]')).toBeVisible();
});

test("copies from the keyboard: the button turns Enter into a press", async ({ page }) => {
  await open(page);
  await copyIn(page, "block").focus();
  await page.keyboard.press("Enter");
  await expect.poll(() => clipboard(page)).toBe("const a = 1;\nconst b = 2;");
});

test("a tabbed block copies the panel that is shown, following the tabs", async ({ page }) => {
  await open(page);
  await copyIn(page, "tabbed").click();
  await expect.poll(() => clipboard(page)).toBe("npm install primitiv");
  await page.getByRole("tab", { name: "pnpm" }).click();
  await copyIn(page, "tabbed").click();
  await expect.poll(() => clipboard(page)).toBe("pnpm add primitiv");
});

test("copies the block its for names", async ({ page }) => {
  await open(page, "?for=other");
  await copyIn(page, "block").click();
  await expect.poll(() => clipboard(page)).toBe("echo elsewhere");
});

test("a cancelled copy event copies nothing", async ({ page }) => {
  await open(page);
  await page.evaluate(() => navigator.clipboard.writeText("untouched"));
  await page.evaluate(() => document.addEventListener("primitiv-code-block-copy", (e) => e.preventDefault()));
  await copyIn(page, "block").click();
  await expect(copyIn(page, "block")).toHaveAccessibleName("Copy code");
  expect(await clipboard(page)).toBe("untouched");
});

test("a <primitiv-code-block> highlights its code and numbers it, and copies it as it was written", async ({ page }) => {
  await open(page);
  const block = page.locator("#highlighting");
  await expect(block.locator(".token.keyword").first()).toHaveText("const");
  await expect(block.locator(".primitiv-code-block__ln")).toHaveCount(4);
  await copyIn(page, "highlighting").click();
  await expect.poll(() => clipboard(page)).toBe("const a = 1;\nif (a) {\n  run();\n}");
});

test("loading Prism leaves the page's other language-* blocks alone", async ({ page }) => {
  await open(page);
  await expect(page.locator("#highlighting .token").first()).toBeAttached();
  // Prism's own pass, when it is not told it is manual, runs a frame after it
  // loads and stamps each block's language class onto its <pre> — even for a
  // language whose grammar it has not loaded, so this shows whether it ran.
  await page.waitForTimeout(200);
  expect(await page.locator("#page-prism code").innerHTML()).toBe("a { color: red; }");
  await expect(page.locator("#page-prism")).not.toHaveAttribute("class");
});
