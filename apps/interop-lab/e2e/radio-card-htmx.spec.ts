// The HTMX swap cases (RFC 0033 §7.4), run against RadioCard: parts that
// arrive, leave and move after first render, with no framework in between.
import { expect, test } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await page.goto("/radio-card-htmx.html");
  await page.waitForFunction(() => customElements.get("primitiv-radio-card") && "htmx" in window);
});

const cardIn = (page: import("@playwright/test").Page, root: string, name: string) =>
  page.locator(`#${root}`).getByRole("radio", { name, exact: true });

test("1. a whole group arriving in a fragment upgrades with no script call", async ({ page }) => {
  await page.click("#load-group");
  await expect(cardIn(page, "swapped", "Pro")).toHaveAttribute("aria-checked", "true");
  await cardIn(page, "swapped", "Team").click();
  await expect(page.locator("#swapped")).toHaveAttribute("value", "team");
});

test("2. a group swapped into another stays independent of it", async ({ page }) => {
  await page.click("#load-nested");
  await page.getByRole("radio", { name: "Inner A" }).click();
  await expect(page.getByRole("radio", { name: "Inner A" })).toHaveAttribute("aria-checked", "true");
  await expect(page.locator("#outer")).toHaveAttribute("value", "basic");
});

test("3. an out-of-band card joins the existing group in DOM order", async ({ page }) => {
  await page.click("#load-oob");
  await expect(cardIn(page, "oob", "Enterprise")).toHaveAttribute("aria-checked", "false");
  await cardIn(page, "oob", "Team").click();
  await page.keyboard.press("ArrowRight");
  await expect(cardIn(page, "oob", "Enterprise")).toBeFocused();
  await expect(cardIn(page, "oob", "Enterprise")).toHaveAttribute("aria-checked", "true");
});

test("4. a server re-render with a new value selects it", async ({ page }) => {
  await page.click("#load-value");
  await expect(cardIn(page, "rerendered", "Team")).toHaveAttribute("aria-checked", "true");
  await expect(cardIn(page, "rerendered", "Basic")).toHaveAttribute("aria-checked", "false");
});

test("5. an hx-preserve'd group keeps its state and handles each event once", async ({ page }) => {
  await cardIn(page, "preserved", "Pro").click();
  await page.click("#swap-preserve");
  await expect(page.getByText("Swapped region")).toBeVisible();
  await expect(page.locator("#preserved")).toHaveAttribute("value", "pro");
  await page.evaluate(() => {
    const seen: string[] = [];
    document.getElementById("preserved")?.addEventListener("primitiv-radio-card-change", (e) => {
      seen.push((e as CustomEvent<{ value: string }>).detail.value);
    });
    (window as unknown as { __seen: string[] }).__seen = seen;
  });
  await cardIn(page, "preserved", "Team").click();
  expect(await page.evaluate(() => (window as unknown as { __seen: string[] }).__seen)).toEqual(["team"]);
});

test("6. history restore brings back the card the user left selected", async ({ page }) => {
  await cardIn(page, "history", "Team").click();
  await page.click("#go-two");
  await expect(page.locator("#page-two")).toBeVisible();
  await page.goBack();
  await expect(cardIn(page, "history", "Team")).toHaveAttribute("aria-checked", "true");
  await expect(cardIn(page, "history", "Basic")).toHaveAttribute("aria-checked", "false");
});

test("7. hx-trigger posts each change, and an hx-on handler can veto one", async ({ page }) => {
  await cardIn(page, "echo", "Pro").click();
  await expect(page.getByTestId("echo")).toContainText("server saw pro");
  await cardIn(page, "echo", "Team").click();
  await expect(page.locator("#echo")).toHaveAttribute("value", "pro");
});

test("8. horizontal arrows mirror inside a right-to-left fragment", async ({ page }) => {
  await page.click("#load-rtl");
  await cardIn(page, "rtl", "Basic").focus();
  await page.keyboard.press("ArrowLeft");
  await expect(cardIn(page, "rtl", "Pro")).toBeFocused();
});
