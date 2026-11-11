// The HTMX swap cases (RFC 0033 §7.4), run against Slider: parts that arrive
// and move after first render, with no framework in between.
import { expect, test } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await page.goto("/slider-htmx.html");
  await page.waitForFunction(() => customElements.get("primitiv-slider") && "htmx" in window);
});

const thumb = (page: import("@playwright/test").Page, root: string, n = 1) =>
  page.getByRole("slider", { name: `${root} thumb ${n}`, exact: true });

test("1. a slider arriving in a fragment upgrades with no script call", async ({ page }) => {
  await page.click("#load-slider");
  await expect(thumb(page, "swapped")).toHaveAttribute("aria-valuenow", "30");
  await thumb(page, "swapped").focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#swapped")).toHaveAttribute("value", "31");
});

test("2. an out-of-band thumb joins the slider, taking the value at its position", async ({ page }) => {
  await page.click("#load-oob");
  await page.evaluate(() => document.getElementById("oob")?.setAttribute("value", "20 50 80"));
  await expect(thumb(page, "oob", 3)).toHaveAttribute("aria-valuenow", "80");
});

test("3. a server re-render with a new value moves the thumb", async ({ page }) => {
  await page.click("#load-value");
  await expect(thumb(page, "rerendered")).toHaveAttribute("aria-valuenow", "75");
  await expect(thumb(page, "rerendered")).toHaveCSS("left", "150px");
});

test("4. an hx-preserve'd slider keeps its value and handles each event once", async ({ page }) => {
  await thumb(page, "preserved").focus();
  await page.keyboard.press("PageUp");
  await page.click("#swap-preserve");
  await expect(page.getByText("Swapped region")).toBeVisible();
  await expect(page.locator("#preserved")).toHaveAttribute("value", "50");
  await page.evaluate(() => {
    const seen: number[][] = [];
    document.getElementById("preserved")?.addEventListener("primitiv-slider-change", (e) => {
      seen.push((e as CustomEvent<{ value: number[] }>).detail.value);
    });
    (window as unknown as { __seen: number[][] }).__seen = seen;
  });
  await thumb(page, "preserved").focus();
  await page.keyboard.press("ArrowRight");
  expect(await page.evaluate(() => (window as unknown as { __seen: number[][] }).__seen)).toEqual([[51]]);
});

test("5. history restore brings back the value the user left", async ({ page }) => {
  await thumb(page, "history").focus();
  await page.keyboard.press("End");
  await page.click("#go-two");
  await expect(page.locator("#page-two")).toBeVisible();
  await page.goBack();
  await expect(thumb(page, "history")).toHaveAttribute("aria-valuenow", "100");
});

test("6. hx-trigger posts each commit, and an hx-on handler can veto a change", async ({ page }) => {
  await thumb(page, "echo").focus();
  await page.keyboard.press("PageUp");
  await expect(page.getByTestId("echo")).toContainText("server saw 50");
  await page.keyboard.press("PageUp");
  await page.keyboard.press("PageUp");
  await expect(page.locator("#echo")).toHaveAttribute("value", "60");
});

test("7. horizontal arrows mirror inside a right-to-left fragment", async ({ page }) => {
  await page.click("#load-rtl");
  await thumb(page, "rtl").focus();
  await page.keyboard.press("ArrowLeft");
  await expect(thumb(page, "rtl")).toHaveAttribute("aria-valuenow", "41");
});
