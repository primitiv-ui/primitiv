// The Carousel element on a plain HTML page, in a real browser: native
// scroll-snap and scrollsnapchange, smooth programmatic scrolling, a real
// pointer drag and the infinite loop's transform, none of which jsdom lays out.
import { expect, test } from "./fixtures";

const open = async (page: import("@playwright/test").Page, query = "") => {
  await page.goto(`/carousel.html${query}`);
  await page.waitForFunction(() => customElements.get("primitiv-carousel"));
};

const carousel = (page: import("@playwright/test").Page) => page.locator("#carousel");
const slide = (page: import("@playwright/test").Page, n: number) => page.getByRole("group", { name: `${n} of 3`, exact: true });
const button = (page: import("@playwright/test").Page, name: string) => page.getByRole("button", { name, exact: true });
/** The viewport's scroll along its axis, once it settles. */
const scrolled = (page: import("@playwright/test").Page, axis: "scrollLeft" | "scrollTop" = "scrollLeft") =>
  page.locator("primitiv-carousel-viewport").evaluate((viewport, key) => Math.round(viewport[key as "scrollLeft"]), axis);

test("adopts the server's markup: a named region on its first page, the previous trigger disabled", async ({ page }) => {
  await open(page);
  await expect(page.getByRole("region", { name: "carousel carousel" })).toHaveAttribute("aria-roledescription", "carousel");
  await expect(slide(page, 1)).toHaveAttribute("data-state", "active");
  await expect(button(page, "carousel previous")).toBeDisabled();
  await expect(page.getByRole("button", { name: /^Slide \d$/ })).toHaveCount(3);
});

test("next scrolls the viewport to the second slide", async ({ page }) => {
  await open(page);
  await button(page, "carousel next").click();
  await expect(carousel(page)).toHaveAttribute("page", "1");
  await expect.poll(() => scrolled(page)).toBe(300);
});

test("the page follows the user's own scroll, once scroll-snap settles", async ({ page }) => {
  await open(page);
  await page.locator("primitiv-carousel-viewport").evaluate((viewport) => viewport.scrollTo({ left: 610, behavior: "instant" }));
  await expect(carousel(page)).toHaveAttribute("page", "2");
  await expect(slide(page, 3)).toHaveAttribute("data-state", "active");
});

test("the viewport is in the Tab order and pages with the arrow keys", async ({ page }) => {
  await open(page);
  await page.keyboard.press("Tab");
  await expect(page.locator("primitiv-carousel-viewport")).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(carousel(page)).toHaveAttribute("page", "1");
  await page.keyboard.press("End");
  await expect(carousel(page)).toHaveAttribute("page", "2");
  await expect.poll(() => scrolled(page)).toBe(600);
});

test("a vertical carousel scrolls its block axis", async ({ page }) => {
  await open(page, "?orientation=vertical");
  await page.locator("primitiv-carousel-viewport").focus();
  await page.keyboard.press("ArrowDown");
  await expect(carousel(page)).toHaveAttribute("page", "1");
  await expect.poll(() => scrolled(page, "scrollTop")).toBe(100);
});

test("a mouse drag scrolls the viewport and settles on a slide", async ({ page }) => {
  await open(page, "?drag");
  const box = (await page.locator("primitiv-carousel-viewport").boundingBox())!;
  await page.mouse.move(box.x + 250, box.y + 50);
  await page.mouse.down();
  await page.mouse.move(box.x + 150, box.y + 50, { steps: 5 });
  await expect(page.locator("primitiv-carousel-viewport")).toHaveAttribute("data-dragging", "");
  await page.mouse.up();
  await expect(page.locator("primitiv-carousel-viewport")).not.toHaveAttribute("data-dragging", "");
  await expect(carousel(page)).toHaveAttribute("page", "1");
});

test("an indicator jumps to its page", async ({ page }) => {
  await open(page);
  await button(page, "Slide 3").click();
  await expect(carousel(page)).toHaveAttribute("page", "2");
  await expect(button(page, "Slide 3")).toHaveAttribute("aria-disabled", "true");
});

test("next at the last page wraps to the first while looping", async ({ page }) => {
  await open(page, "?loop=wrap&page=2");
  // The first scroll, to the server's page, is smooth: let it land before paging on.
  await expect.poll(() => scrolled(page)).toBe(600);
  await button(page, "carousel next").click();
  await expect(carousel(page)).toHaveAttribute("page", "0");
  await expect.poll(() => scrolled(page)).toBe(0);
});

test("an infinite loop glides onto a copy past the last slide and re-bases to the real first one", async ({ page }) => {
  await open(page, "?loop=infinite&page=2");
  const track = page.locator("primitiv-carousel-track");
  await expect(page.locator("[data-carousel-clone]")).toHaveCount(6);
  await expect(page.getByRole("group", { name: /of 3$/ })).toHaveCount(3);
  const resting = await track.evaluate((element) => element.style.transform);
  await button(page, "carousel next").click();
  await expect(carousel(page)).toHaveAttribute("page", "0");
  // Once the glide settles, the track re-bases to the real first slide: one period back.
  await expect
    .poll(() => track.evaluate((element) => element.style.transition === "none" && element.style.transform))
    .toBe(resting.replace(/-?\d+(\.\d+)?px, 0px/, (match) => `${parseFloat(match) + 600}px, 0px`));
});

test("autoplay advances on its own and pauses while the pointer is over it", async ({ page }) => {
  await open(page, "?autoplay");
  await expect(carousel(page)).toHaveAttribute("page", "1", { timeout: 2000 });
  await page.locator("primitiv-carousel-viewport").hover();
  const paused = await carousel(page).getAttribute("page");
  await page.waitForTimeout(900);
  await expect(carousel(page)).toHaveAttribute("page", paused as string);
  await expect(page.locator("primitiv-carousel-viewport")).toHaveAttribute("aria-live", "off");
});

test("next scrolls a right-to-left carousel the other way", async ({ page }) => {
  await open(page, "?dir=rtl");
  await button(page, "carousel next").click();
  await expect(carousel(page)).toHaveAttribute("page", "1");
  await expect.poll(() => scrolled(page)).toBe(-300);
});
