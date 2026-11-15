// The HTMX swap cases (RFC 0033 §7.4) that apply to a copy control: blocks and
// code that arrive and change after first render, with no framework in between.
import { expect, test } from "./fixtures";

test.use({ permissions: ["clipboard-read", "clipboard-write"] });

test.beforeEach(async ({ page }) => {
  await page.goto("/code-block-htmx.html");
  await page.waitForFunction(() => customElements.get("primitiv-code-block-copy") && "htmx" in window);
});

const copyIn = (page: import("@playwright/test").Page, id: string) =>
  page.locator(`#${id}`).getByRole("button", { name: /^Cop/ });
const clipboard = (page: import("@playwright/test").Page) => page.evaluate(() => navigator.clipboard.readText());

test("1. a whole block arriving in a fragment copies with no script call", async ({ page }) => {
  await page.click("#load-block");
  await copyIn(page, "swapped").click();
  await expect.poll(() => clipboard(page)).toBe("echo swapped");
});

test("2. code the server re-renders is what the next press copies", async ({ page }) => {
  await page.click("#load-code");
  await expect(page.locator("#rerendered code")).toHaveText("const fresh = true;\n");
  await copyIn(page, "rerendered").click();
  await expect.poll(() => clipboard(page)).toBe("const fresh = true;");
});

test("3. a tab panel's code arriving out of band is copied once its tab is shown", async ({ page }) => {
  await page.click("#load-oob");
  await page.locator("#oob").getByRole("tab", { name: "pnpm" }).click();
  await copyIn(page, "oob").click();
  await expect.poll(() => clipboard(page)).toBe("pnpm add primitiv");
});

test("4. an hx-preserve'd block keeps copying and announces each press once", async ({ page }) => {
  await page.click("#swap-preserve");
  await expect(page.getByText("Swapped region")).toBeVisible();
  await page.evaluate(() => {
    const seen: string[] = [];
    document.getElementById("preserved")?.addEventListener("primitiv-code-block-copy", (e) => {
      seen.push((e as CustomEvent<{ text: string }>).detail.text);
    });
    (window as unknown as { __seen: string[] }).__seen = seen;
  });
  await copyIn(page, "preserved").click();
  await expect.poll(() => clipboard(page)).toBe("const a = 1;\nconst b = 2;");
  expect(await page.evaluate(() => (window as unknown as { __seen: string[] }).__seen)).toHaveLength(1);
});

test("5. history restore mid-copy brings the button back idle, with its own label", async ({ page }) => {
  await copyIn(page, "history").click();
  await expect(copyIn(page, "history")).toHaveAccessibleName("Copied");
  await page.click("#go-two");
  await expect(page.locator("#page-two")).toBeVisible();
  await page.goBack();
  await expect(copyIn(page, "history")).toHaveAccessibleName("Copy code");
  await expect(copyIn(page, "history").locator('[data-copy-state="idle"]')).toBeVisible();
});

test("6. hx-trigger posts each copy, with the text copied", async ({ page }) => {
  await copyIn(page, "echo").click();
  await expect(page.getByTestId("echo")).toContainText("server saw const a = 1;");
});
