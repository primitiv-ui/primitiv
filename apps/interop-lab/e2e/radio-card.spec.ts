// The RadioCard element on a plain HTML page, in a real browser: the shared
// contract where jsdom cannot vouch for it (`:dir()`, real focus and Tab order,
// Space and Enter as the native button's click), plus the attribute contract a
// server relies on.
import { expect, test } from "./fixtures";

const open = async (page: import("@playwright/test").Page, query = "") => {
  await page.goto(`/radio-card.html${query}`);
  await page.waitForFunction(() => customElements.get("primitiv-radio-card"));
};

const card = (page: import("@playwright/test").Page, name: string) => page.getByRole("radio", { name, exact: true });

test("adopts the server's markup: a named radio group with the selected card checked, its indicator shown", async ({ page }) => {
  await open(page);
  await expect(page.getByRole("radiogroup", { name: "Plan group" })).toBeVisible();
  await expect(card(page, "Basic")).toHaveAttribute("aria-checked", "true");
  await expect(card(page, "Pro")).toHaveAttribute("aria-checked", "false");
  await expect(card(page, "Basic").locator("primitiv-radio-card-indicator")).not.toHaveAttribute("hidden", "");
  await expect(card(page, "Pro").locator("primitiv-radio-card-indicator")).toHaveAttribute("hidden", "");
});

test("clicking selects and reflects the selection into value; clicking it again keeps it", async ({ page }) => {
  await open(page);
  await card(page, "Team").click();
  await expect(page.locator("#group")).toHaveAttribute("value", "team");
  await card(page, "Team").click();
  await expect(card(page, "Team")).toHaveAttribute("aria-checked", "true");
});

test("Tab enters at the selected card; every arrow carries the selection by default", async ({ page }) => {
  await open(page, "?value=pro");
  await page.keyboard.press("Tab");
  await expect(card(page, "Pro")).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(card(page, "Team")).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(card(page, "Basic")).toBeFocused();
  await expect(page.locator("#group")).toHaveAttribute("value", "basic");
});

test("a horizontal group ignores the vertical arrows", async ({ page }) => {
  await open(page, "?orientation=horizontal");
  await card(page, "Basic").focus();
  await page.keyboard.press("ArrowDown");
  await expect(card(page, "Basic")).toBeFocused();
  await expect(page.locator("#group")).toHaveAttribute("aria-orientation", "horizontal");
});

test("the arrows skip a disabled card, which a click never selects", async ({ page }) => {
  await open(page, "?disabled=pro");
  await card(page, "Basic").focus();
  await page.keyboard.press("ArrowRight");
  await expect(card(page, "Team")).toBeFocused();
  await card(page, "Pro").click({ force: true });
  await expect(card(page, "Pro")).toHaveAttribute("aria-checked", "false");
});

test("horizontal arrows mirror under an inherited dir=rtl", async ({ page }) => {
  await open(page, "?dir=rtl");
  await card(page, "Basic").focus();
  await page.keyboard.press("ArrowLeft");
  await expect(card(page, "Pro")).toBeFocused();
});

test("a cancelled change event keeps the selection", async ({ page }) => {
  await open(page);
  await page.evaluate(() =>
    document.getElementById("group")?.addEventListener("primitiv-radio-card-change", (e) => e.preventDefault()),
  );
  await card(page, "Pro").click();
  await expect(page.locator("#group")).toHaveAttribute("value", "basic");
});
