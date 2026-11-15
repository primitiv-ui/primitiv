// The HTMX swap cases (RFC 0033 §7.4), run against Stepper: parts that arrive,
// leave and move after first render, with no framework in between.
import { expect, test } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await page.goto("/stepper-htmx.html");
  await page.waitForFunction(() => customElements.get("primitiv-stepper") && "htmx" in window);
});

const stepIn = (page: import("@playwright/test").Page, root: string, name: string) =>
  page.locator(`#${root}`).getByRole("tab", { name, exact: true });

test("1. a whole stepper arriving in a fragment upgrades with no script call", async ({ page }) => {
  await page.click("#load-stepper");
  await expect(stepIn(page, "swapped", "Review")).toHaveAttribute("aria-selected", "true");
  await expect(stepIn(page, "swapped", "Billing")).toHaveAttribute("data-step-state", "complete");
});

test("2. a stepper swapped into another's panel keeps its own steps", async ({ page }) => {
  await page.click("#load-nested");
  await expect(page.getByRole("tablist", { name: "Inner progress" }).getByRole("tab")).toHaveCount(3);
  await expect(page.getByRole("tablist", { name: "Outer progress" }).getByRole("tab")).toHaveCount(3);
  await page.locator("#inner").getByRole("tab", { name: "Review" }).click();
  await expect(page.locator("#inner")).toHaveAttribute("value", "review");
  await expect(page.locator("#outer")).toHaveAttribute("value", "billing");
});

test("3. a step and its panel arriving out of band join the rail", async ({ page }) => {
  await page.click("#load-oob");
  await expect(stepIn(page, "oob", "Review")).toHaveAttribute("data-step-state", "upcoming");
  await stepIn(page, "oob", "Review").click();
  await expect(page.locator("#oob").getByRole("tabpanel")).toHaveText("Out-of-band panel");
});

test("4. a server re-render, a step on, moves the step and its states", async ({ page }) => {
  await page.click("#load-next");
  await expect(stepIn(page, "rerendered", "Billing")).toHaveAttribute("aria-selected", "true");
  await expect(stepIn(page, "rerendered", "Account")).toHaveAttribute("data-step-state", "complete");
});

test("5. an hx-preserve'd stepper keeps its step and handles each event once", async ({ page }) => {
  await stepIn(page, "preserved", "Billing").click();
  await page.click("#swap-preserve");
  await expect(page.getByText("Swapped region")).toBeVisible();
  await expect(page.locator("#preserved")).toHaveAttribute("value", "billing");
  await page.evaluate(() => {
    const seen: string[] = [];
    document.getElementById("preserved")?.addEventListener("primitiv-stepper-change", (e) => {
      seen.push((e as CustomEvent<{ value: string }>).detail.value);
    });
    (window as unknown as { __seen: string[] }).__seen = seen;
  });
  await stepIn(page, "preserved", "Review").click();
  expect(await page.evaluate(() => (window as unknown as { __seen: string[] }).__seen)).toEqual(["review"]);
});

test("6. history restore brings back the step the user was on", async ({ page }) => {
  await stepIn(page, "history", "Review").click();
  await page.click("#go-two");
  await expect(page.locator("#page-two")).toBeVisible();
  await page.goBack();
  await expect(stepIn(page, "history", "Review")).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#history").getByRole("tabpanel")).toHaveText("Review panel");
});

test("7. a lazy panel fetches its content the first time its step is reached, once", async ({ page }) => {
  await stepIn(page, "lazy", "Review").click();
  const content = page.getByTestId("stepper-lazy-content");
  await expect(content).toBeVisible();
  const first = await content.textContent();
  await stepIn(page, "lazy", "Account").click();
  await stepIn(page, "lazy", "Review").click();
  await expect(content).toHaveText(first ?? "");
});

test("8. hx-trigger posts each change of step, and an hx-on handler can veto one", async ({ page }) => {
  await stepIn(page, "echo", "Billing").click();
  await expect(page.getByTestId("stepper-echo")).toContainText("server saw billing");
  await stepIn(page, "echo", "Review").click();
  await expect(page.locator("#echo")).toHaveAttribute("value", "billing");
});
