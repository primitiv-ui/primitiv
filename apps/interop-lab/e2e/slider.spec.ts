// The Slider element on a plain HTML page, in a real browser: real pointer
// geometry (which jsdom cannot lay out), `:dir()`, focus and Tab order, the
// inline positions, and the hidden inputs a form submits.
import { expect, test } from "./fixtures";

const open = async (page: import("@playwright/test").Page, query = "") => {
  await page.goto(`/slider.html${query}`);
  await page.waitForFunction(() => customElements.get("primitiv-slider"));
};

const thumb = (page: import("@playwright/test").Page, n = 1) =>
  page.getByRole("slider", { name: `slider thumb ${n}`, exact: true });

test("adopts the server's markup: a slider thumb stating and showing its value", async ({ page }) => {
  await open(page);
  await expect(thumb(page)).toHaveAttribute("aria-valuenow", "40");
  await expect(thumb(page)).toHaveCSS("left", "80px");
});

test("a press jumps the thumb there and a drag follows the pointer until release", async ({ page }) => {
  await open(page);
  const box = (await page.locator("#slider").boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.7, box.y + box.height / 2);
  await page.mouse.down();
  await expect(thumb(page)).toHaveAttribute("aria-valuenow", "70");
  await expect(thumb(page)).toBeFocused();
  await page.mouse.move(box.x + box.width * 0.25, box.y + box.height / 2);
  await page.mouse.up();
  await page.mouse.move(box.x + box.width * 0.9, box.y + box.height / 2);
  await expect(page.locator("#slider")).toHaveAttribute("value", "25");
});

test("a vertical slider reads a press from the bottom", async ({ page }) => {
  await open(page, "?orientation=vertical");
  const box = (await page.locator("#slider").boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.75);
  await expect(thumb(page)).toHaveAttribute("aria-valuenow", "25");
});

test("the keys step the focused thumb, and every thumb is in the Tab order", async ({ page }) => {
  await open(page, "?value=20 80");
  await page.keyboard.press("Tab");
  await expect(thumb(page, 1)).toBeFocused();
  await page.keyboard.press("PageUp");
  await page.keyboard.press("Tab");
  await expect(thumb(page, 2)).toBeFocused();
  await page.keyboard.press("End");
  await expect(page.locator("#slider")).toHaveAttribute("value", "30 100");
});

test("horizontal arrows and presses mirror under an inherited dir=rtl", async ({ page }) => {
  await open(page, "?dir=rtl");
  await thumb(page).focus();
  await page.keyboard.press("ArrowLeft");
  await expect(thumb(page)).toHaveAttribute("aria-valuenow", "41");
  await expect(thumb(page)).toHaveCSS("right", "82px");
  const box = (await page.locator("#slider").boundingBox())!;
  await page.mouse.click(box.x + box.width * 0.25, box.y + box.height / 2);
  await expect(thumb(page)).toHaveAttribute("aria-valuenow", "75");
});

test("a disabled slider leaves the Tab order and ignores presses", async ({ page }) => {
  await open(page, "?disabled");
  await page.keyboard.press("Tab");
  await expect(thumb(page)).not.toBeFocused();
  const box = (await page.locator("#slider").boundingBox())!;
  await page.mouse.click(box.x + box.width * 0.9, box.y + box.height / 2);
  await expect(thumb(page)).toHaveAttribute("aria-valuenow", "40");
});

test("a form submits its values from the hidden inputs it keeps", async ({ page }) => {
  await open(page, "?value=20 60&name=price");
  await thumb(page, 2).focus();
  await page.keyboard.press("ArrowRight");
  const data = await page.evaluate(() => {
    const form = document.createElement("form");
    const slider = document.getElementById("slider") as HTMLElement;
    slider.replaceWith(form);
    form.append(slider);
    return [...new FormData(form)];
  });
  expect(data).toEqual([
    ["price[]", "20"],
    ["price[]", "61"],
  ]);
});

test("a cancelled change event keeps the value", async ({ page }) => {
  await open(page);
  await page.evaluate(() =>
    document.getElementById("slider")?.addEventListener("primitiv-slider-change", (e) => e.preventDefault()),
  );
  await thumb(page).focus();
  await page.keyboard.press("ArrowRight");
  await expect(thumb(page)).toHaveAttribute("aria-valuenow", "40");
});
