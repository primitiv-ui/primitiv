// The ten HTMX swap cases (RFC 0033 §7.4). Nothing re-renders the elements on
// HTMX's behalf, so these are the hardest test of their lifecycle: parts that
// arrive, leave and move after first render, with no framework in between.
import { expect, test } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await page.goto("/htmx.html");
  await page.waitForFunction(() => customElements.get("primitiv-tabs") && "htmx" in window);
});

const tabIn = (page: import("@playwright/test").Page, root: string, name: string) =>
  page.locator(`#${root}`).getByRole("tab", { name, exact: true });

test("1. a whole tab set arriving in a fragment upgrades with no script call", async ({ page }) => {
  await page.click("#load-tabs");
  await expect(tabIn(page, "swapped", "Two")).toHaveAttribute("aria-selected", "true");
  await tabIn(page, "swapped", "Three").click();
  await expect(page.locator("#swapped")).toHaveAttribute("value", "three");
});

test("2. a tab set swapped into another's panel stays independent of it", async ({ page }) => {
  await page.click("#load-nested");
  await page.getByRole("tab", { name: "Inner B" }).click();
  await expect(page.getByRole("tab", { name: "Inner B" })).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#outer")).toHaveAttribute("value", "one");
  await expect(page.locator("#outer-list").getByRole("tab")).toHaveCount(3);
});

test("3. an out-of-band trigger and panel join the existing set in DOM order", async ({ page }) => {
  await page.click("#load-oob");
  await expect(tabIn(page, "oob", "Four")).toHaveAttribute("role", "tab");
  await tabIn(page, "oob", "Three").focus();
  await page.keyboard.press("ArrowRight");
  await expect(tabIn(page, "oob", "Four")).toBeFocused();
  await expect(page.locator("#oob").getByRole("tabpanel")).toHaveText("Fourth panel");
});

test("4. a server re-render with a new value selects it", async ({ page }) => {
  await page.click("#load-value");
  await expect(tabIn(page, "rerendered", "Three")).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#rerendered").getByRole("tabpanel")).toHaveText("Third panel");
});

test("5. an hx-preserve'd tab set keeps its state and handles each event once", async ({ page }) => {
  await tabIn(page, "preserved", "Two").click();
  await page.click("#swap-preserve");
  await expect(page.getByText("Swapped region")).toBeVisible();
  await expect(page.locator("#preserved")).toHaveAttribute("value", "two");
  const changes = await page.evaluate(() => {
    const seen: string[] = [];
    document.getElementById("preserved")?.addEventListener("primitiv-tabs-change", (e) => {
      seen.push((e as CustomEvent<{ value: string }>).detail.value);
    });
    (window as unknown as { __seen: string[] }).__seen = seen;
    return seen.length;
  });
  expect(changes).toBe(0);
  await tabIn(page, "preserved", "Three").click();
  expect(await page.evaluate(() => (window as unknown as { __seen: string[] }).__seen)).toEqual(["three"]);
  await expect(page.locator("#preserved").getByRole("tabpanel")).toHaveText("Third panel");
});

test("6. history restore brings back the selection the user left", async ({ page }) => {
  await tabIn(page, "history", "Three").click();
  await page.click("#go-two");
  await expect(page.locator("#page-two")).toBeVisible();
  await page.goBack();
  await expect(tabIn(page, "history", "Three")).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#history").getByRole("tabpanel")).toHaveText("Third panel");
});

test("7. a lazy panel fetches its content on first show, once", async ({ page }) => {
  await tabIn(page, "lazy", "Two").click();
  const content = page.getByTestId("lazy-content");
  await expect(content).toBeVisible();
  const first = await content.textContent();
  await tabIn(page, "lazy", "One").click();
  await tabIn(page, "lazy", "Two").click();
  await expect(content).toHaveText(first ?? "");
});

test("8. hx-trigger posts each change, and an hx-on handler can veto one", async ({ page }) => {
  await tabIn(page, "echo", "Two").click();
  await expect(page.getByTestId("echo")).toContainText("server saw two");
  await tabIn(page, "echo", "Three").click();
  await expect(page.locator("#echo")).toHaveAttribute("value", "two");
  await expect(tabIn(page, "echo", "Two")).toHaveAttribute("aria-selected", "true");
});

test("9. swapping a focused tab set away leaves nothing broken behind", async ({ page }) => {
  await tabIn(page, "focused", "One").focus();
  await page.evaluate(() =>
    (window as unknown as { htmx: { ajax: (verb: string, url: string, target: string) => Promise<void> } }).htmx.ajax(
      "GET",
      "/fragments/replacement",
      "#focus-region",
    ),
  );
  await expect(page.locator("#replacement")).toBeAttached();
  await page.keyboard.press("ArrowRight");
  await tabIn(page, "replacement", "One").focus();
  await page.keyboard.press("ArrowRight");
  await expect(tabIn(page, "replacement", "Two")).toBeFocused();
  await expect(page.locator("#replacement")).toHaveAttribute("value", "two");
});

test("10. arrows mirror inside a right-to-left fragment", async ({ page }) => {
  await page.click("#load-rtl");
  await tabIn(page, "rtl", "One").focus();
  await page.keyboard.press("ArrowLeft");
  await expect(tabIn(page, "rtl", "Two")).toBeFocused();
});
