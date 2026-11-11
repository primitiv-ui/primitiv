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

test("the printed tooltip's arrow follows the bubble when it flips as the page scrolls", async ({ page }) => {
  // Room to scroll the trigger to the very top of the viewport and back.
  await page.evaluate(() => {
    document.body.style.paddingBlock = "100vh";
  });
  const trigger = page.getByRole("button", { name: "Save", exact: true }).last();
  const bubble = page.getByRole("tooltip", { name: "Saves your work" });
  const arrow = page.locator("primitiv-tooltip-arrow").last();
  const scrollTriggerTo = (top: number) =>
    trigger.evaluate((el, top) => window.scrollBy(0, el.getBoundingClientRect().top - top), top);
  const sides = async () => {
    const [t, b, a] = await Promise.all([trigger.boundingBox(), bubble.boundingBox(), arrow.boundingBox()]);
    return {
      bubble: b!.y + b!.height <= t!.y ? "above" : b!.y >= t!.y + t!.height ? "below" : "overlapping",
      // The arrow pokes out of the edge that faces the trigger.
      arrow: a!.y < b!.y ? "top edge" : a!.y + a!.height > b!.y + b!.height ? "bottom edge" : "inside",
    };
  };

  await scrollTriggerTo(300);
  await trigger.focus();
  await expect(bubble).toBeVisible();
  await expect.poll(sides).toEqual({ bubble: "above", arrow: "bottom edge" });

  // No room above: the bubble flips below the trigger, and its arrow with it.
  await scrollTriggerTo(2);
  await expect.poll(sides).toEqual({ bubble: "below", arrow: "top edge" });

  // The browser keeps a fallback while it still fits, so it takes no room below
  // to send the bubble back above — and the arrow back underneath.
  const viewport = page.viewportSize()!.height;
  const { height } = (await trigger.boundingBox())!;
  await scrollTriggerTo(viewport - height - 2);
  await expect.poll(sides).toEqual({ bubble: "above", arrow: "bottom edge" });
});

test("the printed tooltip's arrow follows the bubble when it flips across the inline axis", async ({ page }) => {
  const trigger = page.getByRole("button", { name: "Save", exact: true }).last();
  const bubble = page.getByRole("tooltip", { name: "Saves your work" });
  const arrow = page.locator("primitiv-tooltip-arrow").last();
  // A right placement, and a trigger pinned where it can be moved to either edge.
  await page
    .locator("primitiv-tooltip-content")
    .last()
    .evaluate((el) => el.classList.replace("primitiv-tooltip--top", "primitiv-tooltip--right"));
  const pinTrigger = (side: "left" | "right") =>
    trigger.evaluate((el, side) => {
      el.style.cssText = `position: fixed; top: 300px; ${side}: 2px`;
    }, side);
  const sides = async () => {
    const [t, b, a] = await Promise.all([trigger.boundingBox(), bubble.boundingBox(), arrow.boundingBox()]);
    return {
      bubble: b!.x >= t!.x + t!.width ? "right" : b!.x + b!.width <= t!.x ? "left" : "overlapping",
      arrow: a!.x < b!.x ? "left edge" : a!.x + a!.width > b!.x + b!.width ? "right edge" : "inside",
    };
  };

  await pinTrigger("left");
  await trigger.focus();
  await expect(bubble).toBeVisible();
  await expect.poll(sides).toEqual({ bubble: "right", arrow: "left edge" });

  // No room to the right: opened there, the bubble flips to the left, and its
  // arrow with it. (A move with the bubble open fires no scroll or resize, so
  // it is measured as it opens; the scroll test covers a move while open.)
  await trigger.blur();
  await pinTrigger("right");
  await trigger.focus();
  await expect.poll(sides).toEqual({ bubble: "left", arrow: "right edge" });
});


