// `primitiv add tabs` on the elements surface, end to end (RFC 0033 §8): the
// CLI's copied stylesheets and printed markup, in a real browser.
import { readFileSync } from "node:fs";

import { expect, test } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await page.goto("/styled.html");
  await page.waitForFunction(
    () =>
      customElements.get("primitiv-tabs") &&
      customElements.get("primitiv-accordion") &&
      customElements.get("primitiv-collapsible") &&
      customElements.get("primitiv-modal"),
  );
});

const tab = (page: import("@playwright/test").Page, name: string) => page.getByRole("tab", { name, exact: true });

test("add printed the links and the script a plain HTML site needs", () => {
  const output = readFileSync("styled-site/add-output.txt", "utf8");
  expect(output).toContain('<link rel="stylesheet" href="primitiv/index.css">');
  expect(output).toMatch(/<script type="module" src="https:\/\/cdn\.jsdelivr\.net\/npm\/@primitiv-ui\/web@[\d.]+\/dist\/cdn\/tabs\.js"><\/script>/);
});

test("the copied stylesheets style the printed markup", async ({ page }) => {
  await expect(page.getByRole("tablist", { name: "Sections" })).toHaveCSS("display", "flex");
  const padding = await page.getByRole("tabpanel").evaluate((panel) => getComputedStyle(panel).paddingBlockStart);
  expect(parseFloat(padding)).toBeGreaterThan(0);
});

test("a trigger's wrapper takes no box, so its button lays out as React's does", async ({ page }) => {
  await expect(page.locator("primitiv-tabs-trigger").first()).toHaveCSS("display", "contents");
});

test("the printed markup is a working tab set", async ({ page }) => {
  await expect(tab(page, "One")).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel")).toHaveText("First panel");
  await tab(page, "One").focus();
  await page.keyboard.press("ArrowRight");
  await expect(tab(page, "Two")).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel")).toHaveText("Second panel");
});

const accordionTrigger = (page: import("@playwright/test").Page, name: string) =>
  page.getByRole("button", { name, exact: true });

test("add accordion printed the per-component script for its first release", () => {
  const output = readFileSync("styled-site/add-accordion-output.txt", "utf8");
  expect(output).toMatch(/@primitiv-ui\/web@[\d.]+\/dist\/cdn\/accordion\.js/);
});

test("the accordion's wrappers take the boxes React's markup has", async ({ page }) => {
  await expect(page.locator("primitiv-accordion-trigger").first()).toHaveCSS("display", "contents");
  await expect(page.locator("primitiv-accordion-item").first()).toHaveCSS("display", "block");
  await expect(page.locator("primitiv-accordion")).toHaveCSS("display", "flex");
});

test("the printed accordion is styled and working, its closed panels collapsed rather than display:none", async ({ page }) => {
  await expect(accordionTrigger(page, "One")).toHaveAttribute("aria-expanded", "true");
  await expect(accordionTrigger(page, "One")).toHaveCSS("display", "flex");
  await expect(page.getByRole("region", { name: "One" })).toHaveText("First panel");
  const second = page.locator("primitiv-accordion-content").nth(1);
  await expect(second).toHaveCSS("display", "grid");
  await expect(page.getByRole("region")).toHaveCount(1);

  await accordionTrigger(page, "Two").click();
  await expect(page.getByRole("region", { name: "Two" })).toHaveText("Second panel");
  await expect(page.locator(".primitiv-accordion__trigger-icon").nth(1)).toHaveAttribute("data-state", "open");
  await expect(page.getByRole("region")).toHaveCount(1);
});

test("add collapsible printed the per-component script for its first release", () => {
  const output = readFileSync("styled-site/add-collapsible-output.txt", "utf8");
  expect(output).toMatch(/@primitiv-ui\/web@[\d.]+\/dist\/cdn\/collapsible\.js/);
});

test("the printed collapsible is styled and working, its closed panel collapsed rather than display:none", async ({ page }) => {
  const trigger = page.getByRole("button", { name: "Show shipping details", exact: true });
  const content = page.locator("primitiv-collapsible-content");
  await expect(page.locator("primitiv-collapsible-trigger")).toHaveCSS("display", "contents");
  await expect(page.locator("primitiv-collapsible")).toHaveCSS("display", "flex");
  await expect(trigger).toHaveCSS("display", "flex");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(content).toHaveCSS("display", "grid");
  await expect(content).toHaveAttribute("aria-hidden", "true");

  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(content).not.toHaveAttribute("aria-hidden");
  await expect(page.locator(".primitiv-collapsible__trigger-icon")).toHaveAttribute("data-state", "open");
  await expect(page.locator(".primitiv-collapsible__content-body")).toHaveCSS("display", "block");
});

test("add modal printed the per-component script for its first release", () => {
  const output = readFileSync("styled-site/add-modal-output.txt", "utf8");
  expect(output).toMatch(/@primitiv-ui\/web@[\d.]+\/dist\/cdn\/modal\.js/);
});

