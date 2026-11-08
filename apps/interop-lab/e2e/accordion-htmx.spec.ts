// The HTMX swap cases (RFC 0033 §7.4), run against Accordion: parts that
// arrive, leave and move after first render, with no framework in between.
import { expect, test } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await page.goto("/accordion-htmx.html");
  await page.waitForFunction(() => customElements.get("primitiv-accordion") && "htmx" in window);
});

const triggerIn = (page: import("@playwright/test").Page, root: string, name: string) =>
  page.locator(`#${root}`).getByRole("button", { name, exact: true });

test("1. a whole accordion arriving in a fragment upgrades with no script call", async ({ page }) => {
  await page.click("#load-accordion");
  await expect(triggerIn(page, "swapped", "Two")).toHaveAttribute("aria-expanded", "true");
  await triggerIn(page, "swapped", "Three").click();
  await expect(page.locator("#swapped")).toHaveAttribute("value", "three");
});

test("2. an accordion swapped into another's panel stays independent of it", async ({ page }) => {
  await page.click("#load-nested");
  await page.getByRole("button", { name: "Inner A" }).click();
  await expect(page.getByRole("button", { name: "Inner A" })).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#outer")).toHaveAttribute("value", "one");
  await expect(triggerIn(page, "outer", "One")).toHaveAttribute("aria-expanded", "true");
});

test("3. an out-of-band item joins the existing accordion in DOM order", async ({ page }) => {
  await page.click("#load-oob");
  await expect(triggerIn(page, "oob", "Four")).toHaveAttribute("aria-expanded", "false");
  await triggerIn(page, "oob", "Three").focus();
  await page.keyboard.press("ArrowDown");
  await expect(triggerIn(page, "oob", "Four")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#oob").getByRole("region", { name: "Four" })).toHaveText("Fourth panel");
});

test("4. a server re-render with a new value opens it", async ({ page }) => {
  await page.click("#load-value");
  await expect(triggerIn(page, "rerendered", "Three")).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#rerendered").getByRole("region")).toHaveText("Third panel");
});

test("5. an hx-preserve'd accordion keeps its state and handles each event once", async ({ page }) => {
  await triggerIn(page, "preserved", "Two").click();
  await page.click("#swap-preserve");
  await expect(page.getByText("Swapped region")).toBeVisible();
  await expect(page.locator("#preserved")).toHaveAttribute("value", "two");
  await page.evaluate(() => {
    const seen: string[][] = [];
    document.getElementById("preserved")?.addEventListener("primitiv-accordion-change", (e) => {
      seen.push((e as CustomEvent<{ value: string[] }>).detail.value);
    });
    (window as unknown as { __seen: string[][] }).__seen = seen;
  });
  await triggerIn(page, "preserved", "Three").click();
  expect(await page.evaluate(() => (window as unknown as { __seen: string[][] }).__seen)).toEqual([["three"]]);
  await expect(page.locator("#preserved").getByRole("region")).toHaveText("Third panel");
});

test("6. history restore brings back the items the user left open", async ({ page }) => {
  await triggerIn(page, "history", "Three").click();
  await page.click("#go-two");
  await expect(page.locator("#page-two")).toBeVisible();
  await page.goBack();
  await expect(triggerIn(page, "history", "Three")).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#history").getByRole("region")).toHaveText(["First panel", "Third panel"]);
});

test("7. a lazy panel fetches its content on first open, once", async ({ page }) => {
  await triggerIn(page, "lazy", "Two").click();
  const content = page.getByTestId("lazy-content");
  await expect(content).toBeVisible();
  const first = await content.textContent();
  await triggerIn(page, "lazy", "Two").click();
  await triggerIn(page, "lazy", "Two").click();
  await expect(content).toHaveText(first ?? "");
});

test("8. hx-trigger posts each change, and an hx-on handler can veto one", async ({ page }) => {
  await triggerIn(page, "echo", "Two").click();
  await expect(page.getByTestId("echo")).toContainText("server saw two");
  await triggerIn(page, "echo", "Three").click();
  await expect(page.locator("#echo")).toHaveAttribute("value", "two");
  await expect(triggerIn(page, "echo", "Three")).toHaveAttribute("aria-expanded", "false");
});

test("9. horizontal arrows mirror inside a right-to-left fragment", async ({ page }) => {
  await page.click("#load-rtl");
  await triggerIn(page, "rtl", "One").focus();
  await page.keyboard.press("ArrowLeft");
  await expect(triggerIn(page, "rtl", "Two")).toBeFocused();
});