test("the printed popover's arrow follows the panel when it flips as the page scrolls", async ({ page }) => {
  await page.evaluate(() => {
    document.body.style.paddingBlock = "100vh";
  });
  const trigger = page.getByRole("button", { name: "Edit profile", exact: true }).last();
  const panel = page.getByRole("dialog", { name: "Profile" });
  const scrollTriggerTo = (top: number) =>
    trigger.evaluate((el, top) => window.scrollBy(0, el.getBoundingClientRect().top - top), top);
  // The arrow is the panel's ::after, which has no box of its own to measure: a
  // hit just past an edge, on the centre line, lands on the panel only where
  // the arrow's tail pokes out.
  const sides = async () => {
    const [t, p] = await Promise.all([trigger.boundingBox(), panel.boundingBox()]);
    const arrow = await panel.evaluate((el, p) => {
      const x = p.x + p.width / 2;
      const hits = (y: number) => el.contains(document.elementFromPoint(x, y));
      return hits(p.y - 2) ? "top edge" : hits(p.y + p.height + 2) ? "bottom edge" : "none";
    }, p!);
    return { panel: p!.y >= t!.y + t!.height ? "below" : p!.y + p!.height <= t!.y ? "above" : "overlapping", arrow };
  };

  await scrollTriggerTo(100);
  await trigger.click();
  await expect(panel).toBeVisible();
  await expect.poll(sides).toEqual({ panel: "below", arrow: "top edge" });

  // No room below: the panel flips above the trigger, and its arrow with it.
  const viewport = page.viewportSize()!.height;
  const { height } = (await trigger.boundingBox())!;
  await scrollTriggerTo(viewport - height - 2);
  await expect.poll(sides).toEqual({ panel: "above", arrow: "bottom edge" });
});

test("the printed popover's arrow follows the panel when it flips across the inline axis", async ({ page }) => {
  const trigger = page.getByRole("button", { name: "Edit profile", exact: true }).last();
  const panel = page.getByRole("dialog", { name: "Profile" });
  await page
    .locator("primitiv-popover-content")
    .last()
    .evaluate((el) => el.classList.replace("primitiv-popover--bottom", "primitiv-popover--right"));
  const pinTrigger = (side: "left" | "right") =>
    trigger.evaluate((el, side) => {
      el.style.cssText = `position: fixed; top: 300px; ${side}: 2px`;
    }, side);
  const sides = async () => {
    const [t, p] = await Promise.all([trigger.boundingBox(), panel.boundingBox()]);
    const arrow = await panel.evaluate((el, p) => {
      const y = p.y + p.height / 2;
      const hits = (x: number) => el.contains(document.elementFromPoint(x, y));
      return hits(p.x - 2) ? "left edge" : hits(p.x + p.width + 2) ? "right edge" : "none";
    }, p!);
    return { panel: p!.x >= t!.x + t!.width ? "right" : p!.x + p!.width <= t!.x ? "left" : "overlapping", arrow };
  };

  await pinTrigger("left");
  await trigger.click();
  await expect(panel).toBeVisible();
  await expect.poll(sides).toEqual({ panel: "right", arrow: "left edge" });

  // No room to the right: opened there, the panel flips to the left, and its
  // arrow with it.
  await trigger.click();
  await expect(panel).toBeHidden();
  await pinTrigger("right");
  await trigger.click();
  await expect.poll(sides).toEqual({ panel: "left", arrow: "right edge" });
});

test("add dropdown printed the per-component script for its first release", () => {
  const output = readFileSync("styled-site/add-dropdown-output.txt", "utf8");
  expect(output).toMatch(/@primitiv-ui\/web@[\d.]+\/dist\/cdn\/dropdown\.js/);
});

