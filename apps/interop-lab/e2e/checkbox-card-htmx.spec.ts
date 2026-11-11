// The HTMX swap cases (RFC 0033 §7.4), run against CheckboxCard: cards that
// arrive and move after first render, with no framework in between.
import { expect, test } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await page.goto("/checkbox-card-htmx.html");
  await page.waitForFunction(() => customElements.get("primitiv-checkbox-card") && "htmx" in window);
});

const card = (page: import("@playwright/test").Page, name: string) => page.getByRole("checkbox", { name, exact: true });

test("1. a card arriving in a fragment upgrades with no script call", async ({ page }) => {
  await page.click("#load-card");
  await expect(card(page, "Swapped")).toHaveAttribute("aria-checked", "mixed");
  await card(page, "Swapped").click();
  await expect(page.locator("#swapped")).toHaveAttribute("checked", "");
});

test("2. a card arriving out of band works beside the one already there", async ({ page }) => {
  await page.click("#load-oob");
  await card(page, "Second").click();
  await expect(card(page, "Second")).toHaveAttribute("aria-checked", "true");
  await expect(card(page, "First")).toHaveAttribute("aria-checked", "false");
});

test("3. a server re-render with a new state checks it", async ({ page }) => {
  await page.click("#load-value");
  await expect(card(page, "Re-rendered")).toHaveAttribute("aria-checked", "true");
});

test("4. an hx-preserve'd card keeps its state and handles each event once", async ({ page }) => {
  await card(page, "Preserved").click();
  await page.click("#swap-preserve");
  await expect(page.getByText("Swapped region")).toBeVisible();
  await expect(page.locator("#preserved")).toHaveAttribute("checked", "");
  await page.evaluate(() => {
    const seen: boolean[] = [];
    document.getElementById("preserved")?.addEventListener("primitiv-checkbox-card-change", (e) => {
      seen.push((e as CustomEvent<{ checked: boolean }>).detail.checked);
    });
    (window as unknown as { __seen: boolean[] }).__seen = seen;
  });
  await card(page, "Preserved").click();
  expect(await page.evaluate(() => (window as unknown as { __seen: boolean[] }).__seen)).toEqual([false]);
});

test("5. history restore brings back the state the user left", async ({ page }) => {
  await card(page, "History").click();
  await page.click("#go-two");
  await expect(page.locator("#page-two")).toBeVisible();
  await page.goBack();
  await expect(card(page, "History")).toHaveAttribute("aria-checked", "true");
});

test("6. hx-trigger posts each change, and an hx-on handler can veto one", async ({ page }) => {
  await card(page, "Echo").click();
  await expect(page.getByTestId("echo")).toContainText("server saw true");
  await card(page, "Veto").click();
  await expect(card(page, "Veto")).toHaveAttribute("aria-checked", "false");
});
