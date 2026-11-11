// The HTMX swap cases (RFC 0033 §7.4), run against ToggleGroup: parts that
// arrive, leave and move after first render, with no framework in between.
import { expect, test } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await page.goto("/toggle-group-htmx.html");
  await page.waitForFunction(() => customElements.get("primitiv-toggle-group") && "htmx" in window);
});

const itemIn = (page: import("@playwright/test").Page, root: string, name: string) =>
  page.locator(`#${root}`).getByRole("button", { name, exact: true });

test("1. a whole group arriving in a fragment upgrades with no script call", async ({ page }) => {
  await page.click("#load-group");
  await expect(itemIn(page, "swapped", "Italic")).toHaveAttribute("aria-pressed", "true");
  await itemIn(page, "swapped", "Underline").click();
  await expect(page.locator("#swapped")).toHaveAttribute("value", "underline");
});

test("2. a group swapped into another stays independent of it", async ({ page }) => {
  await page.click("#load-nested");
  await page.getByRole("button", { name: "Inner A" }).click();
  await expect(page.getByRole("button", { name: "Inner A" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#outer")).toHaveAttribute("value", "bold");
  await expect(itemIn(page, "outer", "Bold")).toHaveAttribute("tabindex", "0");
});

test("3. an out-of-band item joins the existing group in DOM order", async ({ page }) => {
  await page.click("#load-oob");
  await expect(itemIn(page, "oob", "Strike")).toHaveAttribute("aria-pressed", "false");
  await itemIn(page, "oob", "Underline").focus();
  await page.keyboard.press("ArrowRight");
  await expect(itemIn(page, "oob", "Strike")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(itemIn(page, "oob", "Strike")).toHaveAttribute("aria-pressed", "true");
});

test("4. a server re-render with a new value presses it", async ({ page }) => {
  await page.click("#load-value");
  await expect(itemIn(page, "rerendered", "Underline")).toHaveAttribute("aria-pressed", "true");
  await expect(itemIn(page, "rerendered", "Bold")).toHaveAttribute("aria-pressed", "false");
});

test("5. an hx-preserve'd group keeps its state and handles each event once", async ({ page }) => {
  await itemIn(page, "preserved", "Italic").click();
  await page.click("#swap-preserve");
  await expect(page.getByText("Swapped region")).toBeVisible();
  await expect(page.locator("#preserved")).toHaveAttribute("value", "italic");
  await page.evaluate(() => {
    const seen: string[][] = [];
    document.getElementById("preserved")?.addEventListener("primitiv-toggle-group-change", (e) => {
      seen.push((e as CustomEvent<{ value: string[] }>).detail.value);
    });
    (window as unknown as { __seen: string[][] }).__seen = seen;
  });
  await itemIn(page, "preserved", "Underline").click();
  expect(await page.evaluate(() => (window as unknown as { __seen: string[][] }).__seen)).toEqual([["underline"]]);
});

test("6. history restore brings back the items the user left pressed", async ({ page }) => {
  await itemIn(page, "history", "Underline").click();
  await page.click("#go-two");
  await expect(page.locator("#page-two")).toBeVisible();
  await page.goBack();
  await expect(itemIn(page, "history", "Underline")).toHaveAttribute("aria-pressed", "true");
  await expect(itemIn(page, "history", "Bold")).toHaveAttribute("aria-pressed", "true");
});

test("7. hx-trigger posts each change, and an hx-on handler can veto one", async ({ page }) => {
  await itemIn(page, "echo", "Italic").click();
  await expect(page.getByTestId("echo")).toContainText("server saw italic");
  await itemIn(page, "echo", "Underline").click();
  await expect(page.locator("#echo")).toHaveAttribute("value", "italic");
  await expect(itemIn(page, "echo", "Underline")).toHaveAttribute("aria-pressed", "false");
});

test("8. horizontal arrows mirror inside a right-to-left fragment", async ({ page }) => {
  await page.click("#load-rtl");
  await itemIn(page, "rtl", "Bold").focus();
  await page.keyboard.press("ArrowLeft");
  await expect(itemIn(page, "rtl", "Italic")).toBeFocused();
});
