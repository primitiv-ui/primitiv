// The HTMX swap cases (RFC 0033 §7.4) that apply to a menu, run against
// Context Menu: parts that arrive, leave and move after first render, with no
// framework in between. (History has no Context Menu counterpart: following a link
// from the menu chooses an item, which closes it, so there is never an open one
// to restore.) A context menu opens on a right-click in its region.
import { expect, test } from "./fixtures";

type Page = import("@playwright/test").Page;

test.beforeEach(async ({ page }) => {
  await page.goto("/context-menu-htmx.html");
  await page.waitForFunction(() => customElements.get("primitiv-context-menu") && "htmx" in window);
});

const isShowing = (page: Page, root: string) =>
  page.evaluate((id) => document.querySelector(`#${id} primitiv-context-menu-content`)?.matches(":popover-open"), root);

test("1. a whole open context menu arriving in a fragment shows with no script call", async ({ page }) => {
  await page.click("#load-context-menu");
  await expect(page.locator("#swapped-content")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#swapped")).not.toHaveAttribute("open");
});

test("2. a menu arriving out of band opens from its region", async ({ page }) => {
  await page.click("#load-oob");
  await page.getByText("Out of band", { exact: true }).click({ button: "right" });
  await expect(page.getByRole("menuitem", { name: "Arrived late" })).toBeFocused();
});

test("3. a server re-render, now open, shows it", async ({ page }) => {
  await page.click("#load-open");
  await expect.poll(() => isShowing(page, "rerendered")).toBe(true);
});

test("4. an hx-preserve'd open context menu stays open and shown, handling each event once", async ({ page }) => {
  await page.getByText("Preserved", { exact: true }).click({ button: "right" });
  await page.getByRole("menuitem", { name: "Swap region" }).click();
  await expect(page.getByText("Swapped region")).toBeVisible();
  await expect(page.locator("#preserved")).toHaveAttribute("open", "");
  await expect.poll(() => isShowing(page, "preserved")).toBe(true);
  await page.evaluate(() => {
    const seen: boolean[] = [];
    document.getElementById("preserved")?.addEventListener("primitiv-context-menu-change", (e) => {
      seen.push((e as CustomEvent<{ open: boolean }>).detail.open);
    });
    (window as unknown as { __seen: boolean[] }).__seen = seen;
  });
  await page.mouse.click(2, 2);
  await expect(page.locator("#preserved")).not.toHaveAttribute("open");
  expect(await page.evaluate(() => (window as unknown as { __seen: boolean[] }).__seen)).toEqual([false]);
});

test("5. items loaded into an open menu join its keyboard", async ({ page }) => {
  await page.getByText("Lazy", { exact: true }).click({ button: "right" });
  await expect(page.getByRole("menuitem", { name: "Loaded later" })).toBeAttached();
  await page.getByRole("menuitem", { name: "Load more" }).focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("menuitem", { name: "Loaded later" })).toBeFocused();
});

test("6. hx-trigger posts each change, and an hx-on handler can veto one", async ({ page }) => {
  await page.getByText("Echo", { exact: true }).click({ button: "right" });
  await expect(page.getByTestId("echo")).toContainText("server saw true");
  await page.keyboard.press("Escape");
  await expect(page.locator("#echo")).toHaveAttribute("open", "");
  await expect.poll(() => isShowing(page, "echo")).toBe(true);
});
