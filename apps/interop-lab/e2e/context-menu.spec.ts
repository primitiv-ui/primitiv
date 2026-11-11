// The Context Menu element on a plain HTML page, in a real browser: what jsdom
// cannot vouch for — a real right-click and the keyboard's context-menu key,
// the menu placed at the pointer in the top layer, the browser's own menu kept
// shut, and a submenu closing with its menu — plus the contract a server
// relies on.
import { expect, test } from "./fixtures";

type Page = import("@playwright/test").Page;

const open = async (page: Page, query = "") => {
  await page.goto(`/context-menu.html${query}`);
  await page.waitForFunction(() => customElements.get("primitiv-context-menu"));
};

const region = (page: Page) => page.locator("primitiv-context-menu-trigger");
const menu = (page: Page) => page.locator("#context-menu-content");
const item = (page: Page, name: string) => page.getByRole("menuitem", { name, exact: true });
const isShowing = (page: Page, selector: string) =>
  page.evaluate((selector) => document.querySelector(selector)?.matches(":popover-open"), selector);
const rightClickAt = async (page: Page, x: number, y: number) => {
  await page.mouse.move(x, y);
  await page.mouse.down({ button: "right" });
  await page.mouse.up({ button: "right" });
};

test("adopts the server's markup: the menu stays hidden as a manual popover", async ({ page }) => {
  await open(page);
  await expect(menu(page)).toBeHidden();
  await expect(menu(page)).toHaveAttribute("popover", "manual");
  await expect(region(page)).toHaveAttribute("data-state", "closed");
});

test("a right-click opens it at the pointer in the top layer, focused on the first item, the browser's menu shut", async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    document.addEventListener("contextmenu", (event) => {
      (window as unknown as { __prevented: boolean }).__prevented = event.defaultPrevented;
    });
  });
  const box = (await region(page).boundingBox())!;
  const [x, y] = [box.x + 30, box.y + 20];
  await rightClickAt(page, x, y);
  await expect(menu(page)).toBeVisible();
  expect(await isShowing(page, "#context-menu-content")).toBe(true);
  await expect(item(page, "Copy")).toBeFocused();
  const m = (await menu(page).boundingBox())!;
  expect(Math.abs(m.x - x)).toBeLessThan(2);
  expect(Math.abs(m.y - y)).toBeLessThan(2);
  expect(await page.evaluate(() => (window as unknown as { __prevented: boolean }).__prevented)).toBe(true);
});

test("the keyboard's context-menu key opens it on the focused region", async ({ page }) => {
  await open(page);
  await region(page).focus();
  await page.keyboard.press("Shift+F10");
  await expect(menu(page)).toBeVisible();
  await expect(item(page, "Copy")).toBeFocused();
});

test("the arrows move, and Escape closes it", async ({ page }) => {
  await open(page);
  const box = (await region(page).boundingBox())!;
  await rightClickAt(page, box.x + 10, box.y + 10);
  await page.keyboard.press("ArrowDown");
  await expect(item(page, "Share")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator("#context-menu")).not.toHaveAttribute("open");
  await expect(menu(page)).toBeHidden();
});

test("a press outside closes it, and the state follows", async ({ page }) => {
  await open(page);
  const box = (await region(page).boundingBox())!;
  await rightClickAt(page, box.x + 10, box.y + 10);
  await page.getByRole("button", { name: "Outside" }).click();
  await expect(page.locator("#context-menu")).not.toHaveAttribute("open");
  await expect(menu(page)).toBeHidden();
});

test("an open submenu closes with the menu", async ({ page }) => {
  await open(page);
  const box = (await region(page).boundingBox())!;
  await rightClickAt(page, box.x + 10, box.y + 10);
  await item(page, "Share").hover();
  const submenu = page.locator("#share-content");
  await expect(submenu).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu(page)).toBeHidden();
  await expect(submenu).toBeHidden();
  await expect(page.locator("#share")).not.toHaveAttribute("open");
});

test("a disabled region opens nothing, and leaves the browser its own menu", async ({ page }) => {
  await open(page, "?disabled");
  await page.evaluate(() => {
    document.addEventListener("contextmenu", (event) => {
      (window as unknown as { __prevented: boolean }).__prevented = event.defaultPrevented;
      event.preventDefault();
    });
  });
  const box = (await region(page).boundingBox())!;
  await rightClickAt(page, box.x + 10, box.y + 10);
  await expect(menu(page)).toBeHidden();
  expect(await page.evaluate(() => (window as unknown as { __prevented: boolean }).__prevented)).toBe(false);
});

test("a server-rendered open menu shows on upgrade", async ({ page }) => {
  await open(page, "?open");
  await expect(menu(page)).toBeVisible();
});

test("a cancelled change keeps it open through a press outside", async ({ page }) => {
  await open(page);
  await page.evaluate(() =>
    document.getElementById("context-menu")?.addEventListener("primitiv-context-menu-change", (e) => {
      if (!(e as CustomEvent<{ open: boolean }>).detail.open) e.preventDefault();
    }),
  );
  const box = (await region(page).boundingBox())!;
  await rightClickAt(page, box.x + 10, box.y + 10);
  await page.getByRole("button", { name: "Outside" }).click();
  await expect(page.locator("#context-menu")).toHaveAttribute("open", "");
  await expect(menu(page)).toBeVisible();
});