test("the printed modal is styled and working: a hidden dialog that opens as a styled modal", async ({ page }) => {
  const dialog = page.locator("dialog.primitiv-modal:not(.primitiv-confirm-dialog)");
  for (const part of ["trigger", "content", "title", "description", "close"]) {
    await expect(page.locator(`primitiv-modal-${part}`).first()).toHaveCSS("display", "contents");
  }
  await expect(dialog).toBeHidden();

  await page.getByRole("button", { name: "Edit profile", exact: true }).first().click();
  await expect(page.getByRole("dialog", { name: "Edit profile" })).toBeVisible();
  await expect(dialog).toHaveCSS("display", "flex");
  await expect(dialog).toHaveAttribute("data-state", "open");
  await expect(dialog.locator(".primitiv-modal__header")).toHaveCSS("display", "flex");
  await expect(dialog.locator(".primitiv-modal__body")).toHaveCSS("display", "flex");
  expect(parseFloat(await dialog.evaluate((element) => getComputedStyle(element).borderTopWidth))).toBeGreaterThan(0);

  await page.getByRole("button", { name: "Done" }).click();
  await expect(page.locator("primitiv-modal").first()).not.toHaveAttribute("open");
  await expect(dialog).toBeHidden();
});

test("add confirm-dialog loads Modal's script: its markup is the Modal elements", () => {
  const output = readFileSync("styled-site/add-confirm-dialog-output.txt", "utf8");
  expect(output).toMatch(/@primitiv-ui\/web@[\d.]+\/dist\/cdn\/modal\.js/);
  expect(output).not.toContain("confirm-dialog.js");
});

test("the printed confirm dialog is a styled modal whose Cancel closes it", async ({ page }) => {
  await page.getByRole("button", { name: "Remove member" }).click();
  const dialog = page.getByRole("dialog", { name: "Remove member?" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveClass(/primitiv-confirm-dialog/);
  await expect(dialog).toHaveAccessibleDescription("They will lose access immediately. This can't be undone.");
  await expect(dialog.getByRole("button", { name: "Remove" })).toHaveCSS("display", "flex");
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toBeHidden();
});

test("add drawer loads Modal's script: a drawer is the Modal elements", () => {
  const output = readFileSync("styled-site/add-drawer-output.txt", "utf8");
  expect(output).toMatch(/@primitiv-ui\/web@[\d.]+\/dist\/cdn\/modal\.js/);
  expect(output).not.toContain("drawer.js");
});

test("the printed drawer opens modally, docked to the right edge, and Done closes it", async ({ page }) => {
  await page.getByRole("button", { name: "Open settings" }).click();
  const dialog = page.getByRole("dialog", { name: "Settings" });
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate((element) => element.matches(":modal"))).toBe(true);
  // Polled: the drawer slides in, so its box settles at the edge after the transition.
  const edge = () => dialog.evaluate((element) => {
    const { right, top } = element.getBoundingClientRect();
    return [Math.round(right), Math.round(top)];
  });
  await expect.poll(edge).toEqual([page.viewportSize()!.width, 0]);
  await expect(dialog.locator(".primitiv-drawer__header")).toHaveCSS("display", "flex");
  await dialog.getByRole("button", { name: "Done" }).click();
  await expect(dialog).toBeHidden();
});

test("add popover printed the per-component script for its first release", () => {
  const output = readFileSync("styled-site/add-popover-output.txt", "utf8");
  expect(output).toMatch(/@primitiv-ui\/web@[\d.]+\/dist\/cdn\/popover\.js/);
});

test("the printed popover opens anchored under its trigger with no anchor-name wired", async ({ page }) => {
  const trigger = page.getByRole("button", { name: "Edit profile", exact: true }).last();
  await trigger.click();
  const panel = page.getByRole("dialog", { name: "Profile" });
  await expect(panel).toBeVisible();
  await expect(panel).toHaveCSS("display", "flex");
  // The trigger is the panel's implicit anchor (showPopover's source), so the
  // bottom placement puts the panel below it, centred on it.
  const geometry = async () => {
    const [t, p] = await Promise.all([trigger.boundingBox(), panel.boundingBox()]);
    return {
      below: p!.y >= t!.y + t!.height,
      centred: Math.abs(p!.x + p!.width / 2 - (t!.x + t!.width / 2)) < 2,
    };
  };
  await expect.poll(geometry).toEqual({ below: true, centred: true });
  await panel.getByRole("button", { name: "Close" }).click();
  await expect(panel).toBeHidden();
});

test("add tooltip printed the per-component script for its first release", () => {
  const output = readFileSync("styled-site/add-tooltip-output.txt", "utf8");
  expect(output).toMatch(/@primitiv-ui\/web@[\d.]+\/dist\/cdn\/tooltip\.js/);
});

test("the printed tooltip opens anchored above its trigger, arrow and all, with no anchor-name wired", async ({ page }) => {
  const trigger = page.getByRole("button", { name: "Save", exact: true }).last();
  await trigger.focus();
  const bubble = page.getByRole("tooltip", { name: "Saves your work" });
  await expect(bubble).toBeVisible();
  await expect(bubble).toHaveCSS("display", "block");
  // The trigger is the bubble's implicit anchor (showPopover's source), so the
  // top placement puts the bubble above it, centred on it; the arrow pokes
  // out past the bubble's bottom edge rather than being clipped by the
  // popover's UA overflow.
  const arrow = page.locator("primitiv-tooltip-arrow").last();
  const geometry = async () => {
    const [t, b, a] = await Promise.all([trigger.boundingBox(), bubble.boundingBox(), arrow.boundingBox()]);
    return {
      above: b!.y + b!.height <= t!.y,
      centred: Math.abs(b!.x + b!.width / 2 - (t!.x + t!.width / 2)) < 2,
      tail: a!.y + a!.height > b!.y + b!.height,
    };
  };
  await expect.poll(geometry).toEqual({ above: true, centred: true, tail: true });
  await page.keyboard.press("Escape");
  await expect(bubble).toBeHidden();
});
