// The HTMX swap cases (RFC 0033 §7.4), run against SplitButton: split buttons
// that arrive and move after first render, with no framework in between.
import { expect, test } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await page.goto("/split-button-htmx.html");
  await page.waitForFunction(() => customElements.get("primitiv-split-button") && "htmx" in window);
});

const action = (page: import("@playwright/test").Page, name: string) => page.getByRole("button", { name, exact: true });
const group = (page: import("@playwright/test").Page, id: string) => page.locator(`#${id}`);

test("1. a split button arriving in a fragment upgrades with no script call", async ({ page }) => {
  await page.click("#load-split");
  await action(page, "Swapped").focus();
  await page.keyboard.press("ArrowDown");
  await expect(group(page, "swapped")).toHaveAttribute("data-state", "open");
  await expect(page.getByRole("menuitem", { name: "Swapped and close" })).toBeFocused();
});

test("2. a split button arriving out of band works beside the one already there", async ({ page }) => {
  await page.click("#load-oob");
  await action(page, "Second").focus();
  await page.keyboard.press("ArrowDown");
  await expect(group(page, "second")).toHaveAttribute("data-state", "open");
  await expect(group(page, "first")).toHaveAttribute("data-state", "closed");
});

test("3. a server re-render as disabled disables both halves", async ({ page }) => {
  await page.click("#load-value");
  await expect(action(page, "Rerendered")).toBeDisabled();
  await expect(page.locator("#rerendered primitiv-dropdown-trigger button")).toBeDisabled();
});

test("4. an hx-preserve'd split button keeps working and opens once per key", async ({ page }) => {
  await page.click("#swap-preserve");
  await expect(page.getByText("Swapped region")).toBeVisible();
  await page.evaluate(() => {
    const seen: boolean[] = [];
    document.getElementById("preserved")?.addEventListener("primitiv-dropdown-change", (e) => {
      seen.push((e as CustomEvent<{ open: boolean }>).detail.open);
    });
    (window as unknown as { __seen: boolean[] }).__seen = seen;
  });
  await action(page, "Preserved").focus();
  await page.keyboard.press("ArrowDown");
  await expect(group(page, "preserved")).toHaveAttribute("data-state", "open");
  expect(await page.evaluate(() => (window as unknown as { __seen: boolean[] }).__seen)).toEqual([true]);
});

test("5. history restore brings back working split buttons", async ({ page }) => {
  await page.click("#go-two");
  await expect(page.locator("#page-two")).toBeVisible();
  await page.goBack();
  await action(page, "History").focus();
  await page.keyboard.press("ArrowDown");
  await expect(group(page, "history")).toHaveAttribute("data-state", "open");
});

test("6. hx-trigger posts each menu change, and an hx-on handler can veto one", async ({ page }) => {
  await action(page, "Echo").focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByTestId("echo")).toContainText("server saw true");
  await action(page, "Veto").focus();
  await page.keyboard.press("ArrowDown");
  await expect(group(page, "veto")).toHaveAttribute("data-state", "closed");
});

test("7. right to left, the halves keep their roles and the menu still opens", async ({ page }) => {
  await page.click("#load-rtl");
  await action(page, "Rtl").focus();
  await page.keyboard.press("ArrowDown");
  await expect(group(page, "rtl")).toHaveAttribute("data-state", "open");
  await expect(page.getByRole("menuitem", { name: "Rtl and close" })).toBeFocused();
});