test("the printed dropdown opens below its trigger with only the checked indicators showing", async ({ page }) => {
  const trigger = page.getByRole("button", { name: "Options", exact: true }).last();
  // Room below for the whole menu, so it takes its bottom-start placement
  // rather than a fallback above.
  await page.evaluate(() => {
    document.body.style.paddingBlockEnd = "100vh";
  });
  await trigger.evaluate((el) => window.scrollBy(0, el.getBoundingClientRect().top - 40));
  await trigger.click();
  const menu = page.locator("primitiv-dropdown-content").last();
  await expect(menu).toBeVisible();
  await expect(menu).toHaveCSS("display", "flex");
  // The trigger is the menu's implicit anchor: bottom-start puts the menu
  // under it, its inline-start edge on the trigger's.
  const geometry = async () => {
    const [t, m] = await Promise.all([trigger.boundingBox(), menu.boundingBox()]);
    return { below: m!.y >= t!.y + t!.height, aligned: Math.abs(m!.x - t!.x) < 2 };
  };
  await expect.poll(geometry).toEqual({ below: true, aligned: true });
  await expect(page.getByRole("menuitem", { name: "Copy" }).last()).toBeFocused();
  const indicators = menu.locator("primitiv-dropdown-item-indicator");
  // Show grid is checked, Light is the radio group's value; Dark is not.
  await expect(indicators.nth(0)).toBeVisible();
  await expect(indicators.nth(1)).toBeVisible();
  await expect(indicators.nth(2)).toBeHidden();
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
});

test("the printed dropdown's submenu opens beside its row with no anchor-name wired", async ({ page }) => {
  await page.getByRole("button", { name: "Options", exact: true }).last().click();
  const share = page.getByRole("menuitem", { name: "Share" }).last();
  await share.hover();
  const submenu = page.locator("primitiv-dropdown-sub-content").last();
  await expect(submenu).toBeVisible();
  const [row, sub] = await Promise.all([share.boundingBox(), submenu.boundingBox()]);
  expect(sub!.x).toBeGreaterThanOrEqual(row!.x + row!.width - 1);
  expect(Math.abs(sub!.y - row!.y)).toBeLessThan(16);
});

test("add context-menu printed the per-component script for its first release", () => {
  const output = readFileSync("styled-site/add-context-menu-output.txt", "utf8");
  expect(output).toMatch(/@primitiv-ui\/web@[\d.]+\/dist\/cdn\/context-menu\.js/);
});

test("the printed context menu opens at the pointer, styled, with only the checked indicators showing", async ({ page }) => {
  const region = page.locator("primitiv-context-menu-trigger").last();
  await region.scrollIntoViewIfNeeded();
  const box = (await region.boundingBox())!;
  const [x, y] = [box.x + 20, box.y + box.height / 2];
  await page.mouse.move(x, y);
  await page.mouse.down({ button: "right" });
  await page.mouse.up({ button: "right" });
  const menu = page.locator("primitiv-context-menu-content").last();
  await expect(menu).toBeVisible();
  await expect(menu).toHaveCSS("display", "flex");
  // A corner of the menu on the pointer, once its enter animation settles; it
  // flips above or before the pointer when there is not room below or after.
  const near = (a: number, b: number) => Math.abs(a - b) < 2;
  await expect
    .poll(async () => {
      const m = (await menu.boundingBox())!;
      return (near(m.x, x) || near(m.x + m.width, x)) && (near(m.y, y) || near(m.y + m.height, y));
    })
    .toBe(true);
  const indicators = menu.locator("primitiv-context-menu-item-indicator");
  await expect(indicators.nth(0)).toBeVisible();
  await expect(indicators.nth(1)).toBeVisible();
  await expect(indicators.nth(2)).toBeHidden();
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
});

test("the printed context menu's submenu opens beside its row with no anchor-name wired", async ({ page }) => {
  const region = page.locator("primitiv-context-menu-trigger").last();
  await region.scrollIntoViewIfNeeded();
  const box = (await region.boundingBox())!;
  await page.mouse.move(box.x + 20, box.y + box.height / 2);
  await page.mouse.down({ button: "right" });
  await page.mouse.up({ button: "right" });
  const share = page.locator("primitiv-context-menu-content").last().getByRole("menuitem", { name: "Share" });
  await share.hover();
  const submenu = page.locator("primitiv-context-menu-sub-content").last();
  await expect(submenu).toBeVisible();
  const [row, sub] = await Promise.all([share.boundingBox(), submenu.boundingBox()]);
  expect(sub!.x).toBeGreaterThanOrEqual(row!.x + row!.width - 1);
});
