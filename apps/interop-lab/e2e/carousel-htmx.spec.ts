// The HTMX swap cases (RFC 0033 §7.4), run against Carousel: parts that arrive
// and move after first render, with no framework in between.
import { expect, test } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await page.goto("/carousel-htmx.html");
  await page.waitForFunction(() => customElements.get("primitiv-carousel") && "htmx" in window);
});

const button = (page: import("@playwright/test").Page, name: string) => page.getByRole("button", { name, exact: true });

test("1. a carousel arriving in a fragment upgrades on the page the server rendered", async ({ page }) => {
  await page.click("#load-carousel");
  await expect(page.locator("#swapped primitiv-carousel-slide").nth(1)).toHaveAttribute("data-state", "active");
  await button(page, "swapped next").click();
  await expect(page.locator("#swapped")).toHaveAttribute("page", "2");
});

test("2. an out-of-band slide joins the carousel, with an indicator of its own", async ({ page }) => {
  await page.click("#load-oob");
  await expect(page.getByRole("group", { name: "4 of 4" })).toBeVisible();
  await expect(page.locator("#oob primitiv-carousel-indicator")).toHaveCount(4);
});

test("3. a server re-render on a new page shows that page", async ({ page }) => {
  await page.click("#load-page");
  await expect(page.locator("#rerendered primitiv-carousel-slide").nth(2)).toHaveAttribute("data-state", "active");
  await expect(button(page, "rerendered next")).toBeDisabled();
});

test("4. an hx-preserve'd carousel keeps its page and handles each click once", async ({ page }) => {
  await button(page, "preserved next").click();
  await page.click("#swap-preserve");
  await expect(page.getByText("Swapped region")).toBeVisible();
  await expect(page.locator("#preserved")).toHaveAttribute("page", "1");
  await page.evaluate(() => {
    const seen: number[] = [];
    document.getElementById("preserved")?.addEventListener("primitiv-carousel-change", (e) => {
      seen.push((e as CustomEvent<{ page: number }>).detail.page);
    });
    (window as unknown as { __seen: number[] }).__seen = seen;
  });
  await button(page, "preserved next").click();
  expect(await page.evaluate(() => (window as unknown as { __seen: number[] }).__seen)).toEqual([2]);
});

test("5. history restore brings back the page the user left", async ({ page }) => {
  await button(page, "history next").click();
  await button(page, "history next").click();
  await expect(page.locator("#history")).toHaveAttribute("page", "2");
  await page.click("#go-two");
  await expect(page.locator("#page-two")).toBeVisible();
  await page.goBack();
  await expect(page.locator("#history primitiv-carousel-slide").nth(2)).toHaveAttribute("data-state", "active");
});

test("6. hx-trigger posts each page change, and an hx-on handler can veto one", async ({ page }) => {
  await button(page, "echo next").click();
  await expect(page.getByTestId("echo")).toContainText("server saw 1");
  await button(page, "echo next").click();
  await expect(page.locator("#echo")).toHaveAttribute("page", "1");
});

test("7. a carousel nested in a slide keeps its own slides and controls", async ({ page }) => {
  await page.click("#load-nested");
  await button(page, "inner next").click();
  await expect(page.locator("#inner")).toHaveAttribute("page", "1");
  await expect(page.locator("#outer")).not.toHaveAttribute("page", /./);
  const outer = page.locator("#nested-slot");
  await expect(outer.getByRole("group", { name: "1 of 3" })).toHaveCount(1);
  await expect(outer.getByRole("group", { name: "1 of 2" })).toHaveCount(1);
});
