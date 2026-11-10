// The Popover element on a plain HTML page, in a real browser: what jsdom
// cannot vouch for — the native top layer and light dismiss, real focus, and
// Escape — plus the attribute contract a server relies on.
import { expect, test } from "./fixtures";

type Page = import("@playwright/test").Page;

const open = async (page: Page, query = "") => {
  await page.goto(`/popover.html${query}`);
  await page.waitForFunction(() => customElements.get("primitiv-popover"));
};

const trigger = (page: Page) => page.getByRole("button", { name: "Edit profile", exact: true });
const panel = (page: Page) => page.getByRole("dialog", { name: "Profile" });
const isShowing = (page: Page) =>
  page.evaluate(() => document.querySelector("primitiv-popover-content")?.matches(":popover-open"));

test("adopts the server's markup: the panel stays hidden, the trigger points at it", async ({ page }) => {
  await open(page);
  await expect(trigger(page)).toHaveAttribute("aria-haspopup", "dialog");
  await expect(trigger(page)).toHaveAttribute("aria-controls", "popover-content");
  await expect(page.locator("primitiv-popover-content")).toBeHidden();
});

test("a click opens it in the top layer and moves focus inside", async ({ page }) => {
  await open(page);
  await trigger(page).click();
  await expect(panel(page)).toBeVisible();
  expect(await isShowing(page)).toBe(true);
  await expect(page.getByRole("textbox", { name: "Name" })).toBeFocused();
});

test("Escape closes it and hands focus back to the trigger", async ({ page }) => {
  await open(page);
  await trigger(page).click();
  await page.keyboard.press("Escape");
  await expect(page.locator("#popover")).not.toHaveAttribute("open");
  await expect(panel(page)).toBeHidden();
  await expect(trigger(page)).toBeFocused();
});

test("a press outside light-dismisses it, and the state follows", async ({ page }) => {
  await open(page, "?open");
  await page.getByRole("button", { name: "Outside" }).click();
  await expect(page.locator("#popover")).not.toHaveAttribute("open");
  await expect(panel(page)).toBeHidden();
});

test("the trigger toggles it closed again, exactly once", async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    const seen: boolean[] = [];
    document.getElementById("popover")?.addEventListener("primitiv-popover-change", (e) => {
      seen.push((e as CustomEvent<{ open: boolean }>).detail.open);
    });
    (window as unknown as { __seen: boolean[] }).__seen = seen;
  });
  await trigger(page).click();
  await trigger(page).click();
  await expect(panel(page)).toBeHidden();
  expect(await page.evaluate(() => (window as unknown as { __seen: boolean[] }).__seen)).toEqual([true, false]);
});

test("the close button closes it", async ({ page }) => {
  await open(page, "?open");
  await page.getByRole("button", { name: "Done" }).click();
  await expect(page.locator("#popover")).not.toHaveAttribute("open");
});

test("a server-rendered open popover shows on upgrade", async ({ page }) => {
  await open(page, "?open");
  await expect(panel(page)).toBeVisible();
  await expect(trigger(page)).toHaveAttribute("aria-expanded", "true");
});

test("a cancelled change keeps it open through a light dismiss", async ({ page }) => {
  await open(page);
  await page.evaluate(() =>
    document.getElementById("popover")?.addEventListener("primitiv-popover-change", (e) => {
      if (!(e as CustomEvent<{ open: boolean }>).detail.open) e.preventDefault();
    }),
  );
  await trigger(page).click();
  await page.getByRole("button", { name: "Outside" }).click();
  await expect(page.locator("#popover")).toHaveAttribute("open", "");
  await expect(panel(page)).toBeVisible();
});
