// The Dropdown element on a plain HTML page, in a real browser: what jsdom
// cannot vouch for — the native top layer and light dismiss, real focus and
// keys, a submenu placed beside its row, and the highlight holding steady as
// the pointer crosses a row's own children — plus the attribute contract a
// server relies on.
import { expect, test } from "./fixtures";

type Page = import("@playwright/test").Page;

const open = async (page: Page, query = "") => {
  await page.goto(`/dropdown.html${query}`);
  await page.waitForFunction(() => customElements.get("primitiv-dropdown"));
};

const trigger = (page: Page) => page.getByRole("button", { name: "Options", exact: true });
const menu = (page: Page) => page.locator("#dropdown-content");
const item = (page: Page, name: string) => page.getByRole("menuitem", { name, exact: true });
const isShowing = (page: Page, selector: string) =>
  page.evaluate((selector) => document.querySelector(selector)?.matches(":popover-open"), selector);

test("adopts the server's markup: the menu stays hidden, the trigger is its menu button", async ({ page }) => {
  await open(page);
  await expect(trigger(page)).toHaveAttribute("aria-haspopup", "menu");
  await expect(trigger(page)).toHaveAttribute("aria-controls", "dropdown-content");
  await expect(menu(page)).toBeHidden();
});

test("a click opens it in the top layer, below its trigger, with focus on the first item", async ({ page }) => {
  await open(page);
  await trigger(page).click();
  await expect(menu(page)).toBeVisible();
  expect(await isShowing(page, "#dropdown-content")).toBe(true);
  await expect(item(page, "Copy")).toBeFocused();
  const [t, m] = await Promise.all([trigger(page).boundingBox(), menu(page).boundingBox()]);
  expect(m!.y).toBeGreaterThanOrEqual(t!.y + t!.height);
});

test("the arrows move, Escape closes and hands focus back to the trigger", async ({ page }) => {
  await open(page);
  await trigger(page).click();
  await page.keyboard.press("ArrowDown");
  await expect(item(page, "Share")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator("#dropdown")).not.toHaveAttribute("open");
  await expect(trigger(page)).toBeFocused();
});

test("a press outside light-dismisses it, and the state follows", async ({ page }) => {
  await open(page, "?open");
  await page.getByRole("button", { name: "Outside" }).click();
  await expect(page.locator("#dropdown")).not.toHaveAttribute("open");
  await expect(menu(page)).toBeHidden();
});

test("choosing an item fires primitiv-dropdown-select once and closes the menu", async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    (window as unknown as { __selected: string[] }).__selected = [];
    document.addEventListener("primitiv-dropdown-select", (event) =>
      (window as unknown as { __selected: string[] }).__selected.push((event.target as Element).textContent ?? ""),
    );
  });
  await trigger(page).click();
  await item(page, "Delete").click();
  await expect(menu(page)).toBeHidden();
  await expect(trigger(page)).toBeFocused();
  expect(await page.evaluate(() => (window as unknown as { __selected: string[] }).__selected)).toEqual(["Delete"]);
});

test("a checkbox item toggles and its indicator shows only while it is checked", async ({ page }) => {
  await open(page);
  const grid = page.getByRole("menuitemcheckbox", { name: "Show grid" });
  const indicator = page.locator("primitiv-dropdown-checkbox-item primitiv-dropdown-item-indicator");
  await trigger(page).click();
  await expect(grid).toHaveAttribute("aria-checked", "false");
  await expect(indicator).toBeHidden();
  await grid.click();
  await trigger(page).click();
  await expect(grid).toHaveAttribute("aria-checked", "true");
  await expect(indicator).toBeVisible();
});

test("a submenu opens on hover beside its row, and closes when the pointer reaches another row", async ({ page }) => {
  await open(page);
  await trigger(page).click();
  await item(page, "Share").hover();
  const submenu = page.locator("#share-content");
  await expect(submenu).toBeVisible();
  expect(await isShowing(page, "#share-content")).toBe(true);
  const [row, sub] = await Promise.all([item(page, "Share").boundingBox(), submenu.boundingBox()]);
  expect(sub!.x).toBeGreaterThanOrEqual(row!.x + row!.width - 1);
  await item(page, "Delete").hover();
  await expect(submenu).toBeHidden();
  await expect(menu(page)).toBeVisible();
});

