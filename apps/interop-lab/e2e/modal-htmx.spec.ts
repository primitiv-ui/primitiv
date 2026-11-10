// The HTMX swap cases (RFC 0033 §7.4) that apply to a dialog, run against
// Modal: parts that arrive, leave and move after first render, with no
// framework in between. (The RTL and lazy-panel cases have no Modal
// counterpart: a dialog reads no direction and has no panel to load.)
import { expect, test } from "./fixtures";

type Page = import("@playwright/test").Page;

test.beforeEach(async ({ page }) => {
  await page.goto("/modal-htmx.html");
  await page.waitForFunction(() => customElements.get("primitiv-modal") && "htmx" in window);
});

const dialogOf = (page: Page, root: string) => page.locator(`#${root} dialog`).first();
const isModal = (page: Page, root: string) =>
  page.evaluate((id) => document.querySelector(`#${id} dialog`)?.matches(":modal"), root);

test("1. a whole open modal arriving in a fragment opens modally with no script call", async ({ page }) => {
  await page.click("#load-modal");
  await expect(page.getByRole("dialog", { name: "Swapped" })).toBeVisible();
  expect(await isModal(page, "swapped")).toBe(true);
  await page.keyboard.press("Escape");
  await expect(page.locator("#swapped")).not.toHaveAttribute("open");
});

test("2. a modal swapped into another's dialog stacks on top and closes on its own", async ({ page }) => {
  await page.getByRole("button", { name: "Open outer" }).click();
  await page.click("#load-nested");
  await page.getByRole("button", { name: "Open inner" }).click();
  await expect(page.getByRole("dialog", { name: "Inner" })).toBeVisible();
  expect(await isModal(page, "inner")).toBe(true);
  await page.keyboard.press("Escape");
  await expect(page.locator("#inner")).not.toHaveAttribute("open");
  await expect(page.locator("#outer")).toHaveAttribute("open", "");
  await expect(page.getByRole("dialog", { name: "Outer" })).toBeVisible();
});

test("3. a dialog arriving out of band is wired to the trigger", async ({ page }) => {
  await page.click("#load-oob");
  const trigger = page.getByRole("button", { name: "Open out of band" });
  await expect(trigger).toHaveAttribute("aria-controls", "oob-content");
  await trigger.click();
  await expect(page.getByRole("dialog", { name: "Out of band" })).toBeVisible();
});

test("4. a server re-render, now open, opens it modally", async ({ page }) => {
  await page.click("#load-open");
  await expect(page.getByRole("dialog", { name: "Rerendered" })).toBeVisible();
  expect(await isModal(page, "rerendered")).toBe(true);
});

test("5. an hx-preserve'd open modal stays open and modal, handling each event once", async ({ page }) => {
  await page.getByRole("button", { name: "Open preserved" }).click();
  await page.click("#swap-preserve");
  await expect(page.getByText("Swapped region")).toBeAttached();
  await expect(page.locator("#preserved")).toHaveAttribute("open", "");
  await expect(dialogOf(page, "preserved")).toBeVisible();
  expect(await isModal(page, "preserved")).toBe(true);
  await page.evaluate(() => {
    const seen: boolean[] = [];
    document.getElementById("preserved")?.addEventListener("primitiv-modal-change", (e) => {
      seen.push((e as CustomEvent<{ open: boolean }>).detail.open);
    });
    (window as unknown as { __seen: boolean[] }).__seen = seen;
  });
  await page.keyboard.press("Escape");
  await expect(page.locator("#preserved")).not.toHaveAttribute("open");
  expect(await page.evaluate(() => (window as unknown as { __seen: boolean[] }).__seen)).toEqual([false]);
});

test("6. history restore brings a modal the user left open back open, and modal", async ({ page }) => {
  await page.getByRole("button", { name: "Open history" }).click();
  await page.click("#go-two");
  await expect(page.locator("#page-two")).toBeAttached();
  await page.goBack();
  await expect(page.locator("#history")).toHaveAttribute("open", "");
  await expect(page.getByRole("dialog", { name: "History" })).toBeVisible();
  expect(await isModal(page, "history")).toBe(true);
});

test("7. hx-trigger posts each change, and an hx-on handler can veto one", async ({ page }) => {
  await page.getByRole("button", { name: "Open echo" }).click();
  await expect(page.getByTestId("echo")).toContainText("server saw true");
  await page.keyboard.press("Escape");
  await expect(page.locator("#echo")).toHaveAttribute("open", "");
  await expect(page.getByRole("dialog", { name: "Echo" })).toBeVisible();
});
