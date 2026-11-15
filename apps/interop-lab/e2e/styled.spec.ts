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
  const padding = await page.locator("primitiv-tabs").getByRole("tabpanel").evaluate((panel) => getComputedStyle(panel).paddingBlockStart);
  expect(parseFloat(padding)).toBeGreaterThan(0);
});

test("a trigger's wrapper takes no box, so its button lays out as React's does", async ({ page }) => {
  await expect(page.locator("primitiv-tabs-trigger").first()).toHaveCSS("display", "contents");
});

test("the printed markup is a working tab set", async ({ page }) => {
  await expect(tab(page, "One")).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("primitiv-tabs").getByRole("tabpanel")).toHaveText("First panel");
  await tab(page, "One").focus();
  await page.keyboard.press("ArrowRight");
  await expect(tab(page, "Two")).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("primitiv-tabs").getByRole("tabpanel")).toHaveText("Second panel");
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
  // Scoped to the accordion: the Data Table on this page has a labelled region too.
  const regions = page.locator("primitiv-accordion").getByRole("region");
  await expect(regions).toHaveCount(1);

  await accordionTrigger(page, "Two").click();
  await expect(page.getByRole("region", { name: "Two" })).toHaveText("Second panel");
  await expect(page.locator(".primitiv-accordion__trigger-icon").nth(1)).toHaveAttribute("data-state", "open");
  await expect(regions).toHaveCount(1);
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
  await panel.getByRole("button", { name: "Done" }).click();
  await expect(panel).toBeHidden();
});

test("add tooltip printed the per-component script for its first release", () => {
  const output = readFileSync("styled-site/add-tooltip-output.txt", "utf8");
  expect(output).toMatch(/@primitiv-ui\/web@[\d.]+\/dist\/cdn\/tooltip\.js/);
});

