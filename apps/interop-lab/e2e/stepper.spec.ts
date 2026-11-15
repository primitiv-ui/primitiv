// The Stepper elements on a plain HTML page, in a real browser: a step rail on
// the Tabs behaviour, with manual activation by default and each step's state
// written onto its button.
import { expect, test } from "./fixtures";

const open = async (page: import("@playwright/test").Page, query = "") => {
  await page.goto(`/stepper.html${query}`);
  await page.waitForFunction(() => customElements.get("primitiv-stepper"));
};

const step = (page: import("@playwright/test").Page, name: string) => page.getByRole("tab", { name, exact: true });

test("adopts the server's markup: a named rail of steps, the current one's panel showing", async ({ page }) => {
  await open(page);
  await expect(page.getByRole("tablist", { name: "Sign-up progress" })).toBeVisible();
  await expect(step(page, "Billing")).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel", { name: "Billing" })).toHaveText("Billing panel");
});

test("writes each step's state on its button", async ({ page }) => {
  await open(page);
  await expect(step(page, "Account")).toHaveAttribute("data-step-state", "complete");
  await expect(step(page, "Review")).toHaveAttribute("data-step-state", "upcoming");
  await page.locator('primitiv-stepper-step[value="review"]').evaluate((s) => s.setAttribute("state", "error"));
  await expect(step(page, "Review")).toHaveAttribute("data-step-state", "error");
});

test("activates manually: an arrow moves focus, Enter moves the step", async ({ page }) => {
  await open(page);
  await step(page, "Billing").focus();
  await page.keyboard.press("ArrowRight");
  await expect(step(page, "Review")).toBeFocused();
  await expect(step(page, "Billing")).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("Enter");
  await expect(page.locator("#stepper")).toHaveAttribute("value", "review");
});

test("mirrors the arrows right to left", async ({ page }) => {
  await open(page, "?dir=rtl");
  await step(page, "Billing").focus();
  await page.keyboard.press("ArrowLeft");
  await expect(step(page, "Review")).toBeFocused();
});

test("a locked step is skipped and never activates", async ({ page }) => {
  await open(page, "?disabled=review");
  // aria-disabled reads as disabled to Playwright's actionability check.
  await step(page, "Review").click({ force: true });
  await expect(page.locator("#stepper")).toHaveAttribute("value", "billing");
});

test("a cancelled change event keeps the user on the current step", async ({ page }) => {
  await open(page);
  await page.evaluate(() =>
    document.getElementById("stepper")?.addEventListener("primitiv-stepper-change", (e) => e.preventDefault()),
  );
  await step(page, "Review").click();
  await expect(step(page, "Billing")).toHaveAttribute("aria-selected", "true");
});
