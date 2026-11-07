// The Tabs contract in a real browser, in every environment that renders the
// elements: plain HTML, React 19, Vue 3, Svelte 5 and Angular (RFC 0033 §7.4). The same cases run
// against each page; only how the markup got there differs.
import { expect, test } from "./fixtures";

for (const env of ["html", "react", "vue", "svelte", "angular"] as const) {
  test.describe(`${env}`, () => {
    const open = (page: import("@playwright/test").Page, query = "") => page.goto(`/${env}.html${query}`);
    const tab = (page: import("@playwright/test").Page, name: string) => page.getByRole("tab", { name, exact: true });

    test("renders a named tablist and shows the active panel", async ({ page }) => {
      await open(page, "?value=two");
      await expect(page.getByRole("tablist", { name: "Sections" })).toBeVisible();
      await expect(page.getByRole("tab")).toHaveCount(3);
      await expect(tab(page, "Two")).toHaveAttribute("aria-selected", "true");
      await expect(page.getByRole("tabpanel")).toHaveText("Second panel");
      await expect(tab(page, "Two")).toHaveAttribute("aria-controls", /.+/);
    });

    test("activates a clicked tab", async ({ page }) => {
      await open(page);
      await tab(page, "Three").click();
      await expect(tab(page, "Three")).toHaveAttribute("aria-selected", "true");
      await expect(page.getByRole("tabpanel")).toHaveText("Third panel");
    });

    test("moves with the arrows, wrapping, and jumps with Home and End", async ({ page }) => {
      await open(page);
      await tab(page, "One").focus();
      await page.keyboard.press("ArrowLeft");
      await expect(tab(page, "Three")).toBeFocused();
      await expect(tab(page, "Three")).toHaveAttribute("aria-selected", "true");
      await page.keyboard.press("Home");
      await expect(tab(page, "One")).toBeFocused();
      await page.keyboard.press("End");
      await expect(tab(page, "Three")).toBeFocused();
    });

    test("moves focus only in manual mode until Enter activates", async ({ page }) => {
      await open(page, "?mode=manual");
      await tab(page, "One").focus();
      await page.keyboard.press("ArrowRight");
      await expect(tab(page, "Two")).toBeFocused();
      await expect(tab(page, "Two")).toHaveAttribute("aria-selected", "false");
      await page.keyboard.press("Enter");
      await expect(tab(page, "Two")).toHaveAttribute("aria-selected", "true");
    });

    test("uses the vertical arrows when vertical", async ({ page }) => {
      await open(page, "?orientation=vertical");
      await tab(page, "One").focus();
      await page.keyboard.press("ArrowDown");
      await expect(tab(page, "Two")).toHaveAttribute("aria-selected", "true");
      await expect(page.getByRole("tablist")).toHaveAttribute("aria-orientation", "vertical");
    });

    test("mirrors the arrows right to left, from the real :dir()", async ({ page }) => {
      await open(page, "?dir=rtl");
      await tab(page, "One").focus();
      await page.keyboard.press("ArrowLeft");
      await expect(tab(page, "Two")).toBeFocused();
    });

    test("lands on a disabled tab without activating it", async ({ page }) => {
      await open(page, "?disabled=two");
      await tab(page, "One").focus();
      await page.keyboard.press("ArrowRight");
      await expect(tab(page, "Two")).toBeFocused();
      await expect(tab(page, "Two")).toHaveAttribute("aria-disabled", "true");
      // Playwright treats aria-disabled as disabled and would wait forever; the
      // point here is precisely that a click on it is ignored.
      await tab(page, "Two").click({ force: true });
      await expect(tab(page, "One")).toHaveAttribute("aria-selected", "true");
    });

    test("shows the focus ring on the keyboard, not on a click", async ({ page }) => {
      await open(page);
      await tab(page, "Two").click();
      expect(await tab(page, "Two").evaluate((el) => el.matches(":focus-visible"))).toBe(false);
      await page.keyboard.press("ArrowRight");
      expect(await tab(page, "Three").evaluate((el) => el.matches(":focus-visible"))).toBe(true);
    });

    if (env !== "html") {
      test("survives the framework re-rendering around it", async ({ page }) => {
        await open(page);
        await tab(page, "Two").click();
        await expect(page.getByTestId("state")).toHaveText("two");
        await page.getByTestId("rerender").click();
        await page.getByTestId("rerender").click();
        await expect(tab(page, "Two")).toHaveAttribute("aria-selected", "true");
        await expect(tab(page, "Two")).toHaveAttribute("tabindex", "0");
        await expect(page.getByRole("tabpanel")).toHaveText("Second panel");
      });

      test("is controlled by framework state through preventDefault", async ({ page }) => {
        await open(page);
        await page.keyboard.press("Tab");
        await page.keyboard.press("ArrowRight");
        await expect(page.getByTestId("state")).toHaveText("two");
        await expect(page.locator("primitiv-tabs")).toHaveAttribute("value", "two");
      });
    }
  });
}
