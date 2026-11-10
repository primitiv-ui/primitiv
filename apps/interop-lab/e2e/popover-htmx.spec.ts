// The HTMX swap cases (RFC 0033 §7.4) that apply to a popover, run against
// Popover: parts that arrive, leave and move after first render, with no
// framework in between. (The RTL and lazy-panel cases have no Popover
// counterpart: placement is CSS, and the panel has no show event.)
import { expect, test } from "./fixtures";

type Page = import("@playwright/test").Page;

test.beforeEach(async ({ page }) => {
  await page.goto("/popover-htmx.html");
  await page.waitForFunction(() => customElements.get("primitiv-popover") && "htmx" in window);
});

const isShowing = (page: Page, root: string) =>
  page.evaluate((id) => document.querySelector(`#${id} primitiv-popover-content`)?.matches(":popover-open"), root);

test("1. a whole open popover arriving in a fragment shows with no script call", async ({ page }) => {
  await page.click("#load-popover");
  await expect(page.getByRole("dialog", { name: "Swapped" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#swapped")).not.toHaveAttribute("open");
});

test("2. a popover swapped into another's panel opens on top and closes on its own", async ({ page }) => {
  await page.getByRole("button", { name: "Open outer" }).click();
  await page.click("#load-nested");
  await page.getByRole("button", { name: "Open inner" }).click();
  await expect(page.getByRole("dialog", { name: "Inner" })).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Outer" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#inner")).not.toHaveAttribute("open");
  await expect(page.locator("#outer")).toHaveAttribute("open", "");
});

test("3. a panel arriving out of band is wired to the trigger", async ({ page }) => {
  await page.click("#load-oob");
  const trigger = page.getByRole("button", { name: "Open out of band" });
  await expect(trigger).toHaveAttribute("aria-controls", "oob-content");
  await trigger.click();
  await expect(page.getByRole("dialog", { name: "Out of band" })).toBeVisible();
});

test("4. a server re-render, now open, shows it", async ({ page }) => {
  await page.click("#load-open");
  await expect(page.getByRole("dialog", { name: "Rerendered" })).toBeVisible();
});

test("5. an hx-preserve'd open popover stays open and shown, handling each event once", async ({ page }) => {
  await page.getByRole("button", { name: "Open preserved" }).click();
  await page.click("#swap-preserve");
  await expect(page.getByText("Swapped region")).toBeVisible();
  await expect(page.locator("#preserved")).toHaveAttribute("open", "");
  await expect.poll(() => isShowing(page, "preserved")).toBe(true);
  await page.evaluate(() => {
    const seen: boolean[] = [];
    document.getElementById("preserved")?.addEventListener("primitiv-popover-change", (e) => {
      seen.push((e as CustomEvent<{ open: boolean }>).detail.open);
    });
    (window as unknown as { __seen: boolean[] }).__seen = seen;
  });
  await page.getByRole("button", { name: "Open preserved" }).click();
  await expect(page.locator("#preserved")).not.toHaveAttribute("open");
  expect(await page.evaluate(() => (window as unknown as { __seen: boolean[] }).__seen)).toEqual([false]);
});

test("6. history restore brings a popover the user left open back open", async ({ page }) => {
  await page.getByRole("button", { name: "Open history" }).click();
  await page.click("#go-two");
  await expect(page.locator("#page-two")).toBeAttached();
  await page.goBack();
  await expect(page.locator("#history")).toHaveAttribute("open", "");
  await expect(page.getByRole("dialog", { name: "History" })).toBeVisible();
});

test("7. hx-trigger posts each change, and an hx-on handler can veto one", async ({ page }) => {
  await page.getByRole("button", { name: "Open echo" }).click();
  await expect(page.getByTestId("echo")).toContainText("server saw true");
  await page.keyboard.press("Escape");
  await expect(page.locator("#echo")).toHaveAttribute("open", "");
  await expect(page.getByRole("dialog", { name: "Echo" })).toBeVisible();
});
