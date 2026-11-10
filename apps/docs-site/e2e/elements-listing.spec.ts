import { test, expect } from "@playwright/test";

// A fresh visit lands on Elements + Headless. Every component with an Elements
// surface is listed there, not just the ones with behaviour: the class-only
// ones are marked "CSS only" so it is clear which ship a script.

test("the sidebar lists class-only components under Headless, marked CSS only", async ({ page }) => {
  await page.goto("/components/tabs/");
  const nav = page.getByRole("navigation", { name: "Documentation" });
  await expect(nav.getByRole("link", { name: "Stack, CSS only" })).toBeAttached();
  await expect(nav.getByRole("link", { name: "Tabs", exact: true })).toBeAttached();
});

test("the components index lists class-only components under Headless, marked CSS only", async ({ page }) => {
  await page.goto("/components/");
  const stack = page.locator(".docs-index-card", { hasText: "Stack" }).first();
  await expect(stack).toContainText("CSS only");
  const tabs = page.locator(".docs-index-card", { hasText: "Tabs" }).first();
  await expect(tabs).not.toContainText("CSS only");
});