test("the submenu opens and closes from the keyboard, focus following", async ({ page }) => {
  await open(page);
  await trigger(page).click();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowRight");
  await expect(item(page, "Email")).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator("#share-content")).toBeHidden();
  await expect(item(page, "Share")).toBeFocused();
});

test("the highlight holds steady while the pointer crosses a row's own children", async ({ page }) => {
  await open(page);
  await trigger(page).click();
  const copy = item(page, "Copy");
  const box = (await copy.boundingBox())!;
  await page.mouse.move(box.x + 4, box.y + box.height / 2);
  await expect(copy).toHaveAttribute("data-highlighted", "");
  await page.evaluate(() => {
    const row = [...document.querySelectorAll("li")].find((li) => li.textContent?.startsWith("Copy")) as HTMLElement;
    const flips: string[] = [];
    new MutationObserver(() => flips.push(String(row.getAttribute("data-highlighted")))).observe(row, {
      attributeFilter: ["data-highlighted"],
    });
    (window as unknown as { __flips: string[] }).__flips = flips;
  });
  // Onto the shortcut span inside the row, and back off it.
  const shortcut = (await page.locator("#dropdown-copy-shortcut").boundingBox())!;
  await page.mouse.move(shortcut.x + 2, shortcut.y + shortcut.height / 2, { steps: 4 });
  await page.mouse.move(box.x + 4, box.y + box.height / 2, { steps: 4 });
  await expect(copy).toHaveAttribute("data-highlighted", "");
  expect(await page.evaluate(() => (window as unknown as { __flips: string[] }).__flips)).toEqual([]);
});

test("a disabled sub-trigger's highlight holds steady as the pointer crosses its children", async ({ page }) => {
  await open(page, "?subdisabled");
  await trigger(page).click();
  const share = item(page, "Share");
  const box = (await share.boundingBox())!;
  await page.mouse.move(box.x + 4, box.y + box.height / 2);
  await expect(share).toHaveAttribute("data-highlighted", "");
  await page.evaluate(() => {
    const row = [...document.querySelectorAll("li")].find((li) => li.textContent?.startsWith("Share")) as HTMLElement;
    const flips: string[] = [];
    new MutationObserver(() => flips.push(String(row.getAttribute("data-highlighted")))).observe(row, {
      attributeFilter: ["data-highlighted"],
    });
    (window as unknown as { __flips: string[] }).__flips = flips;
  });
  const chevron = (await page.locator("#dropdown-share-chevron").boundingBox())!;
  await page.mouse.move(chevron.x + 2, chevron.y + chevron.height / 2, { steps: 4 });
  await page.mouse.move(box.x + 4, box.y + box.height / 2, { steps: 4 });
  await expect(page.locator("#share-content")).toBeHidden();
  expect(await page.evaluate(() => (window as unknown as { __flips: string[] }).__flips)).toEqual([]);
});

test("a server-rendered open dropdown shows on upgrade", async ({ page }) => {
  await open(page, "?open");
  await expect(menu(page)).toBeVisible();
  await expect(trigger(page)).toHaveAttribute("aria-expanded", "true");
});

test("a cancelled change keeps it open through a light dismiss", async ({ page }) => {
  await open(page);
  await page.evaluate(() =>
    document.getElementById("dropdown")?.addEventListener("primitiv-dropdown-change", (e) => {
      if (!(e as CustomEvent<{ open: boolean }>).detail.open) e.preventDefault();
    }),
  );
  await trigger(page).click();
  await page.getByRole("button", { name: "Outside" }).click();
  await expect(page.locator("#dropdown")).toHaveAttribute("open", "");
  await expect(menu(page)).toBeVisible();
});
