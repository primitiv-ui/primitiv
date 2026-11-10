// The Tooltip element on a plain HTML page, in a real browser: what jsdom
// cannot vouch for — the native top layer, real hover and focus, the hover
// delay, the grace period and the skip delay — plus the attribute contract a
// server relies on.
import { expect, test } from "./fixtures";

type Page = import("@playwright/test").Page;

const open = async (page: Page, query = "") => {
  await page.goto(`/tooltip.html${query}`);
  await page.waitForFunction(() => customElements.get("primitiv-tooltip"));
};

const save = (page: Page) => page.getByRole("button", { name: "Save", exact: true });
const share = (page: Page) => page.getByRole("button", { name: "Share", exact: true });
const tip = (page: Page, name: string) => page.getByRole("tooltip", { name });
const isShowing = (page: Page, id: string) =>
  page.evaluate((id) => document.querySelector(`#${id} primitiv-tooltip-content`)?.matches(":popover-open"), id);

test("adopts the server's markup: the tooltip stays hidden, the trigger is described by it", async ({ page }) => {
  await open(page);
  await expect(save(page)).toHaveAttribute("aria-describedby", "save-content");
  await expect(page.locator("#save primitiv-tooltip-content")).toBeHidden();
});

test("focus opens it at once in the top layer, and blur closes it", async ({ page }) => {
  await open(page);
  await page.keyboard.press("Tab");
  await expect(tip(page, "Saves your work")).toBeVisible();
  expect(await isShowing(page, "save")).toBe(true);
  await expect(save(page)).toHaveAccessibleDescription("Saves your work");
  await page.keyboard.press("Tab");
  await expect(tip(page, "Saves your work")).toBeHidden();
});

test("hover opens it only after the delay", async ({ page }) => {
  await open(page);
  await save(page).hover();
  await page.waitForTimeout(200);
  await expect(page.locator("#save")).not.toHaveAttribute("open");
  await expect(tip(page, "Saves your work")).toBeVisible();
});

test("the pointer can cross from the trigger onto the tooltip without it closing", async ({ page }) => {
  await open(page);
  await save(page).hover();
  await expect(tip(page, "Saves your work")).toBeVisible();
  await tip(page, "Saves your work").hover();
  await page.waitForTimeout(300);
  await expect(tip(page, "Saves your work")).toBeVisible();
  await page.mouse.move(0, 0);
  await expect(tip(page, "Saves your work")).toBeHidden();
});

test("leaving the trigger closes it after the grace period", async ({ page }) => {
  await open(page);
  await save(page).hover();
  await expect(tip(page, "Saves your work")).toBeVisible();
  await page.mouse.move(0, 400);
  await expect(tip(page, "Saves your work")).toBeHidden();
});

test("moving straight to the next trigger opens its tooltip at once", async ({ page }) => {
  await open(page);
  await save(page).hover();
  await expect(tip(page, "Saves your work")).toBeVisible();
  await share(page).hover();
  await page.waitForTimeout(100);
  await expect(tip(page, "Copies a link")).toBeVisible();
  await expect(tip(page, "Saves your work")).toBeHidden();
});

test("Escape closes it", async ({ page }) => {
  await open(page);
  await page.keyboard.press("Tab");
  await expect(tip(page, "Saves your work")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#save")).not.toHaveAttribute("open");
  await expect(tip(page, "Saves your work")).toBeHidden();
  await expect(save(page)).toBeFocused();
});

test("a press outside closes it", async ({ page }) => {
  await open(page, "?open");
  await page.mouse.click(5, 400);
  await expect(page.locator("#save")).not.toHaveAttribute("open");
});

test("a server-rendered open tooltip shows on upgrade", async ({ page }) => {
  await open(page, "?open");
  await expect(tip(page, "Saves your work")).toBeVisible();
  await expect(save(page)).toHaveAttribute("data-state", "open");
});

test("a cancelled change keeps it open through Escape", async ({ page }) => {
  await open(page, "?open");
  await page.evaluate(() =>
    document.getElementById("save")?.addEventListener("primitiv-tooltip-change", (e) => {
      if (!(e as CustomEvent<{ open: boolean }>).detail.open) e.preventDefault();
    }),
  );
  await page.keyboard.press("Escape");
  await expect(page.locator("#save")).toHaveAttribute("open", "");
  await expect(tip(page, "Saves your work")).toBeVisible();
});
