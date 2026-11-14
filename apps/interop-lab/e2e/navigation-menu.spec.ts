// The Navigation Menu elements on a plain HTML page, in a real browser: what
// jsdom cannot vouch for — the real pointer's enter-then-click order, `:dir()`,
// real focus, and the geometry the indicator and viewport publish — plus the
// attribute contract a server relies on.
import { expect, test } from "./fixtures";

type Page = import("@playwright/test").Page;

const open = async (page: Page, query = "") => {
  await page.goto(`/navigation-menu.html${query}`);
  await page.waitForFunction(() => document.querySelector("primitiv-navigation-menu")?.getAttribute("role"));
};

const trigger = (page: Page, name = "Docs") => page.getByRole("button", { name, exact: true });
const link = (page: Page, name: string) => page.getByRole("link", { name, exact: true });
const nav = (page: Page) => page.locator("#nav");

test("adopts the server's markup: a Main landmark, each trigger pointing at its hidden panel", async ({ page }) => {
  await open(page);
  await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
  await expect(trigger(page)).toHaveAttribute("aria-expanded", "false");
  await expect(trigger(page)).toHaveAttribute("aria-controls", "nav-panel-docs");
  await expect(page.locator("#nav-panel-docs")).toBeHidden();
});

test("the pointer that arrives to click keeps the panel its hover opened", async ({ page }) => {
  await open(page);
  await trigger(page).click();
  await expect(nav(page)).toHaveAttribute("value", "docs");
  await expect(link(page, "Guides")).toBeVisible();
});

test("hovering a sibling swaps the panel, and leaving the nav closes it", async ({ page }) => {
  await open(page);
  await trigger(page).hover();
  await trigger(page, "Blog").hover();
  await expect(nav(page)).toHaveAttribute("value", "blog");
  await page.mouse.move(5, 400);
  await expect(nav(page)).not.toHaveAttribute("value");
});

test("ArrowDown opens a panel and focuses its first link; Escape hands focus back", async ({ page }) => {
  await open(page);
  await trigger(page).focus();
  await page.keyboard.press("ArrowDown");
  await expect(link(page, "Guides")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(trigger(page)).toBeFocused();
  await expect(nav(page)).not.toHaveAttribute("value");
});

test("every entry stays in the Tab order, and Tab out of the nav closes it", async ({ page }) => {
  await open(page, "?value=docs");
  await link(page, "Pricing").focus();
  await page.keyboard.press("Tab");
  await expect(page.locator("#outside")).toBeFocused();
  await expect(nav(page)).not.toHaveAttribute("value");
});

test("reads the reading direction from :dir(), so an inherited rtl mirrors the arrows", async ({ page }) => {
  await open(page, "?rtl");
  await trigger(page).focus();
  await page.keyboard.press("ArrowLeft");
  await expect(trigger(page, "Blog")).toBeFocused();
});

test("publishes the open trigger's real geometry on the indicator", async ({ page }) => {
  await open(page);
  await trigger(page, "Blog").click();
  const [published, measured] = await page.evaluate(() => {
    const indicator = document.querySelector<HTMLElement>("[data-testid=indicator]") as HTMLElement;
    const blog = [...document.querySelectorAll("button")].find((b) => b.textContent === "Blog") as HTMLElement;
    return [
      [
        indicator.style.getPropertyValue("--primitiv-navigation-menu-indicator-position"),
        indicator.style.getPropertyValue("--primitiv-navigation-menu-indicator-size"),
      ],
      [`${blog.offsetLeft}px`, `${blog.offsetWidth}px`],
    ];
  });
  expect(published).toEqual(measured);
  expect(measured[1]).not.toBe("0px");
});

test("shares one viewport, sized to the open panel and kept through the close", async ({ page }) => {
  await open(page, "?viewport");
  await trigger(page, "Blog").click();
  const viewport = page.getByTestId("viewport");
  await expect(viewport).toHaveAttribute("data-value", "blog");
  const size = await viewport.evaluate((v) => v.style.getPropertyValue("--primitiv-navigation-menu-viewport-width"));
  expect(size).toMatch(/^[1-9]\d*px$/);
  await trigger(page, "Blog").click();
  await expect(viewport).toBeHidden();
  expect(await viewport.evaluate((v) => v.style.getPropertyValue("--primitiv-navigation-menu-viewport-width"))).toBe(size);
});

test("a listener can veto the change", async ({ page }) => {
  await open(page);
  await page.evaluate(() =>
    document.getElementById("nav")?.addEventListener("primitiv-navigation-menu-change", (e) => e.preventDefault()),
  );
  await trigger(page).click();
  await expect(nav(page)).not.toHaveAttribute("value");
  await expect(trigger(page)).toHaveAttribute("aria-expanded", "false");
});
