// The SegmentedControl element on a plain HTML page, in a real browser: the
// shared contract where jsdom cannot vouch for it (`:dir()`, real focus and Tab
// order, Space and Enter as the native button's click), plus the attribute
// contract a server relies on.
import { expect, test } from "./fixtures";

const open = async (page: import("@playwright/test").Page, query = "") => {
  await page.goto(`/segmented-control.html${query}`);
  await page.waitForFunction(() => customElements.get("primitiv-segmented-control"));
};

const segment = (page: import("@playwright/test").Page, name: string) => page.getByRole("radio", { name, exact: true });

test("adopts the server's markup: a named radio group with the selected segment checked", async ({ page }) => {
  await open(page);
  await expect(page.getByRole("radiogroup", { name: "Range control" })).toBeVisible();
  await expect(segment(page, "Day")).toHaveAttribute("aria-checked", "true");
  await expect(segment(page, "Week")).toHaveAttribute("aria-checked", "false");
});

test("clicking selects and reflects the selection into value; clicking it again keeps it", async ({ page }) => {
  await open(page);
  await segment(page, "Month").click();
  await expect(page.locator("#control")).toHaveAttribute("value", "month");
  await segment(page, "Month").click();
  await expect(page.locator("#control")).toHaveAttribute("value", "month");
  await expect(segment(page, "Month")).toHaveAttribute("aria-checked", "true");
});

test("Enter and Space select the focused segment", async ({ page }) => {
  await open(page, "?value=");
  await segment(page, "Week").focus();
  await page.keyboard.press("Enter");
  await expect(segment(page, "Week")).toHaveAttribute("aria-checked", "true");
  await segment(page, "Month").focus();
  await page.keyboard.press(" ");
  await expect(segment(page, "Month")).toHaveAttribute("aria-checked", "true");
});

test("Tab enters at the selected segment and leaves in one step; the arrows carry selection", async ({ page }) => {
  await open(page, "?value=week");
  await page.keyboard.press("Tab");
  await expect(segment(page, "Week")).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(segment(page, "Month")).toBeFocused();
  await expect(page.locator("#control")).toHaveAttribute("value", "month");
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await expect(segment(page, "Month")).toBeFocused();
});

test("the arrows skip a disabled segment, wrapping", async ({ page }) => {
  await open(page, "?disabled=week");
  await segment(page, "Day").focus();
  await page.keyboard.press("ArrowRight");
  await expect(segment(page, "Month")).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(segment(page, "Day")).toBeFocused();
  // aria-disabled reads as disabled to Playwright's actionability check.
  await segment(page, "Week").click({ force: true });
  await expect(segment(page, "Week")).toHaveAttribute("aria-checked", "false");
});

test("the vertical arrows drive a vertical control", async ({ page }) => {
  await open(page, "?orientation=vertical");
  await segment(page, "Day").focus();
  await page.keyboard.press("ArrowRight");
  await expect(segment(page, "Day")).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(segment(page, "Week")).toBeFocused();
});

test("horizontal arrows mirror under an inherited dir=rtl", async ({ page }) => {
  await open(page, "?dir=rtl");
  await segment(page, "Day").focus();
  await page.keyboard.press("ArrowLeft");
  await expect(segment(page, "Week")).toBeFocused();
});

test("a cancelled change event keeps the selection", async ({ page }) => {
  await open(page);
  await page.evaluate(() =>
    document.getElementById("control")?.addEventListener("primitiv-segmented-control-change", (e) => e.preventDefault()),
  );
  await segment(page, "Week").click();
  await expect(segment(page, "Week")).toHaveAttribute("aria-checked", "false");
  await expect(page.locator("#control")).toHaveAttribute("value", "day");
});
