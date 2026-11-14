// The HTMX swap cases (RFC 0033 §7.4), run against Navigation Menu: parts that
// arrive, leave and move after first render, with no framework in between.
import { expect, test } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await page.goto("/navigation-menu-htmx.html");
  await page.waitForFunction(() => customElements.get("primitiv-navigation-menu") && "htmx" in window);
});

// Clicking a control outside a menu moves focus out of it, which closes it — as
// it should. The cases below are about the swap, so they fire it without focus.
const press = (page: import("@playwright/test").Page, selector: string) =>
  page.locator(selector).evaluate((control: HTMLElement) => control.click());

const triggerIn = (page: import("@playwright/test").Page, root: string, name = "Docs") =>
  page.locator(`#${root}`).getByRole("button", { name, exact: true }).first();

test("1. a whole menu arriving in a fragment upgrades with no script call", async ({ page }) => {
  await page.click("#load-nav");
  await expect(triggerIn(page, "swapped")).toHaveAttribute("aria-expanded", "true");
  await triggerIn(page, "swapped").click();
  await expect(page.locator("#swapped")).not.toHaveAttribute("value");
});

test("2. a menu swapped into another's panel keeps its own parts", async ({ page }) => {
  await page.click("#load-nested");
  const inner = page.getByRole("button", { name: "Inner", exact: true });
  await inner.click();
  await expect(inner).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#inner")).toHaveAttribute("value", "docs");
  await expect(page.locator("#outer")).toHaveAttribute("value", "docs");
  await expect(triggerIn(page, "outer", "Outer")).toHaveAttribute("aria-controls", "outer-panel-docs");
});

test("3. a panel arriving out of band in the viewport is wired to its trigger", async ({ page }) => {
  await page.click("#load-oob");
  await expect(triggerIn(page, "oob")).toHaveAttribute("aria-controls", "oob-panel-docs");
  await triggerIn(page, "oob").click();
  await expect(page.getByRole("link", { name: "Out-of-band link" })).toBeVisible();
  await expect(page.locator("#oob-viewport")).toHaveAttribute("data-value", "docs");
});

test("4. a server re-render, now open, opens it", async ({ page }) => {
  await page.click("#load-open");
  await expect(triggerIn(page, "rerendered", "Blog")).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#rerendered").getByRole("link", { name: "Latest" })).toBeVisible();
});

test("5. an hx-preserve'd menu keeps its state and handles each event once", async ({ page }) => {
  // By keyboard throughout: the swap moves the menu, and a pointer the layout
  // shifts off it — or that travels to its new place — leaves the nav, which closes it.
  await triggerIn(page, "preserved").press("Enter");
  await press(page, "#swap-preserve");
  await expect(page.getByText("Swapped region")).toBeVisible();
  await expect(page.locator("#preserved")).toHaveAttribute("value", "docs");
  await page.evaluate(() => {
    const seen: string[] = [];
    document.getElementById("preserved")?.addEventListener("primitiv-navigation-menu-change", (e) => {
      seen.push((e as CustomEvent<{ value: string }>).detail.value);
    });
    (window as unknown as { __seen: string[] }).__seen = seen;
  });
  await triggerIn(page, "preserved").press("Enter");
  expect(await page.evaluate(() => (window as unknown as { __seen: string[] }).__seen)).toEqual([""]);
  await expect(page.locator("#preserved-panel-docs")).toBeHidden();
});

test("6. history restore brings back a menu the user left open", async ({ page }) => {
  await triggerIn(page, "history").click();
  await press(page, "#go-two");
  await expect(page.locator("#page-two")).toBeVisible();
  await page.goBack();
  await expect(triggerIn(page, "history")).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#history").getByRole("link", { name: "Guides" })).toBeVisible();
});

test("7. hx-trigger posts each change, and an hx-on handler can veto one", async ({ page }) => {
  await triggerIn(page, "echo").click();
  await expect(page.getByTestId("echo")).toContainText("server saw docs");
  await triggerIn(page, "echo").click();
  await expect(page.locator("#echo")).toHaveAttribute("value", "docs");
  await expect(triggerIn(page, "echo")).toHaveAttribute("aria-expanded", "true");
});
