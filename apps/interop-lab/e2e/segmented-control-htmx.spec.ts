// The HTMX swap cases (RFC 0033 §7.4), run against SegmentedControl: parts
// that arrive, leave and move after first render, with no framework in between.
import { expect, test } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await page.goto("/segmented-control-htmx.html");
  await page.waitForFunction(() => customElements.get("primitiv-segmented-control") && "htmx" in window);
});

const segmentIn = (page: import("@playwright/test").Page, root: string, name: string) =>
  page.locator(`#${root}`).getByRole("radio", { name, exact: true });

test("1. a whole control arriving in a fragment upgrades with no script call", async ({ page }) => {
  await page.click("#load-control");
  await expect(segmentIn(page, "swapped", "Week")).toHaveAttribute("aria-checked", "true");
  await segmentIn(page, "swapped", "Month").click();
  await expect(page.locator("#swapped")).toHaveAttribute("value", "month");
});

test("2. a control swapped into another stays independent of it", async ({ page }) => {
  await page.click("#load-nested");
  await page.getByRole("radio", { name: "Inner A" }).click();
  await expect(page.getByRole("radio", { name: "Inner A" })).toHaveAttribute("aria-checked", "true");
  await expect(page.locator("#outer")).toHaveAttribute("value", "day");
  await expect(segmentIn(page, "outer", "Day")).toHaveAttribute("tabindex", "0");
});

test("3. an out-of-band segment joins the existing control in DOM order", async ({ page }) => {
  await page.click("#load-oob");
  await expect(segmentIn(page, "oob", "Year")).toHaveAttribute("aria-checked", "false");
  await segmentIn(page, "oob", "Month").click();
  await page.keyboard.press("ArrowRight");
  await expect(segmentIn(page, "oob", "Year")).toBeFocused();
  await expect(segmentIn(page, "oob", "Year")).toHaveAttribute("aria-checked", "true");
});

test("4. a server re-render with a new value selects it", async ({ page }) => {
  await page.click("#load-value");
  await expect(segmentIn(page, "rerendered", "Month")).toHaveAttribute("aria-checked", "true");
  await expect(segmentIn(page, "rerendered", "Day")).toHaveAttribute("aria-checked", "false");
});

test("5. an hx-preserve'd control keeps its state and handles each event once", async ({ page }) => {
  await segmentIn(page, "preserved", "Week").click();
  await page.click("#swap-preserve");
  await expect(page.getByText("Swapped region")).toBeVisible();
  await expect(page.locator("#preserved")).toHaveAttribute("value", "week");
  await page.evaluate(() => {
    const seen: string[] = [];
    document.getElementById("preserved")?.addEventListener("primitiv-segmented-control-change", (e) => {
      seen.push((e as CustomEvent<{ value: string }>).detail.value);
    });
    (window as unknown as { __seen: string[] }).__seen = seen;
  });
  await segmentIn(page, "preserved", "Month").click();
  expect(await page.evaluate(() => (window as unknown as { __seen: string[] }).__seen)).toEqual(["month"]);
});

test("6. history restore brings back the segment the user left selected", async ({ page }) => {
  await segmentIn(page, "history", "Month").click();
  await page.click("#go-two");
  await expect(page.locator("#page-two")).toBeVisible();
  await page.goBack();
  await expect(segmentIn(page, "history", "Month")).toHaveAttribute("aria-checked", "true");
  await expect(segmentIn(page, "history", "Day")).toHaveAttribute("aria-checked", "false");
});

test("7. hx-trigger posts each change, and an hx-on handler can veto one", async ({ page }) => {
  await segmentIn(page, "echo", "Week").click();
  await expect(page.getByTestId("echo")).toContainText("server saw week");
  await segmentIn(page, "echo", "Month").click();
  await expect(page.locator("#echo")).toHaveAttribute("value", "week");
  await expect(segmentIn(page, "echo", "Month")).toHaveAttribute("aria-checked", "false");
});

test("8. horizontal arrows mirror inside a right-to-left fragment", async ({ page }) => {
  await page.click("#load-rtl");
  await segmentIn(page, "rtl", "Day").focus();
  await page.keyboard.press("ArrowLeft");
  await expect(segmentIn(page, "rtl", "Week")).toBeFocused();
});
