// The HTMX swap cases (RFC 0033 §7.4), run against Collapsible: parts that
// arrive, leave and move after first render, with no framework in between.
import { expect, test } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await page.goto("/collapsible-htmx.html");
  await page.waitForFunction(() => customElements.get("primitiv-collapsible") && "htmx" in window);
});

const triggerIn = (page: import("@playwright/test").Page, root: string, name = "Toggle") =>
  page.locator(`#${root}`).getByRole("button", { name, exact: true });

test("1. a whole collapsible arriving in a fragment upgrades with no script call", async ({ page }) => {
  await page.click("#load-collapsible");
  await expect(triggerIn(page, "swapped")).toHaveAttribute("aria-expanded", "true");
  await triggerIn(page, "swapped").click();
  await expect(page.locator("#swapped")).not.toHaveAttribute("open");
});

test("2. a collapsible swapped into another's panel stays independent of it", async ({ page }) => {
  await page.click("#load-nested");
  await page.getByRole("button", { name: "Inner", exact: true }).click();
  await expect(page.getByRole("button", { name: "Inner", exact: true })).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#outer")).toHaveAttribute("open", "");
  await expect(triggerIn(page, "outer", "Outer")).toHaveAttribute("aria-controls", "outer-content");
});

test("3. a panel arriving out of band is wired to the trigger", async ({ page }) => {
  await page.click("#load-oob");
  await expect(triggerIn(page, "oob")).toHaveAttribute("aria-controls", "oob-content");
  await expect(page.locator("#oob-content")).toHaveText("Out-of-band panel");
  await triggerIn(page, "oob").click();
  await expect(page.locator("#oob-content")).toBeHidden();
});

test("4. a server re-render, now open, opens it", async ({ page }) => {
  await page.click("#load-open");
  await expect(triggerIn(page, "rerendered")).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#rerendered primitiv-collapsible-content")).toHaveText("Hidden content");
});

test("5. an hx-preserve'd collapsible keeps its state and handles each event once", async ({ page }) => {
  await triggerIn(page, "preserved").click();
  await page.click("#swap-preserve");
  await expect(page.getByText("Swapped region")).toBeVisible();
  await expect(page.locator("#preserved")).toHaveAttribute("open", "");
  await page.evaluate(() => {
    const seen: boolean[] = [];
    document.getElementById("preserved")?.addEventListener("primitiv-collapsible-change", (e) => {
      seen.push((e as CustomEvent<{ open: boolean }>).detail.open);
    });
    (window as unknown as { __seen: boolean[] }).__seen = seen;
  });
  await triggerIn(page, "preserved").click();
  expect(await page.evaluate(() => (window as unknown as { __seen: boolean[] }).__seen)).toEqual([false]);
  await expect(page.locator("#preserved primitiv-collapsible-content")).toBeHidden();
});

test("6. history restore brings back a collapsible the user left open", async ({ page }) => {
  await triggerIn(page, "history").click();
  await page.click("#go-two");
  await expect(page.locator("#page-two")).toBeVisible();
  await page.goBack();
  await expect(triggerIn(page, "history")).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#history primitiv-collapsible-content")).toHaveText("Hidden content");
});

test("7. a lazy panel fetches its content on first open, once", async ({ page }) => {
  await triggerIn(page, "lazy").click();
  const content = page.getByTestId("lazy-content");
  await expect(content).toBeVisible();
  const first = await content.textContent();
  await triggerIn(page, "lazy").click();
  await triggerIn(page, "lazy").click();
  await expect(content).toHaveText(first ?? "");
});

test("8. hx-trigger posts each change, and an hx-on handler can veto one", async ({ page }) => {
  await triggerIn(page, "echo").click();
  await expect(page.getByTestId("echo")).toContainText("server saw true");
  await triggerIn(page, "echo").click();
  await expect(page.locator("#echo")).toHaveAttribute("open", "");
  await expect(triggerIn(page, "echo")).toHaveAttribute("aria-expanded", "true");
});