test("the printed tooltip opens anchored above its trigger, arrow and all, with no anchor-name wired", async ({ page }) => {
  const trigger = page.locator("primitiv-tooltip-trigger").getByRole("button", { name: "Save", exact: true }).last();
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
  const trigger = page.locator("primitiv-tooltip-trigger").getByRole("button", { name: "Save", exact: true }).last();
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
  const trigger = page.locator("primitiv-tooltip-trigger").getByRole("button", { name: "Save", exact: true }).last();
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
  // The menu its own trigger opens — not another trail's on the page.
  const menu = page.locator("primitiv-dropdown", { has: trigger }).locator("primitiv-dropdown-content").first();
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

test("add toggle-group printed the per-component script for its first release", () => {
  const output = readFileSync("styled-site/add-toggle-group-output.txt", "utf8");
  expect(output).toMatch(/@primitiv-ui\/web@[\d.]+\/dist\/cdn\/toggle-group\.js/);
});

test("the printed toggle group's items are the track's flex items, styled and working", async ({ page }) => {
  const group = page.getByRole("group", { name: "Formatting" });
  await expect(page.locator("primitiv-toggle-group-item").first()).toHaveCSS("display", "contents");
  await expect(group).toHaveCSS("display", /flex/);
  const bold = group.getByRole("button", { name: "Bold" });
  const italic = group.getByRole("button", { name: "Italic" });
  await expect(bold).toHaveAttribute("aria-pressed", "true");
  // A pressed item and an unpressed one are painted differently.
  const fill = (locator: typeof bold) => locator.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(await fill(bold)).not.toBe(await fill(italic));
  await italic.click();
  await expect(italic).toHaveAttribute("aria-pressed", "true");
  await expect(group).toHaveAttribute("value", "bold italic");
  // The items sit side by side in the track, as React's buttons do.
  const [a, b] = await Promise.all([bold.boundingBox(), italic.boundingBox()]);
  expect(Math.abs(a!.y - b!.y)).toBeLessThan(1);
  expect(b!.x).toBeGreaterThan(a!.x + a!.width - 1);
});

test("add segmented-control printed the per-component script for its first release", () => {
  const output = readFileSync("styled-site/add-segmented-control-output.txt", "utf8");
  expect(output).toMatch(/@primitiv-ui\/web@[\d.]+\/dist\/cdn\/segmented-control\.js/);
});

test("the printed segmented control's segments are the track's grid items, styled and working", async ({ page }) => {
  const control = page.getByRole("radiogroup", { name: "Range" });
  await expect(page.locator("primitiv-segmented-control-item").first()).toHaveCSS("display", "contents");
  await expect(control).toHaveCSS("display", /grid/);
  const day = control.getByRole("radio", { name: "Day" });
  const week = control.getByRole("radio", { name: "Week" });
  const month = control.getByRole("radio", { name: "Month" });
  await expect(week).toHaveAttribute("aria-checked", "true");
  // A selected segment and an unselected one are painted differently.
  const fill = (locator: typeof day) => locator.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(await fill(week)).not.toBe(await fill(day));
  await month.click();
  await expect(month).toHaveAttribute("aria-checked", "true");
  await expect(control).toHaveAttribute("value", "month");
  // --justified shares the track: the segments sit side by side at one width.
  const [a, b] = await Promise.all([day.boundingBox(), month.boundingBox()]);
  expect(Math.abs(a!.y - b!.y)).toBeLessThan(1);
  expect(Math.abs(a!.width - b!.width)).toBeLessThan(1);
});

for (const component of ["radio-card", "checkbox-card", "slider"]) {
  test(`add ${component} printed the per-component script for its first release`, () => {
    const output = readFileSync(`styled-site/add-${component}-output.txt`, "utf8");
    expect(output).toMatch(new RegExp(`@primitiv-ui/web@[\\d.]+/dist/cdn/${component}\\.js`));
  });
}

test("the printed radio cards are styled and working, the dot following the selection", async ({ page }) => {
  const group = page.getByRole("radiogroup", { name: "Plan" });
  await expect(group).toHaveCSS("display", "block");
  await expect(page.locator("primitiv-radio-card-item").first()).toHaveCSS("display", "contents");
  const pro = group.getByRole("radio", { name: /Pro/ });
  const starter = group.getByRole("radio", { name: /Starter/ });
  await expect(pro).toHaveAttribute("aria-checked", "true");
  const border = (locator: typeof pro) => locator.evaluate((el) => getComputedStyle(el).borderColor);
  expect(await border(pro)).not.toBe(await border(starter));
  await starter.click();
  await expect(starter).toHaveAttribute("aria-checked", "true");
  await expect(group).toHaveAttribute("value", "starter");
  await expect(starter.locator(".primitiv-radio-card__dot")).toHaveAttribute("data-state", "checked");
});

test("the printed checkbox card is styled and working, its mark following the state", async ({ page }) => {
  const card = page.getByRole("checkbox", { name: /Email updates/ });
  await expect(page.locator("primitiv-checkbox-card")).toHaveCSS("display", "contents");
  await expect(card).toHaveAttribute("aria-checked", "true");
  const mark = card.locator(".primitiv-checkbox-card__mark");
  await expect(mark).toHaveAttribute("data-state", "checked");
  await card.click();
  await expect(card).toHaveAttribute("aria-checked", "false");
  await expect(mark).toHaveAttribute("data-state", "unchecked");
});

test("the printed slider is styled and working: the thumb sits at its value and follows a press", async ({ page }) => {
  const root = page.locator("primitiv-slider");
  const thumb = page.getByRole("slider", { name: "Volume" });
  await expect(thumb).toHaveAttribute("aria-valuenow", "40");
  await root.scrollIntoViewIfNeeded();
  const box = (await root.boundingBox())!;
  const thumbBox = (await thumb.boundingBox())!;
  // The registry centres the thumb on its inset with a -50% translate.
  expect(Math.abs(thumbBox.x + thumbBox.width / 2 - (box.x + box.width * 0.4))).toBeLessThan(2);
  await page.mouse.click(box.x + box.width * 0.8, box.y + box.height / 2);
  await expect(thumb).toHaveAttribute("aria-valuenow", "80");
  const range = (await page.locator("primitiv-slider-range").boundingBox())!;
  expect(Math.abs(range.x + range.width - (box.x + box.width * 0.8))).toBeLessThan(2);
});

test("add breadcrumb-overflow loads Dropdown's script: its menu is the Dropdown elements", () => {
  const output = readFileSync("styled-site/add-breadcrumb-overflow-output.txt", "utf8");
  expect(output).toMatch(/@primitiv-ui\/web@[\d.]+\/dist\/cdn\/dropdown\.js/);
  expect(output).not.toContain("breadcrumb-overflow.js");
});

test("the printed breadcrumb overflow opens a styled menu of the hidden crumbs, anchored under its trigger", async ({ page }) => {
  const trail = page.locator("nav.primitiv-breadcrumb-overflow");
  // Room below for the menu, so it takes its bottom-start placement rather
  // than the fallback above.
  await page.evaluate(() => {
    document.body.style.paddingBlockEnd = "100vh";
  });
  await trail.evaluate((el) => window.scrollBy(0, el.getBoundingClientRect().top - 40));
  const trigger = trail.getByRole("button", { name: "Show hidden pages" });
  // The trigger reads as a bare glyph in the trail, not a framed button.
  await expect(trigger).toHaveCSS("border-top-width", "0px");
  await trigger.click();
  const menu = trail.getByRole("menu");
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("menuitem")).toHaveText(["Library", "Fiction", "Mystery"]);
  await expect(menu.getByRole("menuitem", { name: "Fiction" })).toHaveAttribute("href", "/library/fiction");
  const [t, m] = await Promise.all([trigger.boundingBox(), menu.boundingBox()]);
  expect(m!.y).toBeGreaterThanOrEqual(t!.y + t!.height - 1);
  expect(Math.abs(m!.x - t!.x)).toBeLessThan(24);
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("add split-button prints its own script, which defines the Dropdown its menu is made of", () => {
  const output = readFileSync("styled-site/add-split-button-output.txt", "utf8");
  expect(output).toMatch(/@primitiv-ui\/web@[\d.]+\/dist\/cdn\/split-button\.js/);
});

test("the printed split button welds two halves and opens a styled menu under the group, as wide as it", async ({ page }) => {
  const group = page.locator("primitiv-split-button");
  // Room below for the menu, so it takes its bottom-start placement rather
  // than the fallback above.
  await page.evaluate(() => {
    document.body.style.paddingBlockEnd = "100vh";
  });
  await group.evaluate((el) => window.scrollBy(0, el.getBoundingClientRect().top - 40));
  const action = group.getByRole("button", { name: "Save", exact: true });
  const trigger = group.getByRole("button", { name: "Change save action" });
  const [a, t] = await Promise.all([action.boundingBox(), trigger.boundingBox()]);
  // The weld: one row, the same height, the trigger overlapping by one border.
  expect(Math.abs(a!.y - t!.y)).toBeLessThan(1);
  expect(Math.abs(a!.height - t!.height)).toBeLessThan(1);
  expect(Math.abs(t!.x - (a!.x + a!.width))).toBeLessThanOrEqual(1);
  await action.focus();
  await page.keyboard.press("ArrowDown");
  const menu = group.getByRole("menu");
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("menuitem", { name: "Save", exact: true })).toBeFocused();
  // The menu scales in from 0.97: measure once it has settled.
  await menu.evaluate((el) => Promise.all(el.getAnimations().map((animation) => animation.finished)));
  const [g, m] = await Promise.all([group.boundingBox(), menu.boundingBox()]);
  // Anchored to the group, not the trigger: leading edges aligned, at least as wide.
  expect(m!.y).toBeGreaterThanOrEqual(g!.y + g!.height - 1);
  expect(Math.abs(m!.x - g!.x)).toBeLessThan(2);
  expect(m!.width).toBeGreaterThanOrEqual(g!.width - 1);
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("add listbox printed the per-component script for its first release", () => {
  const output = readFileSync("styled-site/add-listbox-output.txt", "utf8");
  expect(output).toMatch(/@primitiv-ui\/web@[\d.]+\/dist\/cdn\/listbox\.js/);
});

test("the printed listbox is a styled column whose selected option shows its mark", async ({ page }) => {
  const listbox = page.getByRole("listbox", { name: "Produce" });
  await expect(listbox).toHaveCSS("display", "flex");
  await expect(listbox.getByRole("group", { name: "Fruit" })).toBeVisible();
  const apple = listbox.getByRole("option", { name: "Apple" });
  const banana = listbox.getByRole("option", { name: "Banana" });
  await expect(apple).toHaveAttribute("aria-selected", "true");
  // The checkbox mark is drawn in CSS, filled only while its option is selected.
  const mark = (option: typeof apple) =>
    option.locator(".primitiv-listbox__option-checkbox").evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(await mark(apple)).not.toBe(await mark(banana));
  await banana.click();
  await expect(listbox).toHaveAttribute("value", "apple banana");
  await expect(banana).toHaveAttribute("aria-selected", "true");
});

test("add select printed the per-component script for its first release", () => {
  const output = readFileSync("styled-site/add-select-output.txt", "utf8");
  expect(output).toMatch(/@primitiv-ui\/web@[\d.]+\/dist\/cdn\/select\.js/);
});

test("the printed select opens its list anchored under the trigger, and chooses", async ({ page }) => {
  const trigger = page.getByRole("button", { name: "Fruit", exact: true });
  await expect(trigger).toHaveText("Apple");
  // The select ends the page: give the list room below so it keeps its default
  // placement rather than flipping above (which position-try-fallbacks does).
  await page.setViewportSize({ width: 1280, height: 2000 });
  await trigger.evaluate((el) => el.scrollIntoView({ block: "center" }));
  await trigger.click();
  const list = page.locator("primitiv-select-content");
  await expect(list).toBeVisible();
  // The list scales in as it opens: measure where it settles, not mid-animation.
  await list.evaluate((el) => Promise.all(el.getAnimations().map((animation) => animation.finished)));
  const [t, l] = await Promise.all([trigger.boundingBox(), list.boundingBox()]);
  // Below the trigger, hugging its inline-start edge, at least as wide.
  expect(l!.y).toBeGreaterThanOrEqual(t!.y + t!.height - 1);
  expect(Math.abs(l!.x - t!.x)).toBeLessThan(2);
  expect(l!.width).toBeGreaterThanOrEqual(t!.width - 1);
  // Only the chosen item's indicator shows.
  await expect(list.locator("primitiv-select-item-indicator:visible")).toHaveCount(1);
  await list.getByRole("option", { name: "Carrot" }).click();
  await expect(trigger).toHaveText("Carrot");
  await expect(list).toBeHidden();
});

test("add combobox printed the per-component script for its first release", () => {
  const output = readFileSync("styled-site/add-combobox-output.txt", "utf8");
  expect(output).toMatch(/@primitiv-ui\/web@[\d.]+\/dist\/cdn\/combobox\.js/);
});

test("the printed combobox opens its list anchored under the control, and commits", async ({ page }) => {
  const field = page.getByRole("combobox", { name: "Framework", exact: true });
  const control = page.locator(".primitiv-combobox__control");
  await expect(field).toHaveAttribute("role", "combobox");
  // The combobox ends the page: give the list room below so it keeps its
  // default placement rather than flipping above.
  await page.setViewportSize({ width: 1280, height: 2000 });
  await field.evaluate((el) => el.scrollIntoView({ block: "center" }));
  await field.click();
  await page.keyboard.type("s");
  const list = page.locator("primitiv-combobox-content");
  await expect(list).toBeVisible();
  // The list scales in as it opens: measure where it settles, not mid-animation.
  await list.evaluate((el) => Promise.all(el.getAnimations().map((animation) => animation.finished)));
  const [c, l] = await Promise.all([control.boundingBox(), list.boundingBox()]);
  // Below the control, hugging its inline-start edge, at least as wide.
  expect(l!.y).toBeGreaterThanOrEqual(c!.y + c!.height - 1);
  expect(Math.abs(l!.x - c!.x)).toBeLessThan(2);
  expect(l!.width).toBeGreaterThanOrEqual(c!.width - 1);
  // The control is the framed box, and the field sits inside it.
  const f = await field.boundingBox();
  expect(f!.x).toBeGreaterThan(c!.x);
  expect(f!.x + f!.width).toBeLessThan(c!.x + c!.width);
  // No mark shows until something is committed.
  await expect(list.locator(".primitiv-combobox__item-indicator:visible")).toHaveCount(0);
  await page.keyboard.press("ArrowDown");
  await expect(list.getByRole("option", { name: "React", exact: true })).toHaveAttribute("data-highlighted", "");
  await list.getByRole("option", { name: "Svelte" }).click();
  await expect(field).toHaveValue("Svelte");
  await expect(list).toBeHidden();
  // A filtered-out item is display: none even though the item class sets a display.
  await field.fill("zzz");
  await expect(list).toBeVisible();
  await expect(list.getByRole("option", { name: "React", exact: true })).toBeVisible();
  await page.evaluate(() => {
    for (const item of document.querySelectorAll<HTMLElement>("primitiv-combobox-item")) item.hidden = true;
  });
  await expect(list.getByRole("option")).toHaveCount(0);
  await expect(list.getByText("No matches")).toBeVisible();
});

test("add navigation-menu printed the per-component script for its first release", () => {
  const output = readFileSync("styled-site/add-navigation-menu-output.txt", "utf8");
  expect(output).toMatch(/@primitiv-ui\/web@[\d.]+\/dist\/cdn\/navigation-menu\.js/);
});

test("the printed navigation menu is a block landmark whose wrappers take no box", async ({ page }) => {
  const nav = page.getByRole("navigation", { name: "Main" });
  await expect(nav).toHaveCSS("display", "block");
  await expect(page.locator("primitiv-navigation-menu-trigger").first()).toHaveCSS("display", "contents");
  await expect(page.locator("primitiv-navigation-menu-link").first()).toHaveCSS("display", "contents");
  // Before anything opens, the force-mounted viewport and indicator are invisible and let clicks through.
  await expect(page.locator(".primitiv-navigation-menu__viewport")).toHaveCSS("opacity", "0");
  await expect(page.locator(".primitiv-navigation-menu__viewport")).toHaveCSS("pointer-events", "none");
});

test("the printed navigation menu opens its panel anchored under the open trigger, the arrow pointing at it", async ({ page }) => {
  const nav = page.getByRole("navigation", { name: "Main" });
  await nav.scrollIntoViewIfNeeded();
  const viewport = page.locator(".primitiv-navigation-menu__viewport");
  const arrow = page.locator(".primitiv-navigation-menu__indicator");
  for (const name of ["Concepts", "Resources"]) {
    const trigger = nav.getByRole("button", { name, exact: true });
    await trigger.click();
    await expect(viewport).toHaveCSS("opacity", "1");
    const geometry = async () => {
      const [t, v, a] = await Promise.all([trigger.boundingBox(), viewport.boundingBox(), arrow.boundingBox()]);
      const centre = t!.x + t!.width / 2;
      return {
        below: v!.y >= t!.y + t!.height,
        under: v!.x <= centre && centre <= v!.x + v!.width,
        arrowAtTrigger: Math.abs(a!.x + a!.width / 2 - centre) < 2,
      };
    };
    await expect.poll(geometry).toEqual({ below: true, under: true, arrowAtTrigger: true });
  }
  await expect(nav.getByRole("link", { name: /GitHub/ })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(viewport).toHaveCSS("opacity", "0");
});

test("add tree printed the per-component script for its first release", () => {
  const output = readFileSync("styled-site/add-tree-output.txt", "utf8");
  expect(output).toMatch(/@primitiv-ui\/web@[\d.]+\/dist\/cdn\/tree\.js/);
});

test("the printed tree indents each level, styles its path as a breadcrumb, and collapses a group", async ({ page }) => {
  // The element itself: the Miller Columns strip on this page has a tree named "Files" too.
  const tree = page.locator("primitiv-tree");
  await tree.scrollIntoViewIfNeeded();
  await expect(tree).toHaveCSS("display", "block");
  // Each row's indent comes from the depth the element publishes.
  const indent = (name: string) =>
    page.getByRole("treeitem", { name, exact: true }).evaluate((row) => {
      const target = row.matches("primitiv-tree-branch") ? row.querySelector("primitiv-tree-branch-control")! : row;
      return parseFloat(getComputedStyle(target).paddingInlineStart);
    });
  const [top, middle, deep] = [await indent("src"), await indent("components"), await indent("Button.tsx")];
  expect(middle).toBeGreaterThan(top);
  expect(deep).toBeGreaterThan(middle);
  // The path clones the printed Breadcrumb template, so it wears Breadcrumb's classes.
  const current = page.locator(".primitiv-tree__selection-path .primitiv-breadcrumb__page");
  await expect(current).toHaveText("Button.tsx");
  await expect(page.locator(".primitiv-tree__selection-path nav.primitiv-breadcrumb")).toHaveCount(1);
  // A click on the row collapses it by the grid-row track, and the group stays out of the a11y tree.
  await page.locator('primitiv-tree-branch[value="components"] > primitiv-tree-branch-control').click();
  await expect(page.getByRole("treeitem", { name: "Button.tsx", exact: true })).toHaveCount(0);
  const group = page.locator('primitiv-tree-branch[value="components"] > primitiv-tree-branch-content');
  await expect(group).toHaveCSS("grid-template-rows", "0px");
});


test("add stepper printed the per-component script for its first release", () => {
  const output = readFileSync("styled-site/add-stepper-output.txt", "utf8");
  expect(output).toMatch(/@primitiv-ui\/web@[\d.]+\/dist\/cdn\/stepper\.js/);
});

// Each step's <button> is the only child of its <primitiv-stepper-step>, so a
// structural rule written against React's flat list (`:first-child`, `+`) has
// to look past it.
const stepper = (page: import("@playwright/test").Page) => page.getByRole("tablist", { name: "Sign-up progress" });
const connector = (page: import("@playwright/test").Page, name: string, pseudo: "::before" | "::after", property: "content" | "transform") =>
  stepper(page)
    .getByRole("tab", { name, exact: false })
    .evaluate((step, [pseudo, property]) => getComputedStyle(step, pseudo).getPropertyValue(property), [pseudo, property] as const);

test("the stepper's stylesheet takes the step wrapper's box", async ({ page }) => {
  // A page linking Stepper's sheet alone: `add stepper` does not install Tabs' styles.
  const markup = readFileSync("styled-site/stepper.example.html", "utf8");
  await page.route("**/stepper-only.html", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<!doctype html><link rel="stylesheet" href="/styled-site/primitiv/stepper/styles.css">${markup}`,
    }),
  );
  await page.goto("/stepper-only.html");
  await expect(page.locator("primitiv-stepper-step").first()).toHaveCSS("display", "contents");
  await expect(page.locator("primitiv-stepper-list")).toHaveCSS("display", "grid");
});

test("the printed stepper draws a connector into every step but the first, filled up to the current one", async ({ page }) => {
  await stepper(page).scrollIntoViewIfNeeded();
  await expect(stepper(page)).toHaveCSS("display", "grid");
  expect(await connector(page, "Account", "::before", "content")).toBe("none");
  expect(await connector(page, "Billing", "::before", "content")).not.toBe("none");
  expect(await connector(page, "Review", "::before", "content")).not.toBe("none");
  // Reached (the current step) fills its incoming segment; an upcoming one does not.
  await expect.poll(() => connector(page, "Billing", "::after", "transform")).toBe("matrix(1, 0, 0, 1, 0, 0)");
  await expect.poll(() => connector(page, "Review", "::after", "transform")).toBe("matrix(0, 0, 0, 1, 0, 0)");
});

test("the printed stepper activates manually: an arrow moves focus, Enter moves the step", async ({ page }) => {
  // Manual is the element's own default, not something the markup has to say.
  await expect(page.locator("primitiv-stepper")).not.toHaveAttribute("activation-mode", /.*/);
  const billing = stepper(page).getByRole("tab", { name: "Billing" });
  await billing.focus();
  await page.keyboard.press("ArrowRight");
  const review = stepper(page).getByRole("tab", { name: "Review" });
  await expect(review).toBeFocused();
  await expect(billing).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("Enter");
  await expect(review).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel", { name: "3 Review" })).toHaveText("Check everything before you submit.");
  await expect.poll(() => connector(page, "Review", "::after", "transform")).toBe("matrix(1, 0, 0, 1, 0, 0)");
});

test("a vertical stepper runs each connector down out of its marker, and none out of the last", async ({ page }) => {
  await page.locator("primitiv-stepper").evaluate((root) => root.setAttribute("orientation", "vertical"));
  await expect(stepper(page)).toHaveAttribute("data-orientation", "vertical");
  expect(await connector(page, "Account", "::before", "content")).not.toBe("none");
  expect(await connector(page, "Billing", "::before", "content")).not.toBe("none");
  expect(await connector(page, "Review", "::before", "content")).toBe("none");
  // A segment fills when the step BELOW it is reached: Account's runs into the current step.
  await expect.poll(() => connector(page, "Account", "::after", "transform")).toBe("matrix(1, 0, 0, 1, 0, 0)");
});

test("a vertical stepper leaves the current step's outgoing connector empty until the step below is reached", async ({ page }) => {
  await page.locator("primitiv-stepper").evaluate((root) => root.setAttribute("orientation", "vertical"));
  await expect(stepper(page)).toHaveAttribute("data-orientation", "vertical");
  // Billing is current and Review upcoming, so the segment between them is unreached.
  await expect.poll(() => connector(page, "Billing", "::after", "transform")).toBe("matrix(1, 0, 0, 0, 0, 0)");
  // A complete step whose next step is upcoming leaves its segment empty too.
  // A step's progress is its state attribute; the element writes it onto the button.
  await page.locator('primitiv-stepper-step[value="billing"]').evaluate((step) => step.setAttribute("state", "complete"));
  await expect(stepper(page).getByRole("tab", { name: "Billing" })).toHaveAttribute("data-step-state", "complete");
  await page.locator("primitiv-stepper").evaluate((root) => root.setAttribute("value", "account"));
  await expect.poll(() => connector(page, "Billing", "::after", "transform")).toBe("matrix(1, 0, 0, 0, 0, 0)");
});

test("a compact stepper's steps keep their names, though the labels are not drawn", async ({ page }) => {
  await page.locator("primitiv-stepper-list").evaluate((list) => list.classList.add("primitiv-stepper__list--compact"));
  const billing = stepper(page).getByRole("tab", { name: "Billing" });
  await expect(billing).toHaveAttribute("aria-selected", "true");
  // Drawn as a bare segment: the label takes no space of its own.
  const label = billing.locator(".primitiv-stepper__label");
  expect(await label.evaluate((el) => el.getBoundingClientRect().width)).toBeLessThanOrEqual(1);
});

test("add miller-columns printed the per-component script for its first release", () => {
  const output = readFileSync("styled-site/add-miller-columns-output.txt", "utf8");
  expect(output).toMatch(/@primitiv-ui\/web@[\d.]+\/dist\/cdn\/miller-columns\.js/);
});

// Scoped to the strip: the Tree example on this page is named "Files" too.
const files = (page: import("@playwright/test").Page) =>
  page.locator("primitiv-miller-columns").getByRole("tree", { name: "Files" });

test("the printed strip lays its open columns side by side and takes the closed ones out", async ({ page }) => {
  await files(page).scrollIntoViewIfNeeded();
  await expect(files(page)).toHaveCSS("display", "flex");
  const groups = files(page).getByRole("group");
  await expect(groups).toHaveCount(3);
  const lefts = await groups.evaluateAll((all) => all.map((group) => group.getBoundingClientRect().left));
  expect(lefts[1]).toBeGreaterThan(lefts[0]);
  expect(lefts[2]).toBeGreaterThan(lefts[1]);
  // Choosing README closes Docs' and Guides' columns: out of the layout, not just invisible.
  await files(page).getByRole("treeitem", { name: "README.md" }).click();
  await expect(groups).toHaveCount(1);
  await expect(page.locator('primitiv-miller-columns-column[parent="docs"]')).toHaveCSS("display", "none");
});

test("the printed preview panel takes no box while the path ends on a branch, and shows for a leaf", async ({ page }) => {
  const preview = page.locator(".primitiv-miller-columns__preview");
  await expect(preview).toHaveCSS("display", "none");
  await files(page).getByRole("treeitem", { name: "Setup" }).click();
  await expect(preview).toBeVisible();
  await expect(preview).toHaveCSS("display", "flex");
});

test("the printed resize handle widens its column from the keyboard", async ({ page }) => {
  const handle = page.getByRole("separator", { name: "Resize column" });
  await handle.focus();
  await page.keyboard.press("End");
  await expect(handle).toHaveAttribute("aria-valuenow", "480");
  await expect(files(page).getByRole("group").first()).toHaveCSS("width", "480px");
});

test("an item indicator on a leaf takes no box", async ({ page }) => {
  const readme = files(page).getByRole("treeitem", { name: "README.md" });
  await readme.evaluate((item) => {
    const indicator = document.createElement("primitiv-miller-columns-item-indicator");
    indicator.className = "primitiv-miller-columns__item-indicator";
    indicator.textContent = "›";
    item.append(indicator);
  });
  await expect(readme.locator(".primitiv-miller-columns__item-indicator")).toHaveAttribute("hidden", "");
  await expect(readme.locator(".primitiv-miller-columns__item-indicator")).toHaveCSS("display", "none");
});

test("add data-table printed the table's per-component script for its first release", () => {
  const output = readFileSync("styled-site/add-data-table-output.txt", "utf8");
  expect(output).toMatch(/@primitiv-ui\/web@[\d.]+\/dist\/cdn\/table\.js/);
});

test("the printed data table collapses a closed detail row to nothing and opens it in place", async ({ page }) => {
  const shell = page.locator(".primitiv-data-table");
  await shell.scrollIntoViewIfNeeded();
  const api = page.locator("#api-gateway-details");
  const trigger = page.getByRole("button", { name: "Show details for api-gateway" });
  // Force-mounted, so the row is rendered but out of the accessibility tree, and its panel takes no height.
  await expect(api).toHaveAttribute("aria-hidden", "true");
  await expect.poll(() => api.locator(".primitiv-data-table__detail-body").evaluate((el) => el.getBoundingClientRect().height)).toBe(0);
  // The row the markup starts open shows its panel.
  await expect(page.getByText("web-frontend · Preview")).toBeVisible();
  await trigger.click();
  await expect(trigger).toHaveAttribute("data-state", "open");
  await expect(api).not.toHaveAttribute("aria-hidden");
  await expect(page.getByText("api-gateway · Production")).toBeVisible();
  await expect.poll(() => api.locator(".primitiv-data-table__detail-body").evaluate((el) => el.getBoundingClientRect().height)).toBeGreaterThan(0);
  // The chevron turns as the row opens.
  await expect(trigger.locator(".primitiv-data-table__expand-icon")).not.toHaveCSS("transform", "none");
});

test("add code-block printed the per-component script for its first release", () => {
  const output = readFileSync("styled-site/add-code-block-output.txt", "utf8");
  expect(output).toMatch(/@primitiv-ui\/web@[\d.]+\/dist\/cdn\/code-block\.js/);
});

test.describe("the printed code block", () => {
  test.use({ permissions: ["clipboard-read", "clipboard-write"] });

  test("copies its code exactly as written, with no indent from the printed markup", async ({ page }) => {
    const block = page.locator(".primitiv-code-block").filter({ hasText: "greet.ts" });
    await block.scrollIntoViewIfNeeded();
    // The highlighter's token classes are coloured by the stylesheet.
    await expect(block.locator(".token.keyword").first()).not.toHaveCSS("color", await block.locator("code").evaluate((el) => getComputedStyle(el).color));
    await block.getByRole("button", { name: "Copy code" }).click();
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe("export function greet(name: string) {\n  return `Hello, ${name}`;\n}");
  });

  test("shows one glyph at a time, though the page's reset gives every svg a display", async ({ page }) => {
    // By class, not name: the name is what changes.
    const button = page.locator(".primitiv-code-block").filter({ hasText: "greet.ts" }).locator(".primitiv-code-block__copy");
    await expect(button.locator('[data-copy-state="copied"]')).toHaveCSS("display", "none");
    await button.click();
    await expect(button).toHaveAccessibleName("Copied");
    await expect(button.locator('[data-copy-state="idle"]')).toHaveCSS("display", "none");
    await expect(button.locator('[data-copy-state="copied"]')).toBeVisible();
  });
});
