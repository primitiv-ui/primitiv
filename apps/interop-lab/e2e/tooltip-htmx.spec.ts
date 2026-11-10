// The HTMX swap cases (RFC 0033 §7.4) that apply to a tooltip, run against
// Tooltip: parts that arrive, leave and move after first render, with no
// framework in between. (History has no Tooltip counterpart: following a link
// closes the tooltip first, so there is never an open one to restore.)
import { expect, test } from "./fixtures";

type Page = import("@playwright/test").Page;

test.beforeEach(async ({ page }) => {
  await page.goto("/tooltip-htmx.html");
  await page.waitForFunction(() => customElements.get("primitiv-tooltip") && "htmx" in window);
});

const isShowing = (page: Page, root: string) =>
  page.evaluate((id) => document.querySelector(`#${id} primitiv-tooltip-content`)?.matches(":popover-open"), root);
const swap = (page: Page, fragment: string, target: string, swap = "innerHTML") =>
  page.evaluate(
    ([fragment, target, swap]) =>
      (window as unknown as { htmx: { ajax(verb: string, path: string, context: object): Promise<void> } }).htmx.ajax(
        "GET",
        `/fragments/${fragment}`,
        { target, swap },
      ),
    [fragment, target, swap],
  );

test("1. a whole open tooltip arriving in a fragment shows with no script call", async ({ page }) => {
  await page.click("#load-tooltip");
  await expect(page.getByRole("tooltip", { name: "Swapped tip" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#swapped")).not.toHaveAttribute("open");
});

test("2. content arriving out of band describes the trigger and opens on focus", async ({ page }) => {
  await page.click("#load-oob");
  const trigger = page.getByRole("button", { name: "Out of band" });
  await expect(trigger).toHaveAttribute("aria-describedby", "oob-content");
  await trigger.focus();
  await expect(page.getByRole("tooltip", { name: "Arrived late" })).toBeVisible();
});

test("3. a server re-render, now open, shows it", async ({ page }) => {
  await page.click("#load-open");
  await expect(page.getByRole("tooltip", { name: "Rerendered tip" })).toBeVisible();
});

test("4. an hx-preserve'd open tooltip stays open and shown, handling each event once", async ({ page }) => {
  await page.getByRole("button", { name: "Preserved" }).focus();
  await swap(page, "tooltip-preserve", "#preserve-region", "outerHTML");
  await expect(page.getByText("Swapped region")).toBeVisible();
  await expect(page.locator("#preserved")).toHaveAttribute("open", "");
  await expect.poll(() => isShowing(page, "preserved")).toBe(true);
  await page.evaluate(() => {
    const seen: boolean[] = [];
    document.getElementById("preserved")?.addEventListener("primitiv-tooltip-change", (e) => {
      seen.push((e as CustomEvent<{ open: boolean }>).detail.open);
    });
    (window as unknown as { __seen: boolean[] }).__seen = seen;
  });
  await page.keyboard.press("Escape");
  await expect(page.locator("#preserved")).not.toHaveAttribute("open");
  expect(await page.evaluate(() => (window as unknown as { __seen: boolean[] }).__seen)).toEqual([false]);
});

test("5. an open tooltip swapped away does not open the next one at once", async ({ page }) => {
  await page.getByRole("button", { name: "Doomed" }).focus();
  await expect(page.getByRole("tooltip", { name: "Doomed tip" })).toBeVisible();
  await swap(page, "tooltip-gone", "#doomed-region");
  await expect(page.locator("#doomed")).not.toBeAttached();
  await page.waitForTimeout(400);
  await page.getByRole("button", { name: "Next" }).hover();
  await page.waitForTimeout(200);
  await expect(page.locator("#next")).not.toHaveAttribute("open");
  await expect(page.getByRole("tooltip", { name: "Next tip" })).toBeVisible();
});

test("6. hx-trigger posts each change, and an hx-on handler can veto one", async ({ page }) => {
  await page.getByRole("button", { name: "Echo" }).focus();
  await expect(page.getByTestId("echo")).toContainText("server saw true");
  await page.keyboard.press("Escape");
  await expect(page.locator("#echo")).toHaveAttribute("open", "");
  await expect(page.getByRole("tooltip", { name: "Echo tip" })).toBeVisible();
});
