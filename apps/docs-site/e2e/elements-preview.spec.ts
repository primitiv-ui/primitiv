import { test, expect, type Page } from "@playwright/test";

// Elements mode previews render the REAL custom elements (`@primitiv-ui/web`),
// not the React component styled to look like them, because a developer
// reading the Elements page opens devtools and expects the DOM to match the
// code tab. Elements is the default framework and opens headless, but the
// preview is always the styled markup: bare markup previews as unstyled HTML.

const FRAMEWORK_KEY = "primitiv-docs-framework";

/** An example on a component page: the block that follows its heading. */
const cell = (page: Page, id: string) => page.locator(`h3#${id} + *`);

test("the Tabs playground and examples are defined <primitiv-tabs> elements", async ({
  page,
}) => {
  await page.goto("/components/tabs/");
  const tabs = page.locator(".docs-elements-preview primitiv-tabs");
  await expect(tabs.first()).toBeAttached();
  // The element wired the APG roles onto the <button> it wraps — which only
  // happens once the definition has loaded (it is imported on demand).
  await expect(tabs.first().locator("button").first()).toHaveAttribute("role", "tab");
  expect(await page.evaluate(() => !!customElements.get("primitiv-tabs"))).toBe(true);
  // Styled even under Headless (the default): the preview always shows the
  // finished component, as React mode's does; only the code tabs differ.
  await expect(tabs.first()).toHaveAttribute("class", /primitiv-tabs/);
});

test("the Controlled example follows primitiv-tabs-change", async ({ page }) => {
  await page.goto("/components/tabs/");
  const example = cell(page, "controlled");
  const tab = example.getByRole("tab", { name: "Accessibility" });
  await tab.click();
  await expect(tab).toHaveAttribute("aria-selected", "true");
  await expect(example.locator("[data-active-value]")).toHaveText("a11y");
});

test("the Accordion playground and examples are defined <primitiv-accordion> elements", async ({
  page,
}) => {
  await page.goto("/components/accordion/");
  const accordion = page.locator(".docs-elements-preview primitiv-accordion");
  await expect(accordion.first()).toBeAttached();
  const trigger = accordion.first().getByRole("button").first();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  expect(await page.evaluate(() => !!customElements.get("primitiv-accordion"))).toBe(true);
  // Styled under Headless too, its closed panels kept out of the a11y tree.
  await expect(accordion.first()).toHaveAttribute("class", /primitiv-accordion/);
  await expect(accordion.first().getByRole("region")).toHaveCount(1);
});

test("the Accordion Controlled example follows primitiv-accordion-change", async ({ page }) => {
  await page.goto("/components/accordion/");
  const example = cell(page, "controlled");
  const trigger = example.getByRole("button", { name: "Can I use the behaviour without the styles?" });
  // The definition loads on demand: wait for the element to have wired its button.
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.click();
  await expect(example.locator("[data-open-items]")).toHaveText("install, headless");
});

test("the Collapsible playground and examples are defined <primitiv-collapsible> elements", async ({
  page,
}) => {
  await page.goto("/components/collapsible/");
  const collapsible = page.locator(".docs-elements-preview primitiv-collapsible");
  await expect(collapsible.first()).toBeAttached();
  const trigger = collapsible.first().getByRole("button").first();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  expect(await page.evaluate(() => !!customElements.get("primitiv-collapsible"))).toBe(true);
  // Styled under Headless too.
  await expect(collapsible.first()).toHaveAttribute("class", /primitiv-collapsible/);
});

test("the Collapsible Controlled example follows primitiv-collapsible-change", async ({ page }) => {
  await page.goto("/components/collapsible/");
  const example = cell(page, "controlled");
  const trigger = example.getByRole("button", { name: "Release notes" });
  // The definition loads on demand: wait for the element to have wired its button.
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await trigger.click();
  await expect(example.locator("[data-open-state]")).toHaveText("closed");
});

test("the Collapsible read-more preview is clamped and swaps its label", async ({ page }) => {
  await page.goto("/components/collapsible/");
  const example = cell(page, "read-more");
  const content = example.locator("primitiv-collapsible-content");
  await expect(content).toHaveAttribute("data-clamped", "true");
  await expect(example.locator("script")).toHaveCount(0);
  await example.getByRole("button", { name: "Show more" }).click();
  await expect(example.getByRole("button", { name: "Show less" })).toHaveAttribute("aria-expanded", "true");
});

test("the Modal playground and examples are defined <primitiv-modal> elements", async ({ page }) => {
  await page.goto("/components/modal/");
  const modal = page.locator(".docs-elements-preview primitiv-modal");
  await expect(modal.first()).toBeAttached();
  const trigger = modal.first().getByRole("button", { name: "Open dialog" });
  // The definition loads on demand: wait for the element to have wired its button.
  await expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
  expect(await page.evaluate(() => !!customElements.get("primitiv-modal"))).toBe(true);
  // Styled under Headless too: the dialog wears the registry classes.
  await expect(modal.first().locator("dialog")).toHaveClass(/primitiv-modal/);

  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Payment details" });
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate((element) => element.matches(":modal"))).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("the Modal headless code drops the lines its styling wrappers stood on", async ({ page }) => {
  await page.goto("/components/modal/");
  const code = await cell(page, "regions").locator("pre").first().innerText();
  expect(code).toContain("<dialog>\n");
  expect(code).not.toMatch(/\n[ \t]*\n[ \t]*<primitiv-modal-title>/);
});

test("the Modal veto example keeps the dialog open while the form is dirty", async ({ page }) => {
  await page.goto("/components/modal/");
  const example = cell(page, "vetoing-dismissal");
  const trigger = example.getByRole("button", { name: "Open a form" });
  await expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
  await trigger.click();
  await page.getByRole("textbox", { name: "Project name" }).fill("Primitiv");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Rename project" })).toBeVisible();
  await page.getByRole("dialog", { name: "Rename project" }).getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByRole("dialog", { name: "Rename project" })).toBeHidden();
});

test("the ConfirmDialog previews are <primitiv-modal> elements, loaded from modal.js", async ({ page }) => {
  await page.goto("/components/confirm-dialog/");
  // Its markup is the Modal elements: the script that defines them is modal's.
  await expect(page.getByText(/dist\/cdn\/modal\.js/).first()).toBeVisible();
  await expect(page.getByText(/define\/modal"/).first()).toBeVisible();
  await expect(page.getByText("confirm-dialog.js")).toHaveCount(0);

  const example = cell(page, "confirming-an-action");
  const trigger = example.getByRole("button", { name: "Publish release" });
  await expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Publish release?" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveClass(/primitiv-confirm-dialog/);
  // Confirm closes it through the wired listener, as the code tab's script does.
  await dialog.getByRole("button", { name: "Publish" }).click();
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("the Stepper previews are defined <primitiv-stepper> elements, loaded from stepper.js", async ({ page }) => {
  await page.goto("/components/stepper/");
  await expect(page.getByText(/dist\/cdn\/stepper\.js/).first()).toBeVisible();
  const root = page.locator(".docs-elements-preview primitiv-stepper").first();
  await expect(root).toHaveClass(/primitiv-stepper/);
  await expect(root.locator("button").first()).toHaveAttribute("role", "tab");
  await expect(root.locator("primitiv-stepper-list")).toHaveCSS("display", "grid");
});

test("the Registry-only notice is React's: Elements mode has a headless form, so it says nothing of the kind", async ({ page }) => {
  await page.goto("/components/stepper/");
  await expect(page.locator(".docs-elements-preview primitiv-stepper").first()).toBeAttached();
  await expect(page.getByText("Registry-only", { exact: true })).toHaveCount(0);
});

test("React mode still says a registry-only component has no Headless mode", async ({ page }) => {
  await page.addInitScript(
    ([key]) => localStorage.setItem(key, JSON.stringify("react")),
    [FRAMEWORK_KEY],
  );
  await page.goto("/components/stepper/");
  await expect(page.getByText("Registry-only", { exact: true })).toBeVisible();
});

test("every Stepper preview fills its card, as the React demos do", async ({ page }) => {
  await page.goto("/components/stepper/");
  const roots = page.locator(".docs-elements-preview primitiv-stepper");
  await expect(roots).toHaveCount(5);
  const widths = await roots.evaluateAll((all) => all.map((root) => root.getBoundingClientRect().width));
  // The playground's root fills its card; a shrunk example spanned half of that.
  for (const width of widths.slice(1)) expect(width).toBeGreaterThan(widths[0] * 0.95);
});

test("the Stepper wizard's Continue completes the step behind and unlocks the one ahead", async ({ page }) => {
  await page.goto("/components/stepper/");
  const example = cell(page, "wizard");
  const profile = example.getByRole("tab", { name: "Profile" });
  await expect(profile).toHaveAttribute("aria-disabled", "true");
  await example.getByRole("button", { name: "Continue" }).click();
  await expect(profile).toHaveAttribute("aria-selected", "true");
  await expect(example.getByRole("tab", { name: "Account" })).toHaveAttribute("data-step-state", "complete");
  await expect(example.getByRole("tab", { name: "Review" })).toHaveAttribute("aria-disabled", "true");
  await expect(example.getByRole("button", { name: "Back" })).toBeEnabled();
  await expect(example.locator(".docs-elements-preview").getByRole("tabpanel")).toHaveText(
    "Tell us who you are. This is what other people see.",
  );
});

test("the Stepper compact example keeps its Step N of M line on the current step", async ({ page }) => {
  await page.goto("/components/stepper/");
  const example = cell(page, "compact");
  // Compact only visually hides the labels, so each segment keeps its name.
  await example.locator(".docs-elements-preview").getByRole("tab", { name: "Account" }).focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await expect(example.locator("[data-step-status]")).toHaveText("Step 2 of 3 — Profile");
});

test("the Miller Columns previews are defined <primitiv-miller-columns> elements, loaded from miller-columns.js", async ({ page }) => {
  await page.goto("/components/miller-columns/");
  await expect(page.getByText(/dist\/cdn\/miller-columns\.js/).first()).toBeVisible();
  const strip = page.locator(".docs-elements-preview primitiv-miller-columns").first();
  await expect(strip).toHaveClass(/primitiv-miller-columns/);
  await expect(strip.getByRole("tree", { name: "Files" })).toBeVisible();
  await expect(strip.getByRole("treeitem", { name: "cover.jpg" })).toHaveAttribute("aria-selected", "true");
});

test("the Miller Columns file browser opens a folder's column beside it", async ({ page }) => {
  await page.goto("/components/miller-columns/");
  const example = cell(page, "file-browser").locator(".docs-elements-preview");
  await expect(example.getByRole("treeitem", { name: "report.pdf" })).toBeVisible();
  await example.getByRole("treeitem", { name: "Pictures" }).click();
  await expect(example.getByRole("treeitem", { name: "Vacation" })).toBeVisible();
  await expect(example.getByRole("treeitem", { name: "report.pdf" })).toBeHidden();
});

test("the Miller Columns preview pane follows the selected file", async ({ page }) => {
  await page.goto("/components/miller-columns/");
  const example = cell(page, "preview-pane").locator(".docs-elements-preview");
  const preview = example.locator("[data-file-preview]");
  await expect(preview).toContainText("wallpaper.png");
  await example.getByRole("treeitem", { name: "README.md" }).click();
  await expect(preview).toContainText("Markdown");
});

test("the Miller Columns selection path renders the path and walks back up it", async ({ page }) => {
  await page.goto("/components/miller-columns/");
  const example = cell(page, "selection-path").locator(".docs-elements-preview");
  const trail = example.getByRole("navigation", { name: "File path" });
  await expect(trail.getByRole("button")).toHaveText(["Documents", "Work", "report.pdf"]);
  await trail.getByRole("button", { name: "Documents" }).click();
  await expect(trail.getByRole("button")).toHaveText(["Documents"]);
  await expect(example.getByRole("treeitem", { name: "report.pdf" })).toBeHidden();
});

test("the Drawer previews are <primitiv-modal> elements that slide in from their side", async ({ page }) => {
  await page.goto("/components/drawer/");
  await expect(page.getByText(/dist\/cdn\/modal\.js/).first()).toBeVisible();
  await expect(page.getByText("drawer.js")).toHaveCount(0);

  const trigger = page.locator(".docs-elements-preview primitiv-modal-trigger button").first();
  await expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
  await trigger.click();
  const dialog = page.locator("dialog.primitiv-drawer[open]");
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate((element) => element.matches(":modal"))).toBe(true);
  await expect(dialog).toHaveAttribute("data-side", /^(top|right|bottom|left)$/);
  // Docked to its edge: a right drawer's box touches the viewport's right edge.
  const side = await dialog.getAttribute("data-side");
  if (side === "right") {
    // Polled: it slides in, so the box settles at the edge after the transition.
    await expect
      .poll(() => dialog.evaluate((element) => Math.round(element.getBoundingClientRect().right)))
      .toBe(page.viewportSize()!.width);
  }
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("the Popover previews are <primitiv-popover> elements anchored to their trigger", async ({ page }) => {
  await page.goto("/components/popover/");
  await expect(page.getByText(/dist\/cdn\/popover\.js/).first()).toBeVisible();
  const example = cell(page, "basic");
  const trigger = example.getByRole("button", { name: "Share" });
  // The definition loads on demand: wait for the element to have wired its button.
  await expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
  await trigger.click();
  const panel = page.getByRole("dialog", { name: "Share this page" });
  await expect(panel).toBeVisible();
  await expect(panel).toHaveClass(/primitiv-popover/);
  // No anchor-name in the markup: the trigger is the panel's implicit anchor.
  await expect
    .poll(async () => {
      const [t, p] = await Promise.all([trigger.boundingBox(), panel.boundingBox()]);
      return p!.y >= t!.y + t!.height;
    })
    .toBe(true);
  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("the Navigation Menu previews are elements whose panel opens under the open trigger", async ({ page }) => {
  await page.goto("/components/navigation-menu/");
  await expect(page.getByText(/dist\/cdn\/navigation-menu\.js/).first()).toBeVisible();
  const example = cell(page, "disclosure-panels");
  const nav = example.locator("primitiv-navigation-menu");
  await expect(nav).toHaveClass(/primitiv-navigation-menu/);
  const trigger = example.getByRole("button", { name: "Resources" });
  // The definition loads on demand: wait for the element to have wired its button.
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  const link = example.getByRole("link", { name: /GitHub/ });
  await expect(link).toBeVisible();
  // No anchor-name in the markup: the open trigger takes a scoped one from the stylesheet.
  const viewport = example.locator(".primitiv-navigation-menu__viewport");
  await expect
    .poll(async () => {
      const [t, v] = await Promise.all([trigger.boundingBox(), viewport.boundingBox()]);
      const centre = t!.x + t!.width / 2;
      return v!.y >= t!.y + t!.height && Math.abs(v!.x + v!.width / 2 - centre) < 2;
    })
    .toBe(true);
  await link.focus();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
});

test("React mode renders the React Navigation Menu, not the elements", async ({ page }) => {
  await page.addInitScript(
    ([key]) => localStorage.setItem(key, JSON.stringify("react")),
    [FRAMEWORK_KEY],
  );
  await page.goto("/components/navigation-menu/");
  await expect(page.getByRole("navigation", { name: "Docs" }).first()).toBeVisible();
  await expect(page.locator("primitiv-navigation-menu")).toHaveCount(0);
});

test("the Tooltip previews are <primitiv-tooltip> elements anchored above their trigger", async ({ page }) => {
  await page.goto("/components/tooltip/");
  await expect(page.getByText(/dist\/cdn\/tooltip\.js/).first()).toBeVisible();
  const example = cell(page, "basic");
  const trigger = example.getByRole("button", { name: "Hover or focus me" });
  // The definition loads on demand: wait for the element to have wired its button.
  await expect(trigger).toHaveAttribute("aria-describedby", /.+/);
  await trigger.focus();
  const bubble = page.getByRole("tooltip", { name: "Opens on hover and focus" });
  await expect(bubble).toBeVisible();
  await expect(bubble).toHaveClass(/primitiv-tooltip/);
  // No anchor-name in the markup: the trigger is the bubble's implicit anchor.
  await expect
    .poll(async () => {
      const [t, b] = await Promise.all([trigger.boundingBox(), bubble.boundingBox()]);
      return b!.y + b!.height <= t!.y;
    })
    .toBe(true);
  await page.keyboard.press("Escape");
  await expect(bubble).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("the Dropdown previews are <primitiv-dropdown> elements anchored to their trigger", async ({ page }) => {
  await page.goto("/components/dropdown/");
  await expect(page.getByText(/dist\/cdn\/dropdown\.js/).first()).toBeVisible();
  const example = cell(page, "actions");
  const trigger = example.getByRole("button", { name: "Actions" });
  // The definition loads on demand: wait for the element to have wired its button.
  await expect(trigger).toHaveAttribute("aria-haspopup", "menu");
  await trigger.click();
  const menu = page.getByRole("menu").filter({ has: page.getByRole("menuitem", { name: "Duplicate" }) });
  await expect(menu).toBeVisible();
  await expect(menu).toHaveClass(/primitiv-dropdown/);
  await expect(page.getByRole("menuitem", { name: "Edit" })).toBeFocused();
  // No anchor-name in the markup: the trigger is the menu's implicit anchor.
  await expect
    .poll(async () => {
      const [t, m] = await Promise.all([trigger.boundingBox(), menu.boundingBox()]);
      return Math.abs(m!.x - t!.x) < 2 && (m!.y >= t!.y + t!.height || m!.y + m!.height <= t!.y);
    })
    .toBe(true);
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("the Context Menu previews are <primitiv-context-menu> elements opened at the pointer", async ({ page }) => {
  await page.goto("/components/context-menu/");
  await expect(page.getByText(/dist\/cdn\/context-menu\.js/).first()).toBeVisible();
  const example = cell(page, "actions");
  const region = example.locator("primitiv-context-menu-trigger");
  // The definition loads on demand: wait for the element to have marked its region.
  await expect(region).toHaveAttribute("data-state", "closed");
  // Click the region itself, so a late layout shift cannot move it from under the pointer.
  await region.click({ button: "right", position: { x: 30, y: 20 } });
  const box = (await region.boundingBox())!;
  const [x, y] = [box.x + 30, box.y + 20];
  const menu = example.locator("primitiv-context-menu-content");
  await expect(menu).toBeVisible();
  await expect(menu).toHaveClass(/primitiv-context-menu/);
  await expect(page.getByRole("menuitem", { name: /^Cut/ })).toBeFocused();
  // No inline left / top: the menu is placed from the position the element publishes.
  const near = (a: number, b: number) => Math.abs(a - b) < 2;
  await expect
    .poll(async () => {
      const m = (await menu.boundingBox())!;
      return (near(m.x, x) || near(m.x + m.width, x)) && (near(m.y, y) || near(m.y + m.height, y));
    })
    .toBe(true);
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
});

test("the Prose preview is plain markup whose children take the flow rhythm", async ({ page }) => {
  await page.goto("/components/prose/");
  const flow = page.locator(".docs-elements-preview .primitiv-flow").first();
  await expect(flow).toBeAttached();
  // No element to define: the class is the whole component.
  expect(await page.evaluate(() => !!customElements.get("primitiv-prose"))).toBe(false);
  // The owl spaces every direct child after the first.
  const first = await flow.locator("> *").first().evaluate((e) => getComputedStyle(e).marginBlockStart);
  const second = await flow.locator("> *").nth(1).evaluate((e) => getComputedStyle(e).marginBlockStart);
  expect(first).toBe("0px");
  expect(parseFloat(second)).toBeGreaterThan(0);
});

for (const [id, rootClass] of [
  ["blockquote", "primitiv-blockquote"],
  ["pull-quote", "primitiv-pull-quote"],
  ["list", "primitiv-list"],
  ["description-list", "primitiv-description-list"],
  ["figure", "primitiv-figure"],
  ["divider", "primitiv-divider"],
  ["box", "primitiv-box"],
  ["stack", "primitiv-stack"],
  ["grid", "primitiv-grid"],
  ["container", "primitiv-container"],
  ["center", "primitiv-center"],
  ["spacer", "primitiv-spacer"],
  ["aspect-ratio", "primitiv-aspect-ratio"],
  ["card", "primitiv-card"],
  ["input", "primitiv-input"],
  ["textarea", "primitiv-textarea"],
  ["field", "primitiv-field"],
  ["input-group", "primitiv-input-group"],
  ["checkbox", "primitiv-checkbox"],
  ["radio", "primitiv-radio"],
  ["switch", "primitiv-switch"],
  ["empty-state", "primitiv-empty-state"],
  ["progress", "primitiv-progress"],
  ["avatar", "primitiv-avatar"],
  ["avatar-group", "primitiv-avatar-group"],
  ["table", "primitiv-table"],
  ["breadcrumb", "primitiv-breadcrumb"],
  ["pagination", "primitiv-pagination"],
  ["alert", "primitiv-alert"],
  ["chip", "primitiv-chip"],
] as const) {
  test(`the ${id} preview is styled markup with no element to define`, async ({ page }) => {
    await page.goto(`/components/${id}/`);
    const root = page.locator(`.docs-elements-preview .${rootClass}`).first();
    await expect(root).toBeAttached();
    // Scoped to the previews: other page chrome may still be defining itself.
    expect(
      await page.evaluate(
        () => document.querySelectorAll(".docs-elements-preview :not(:defined)").length,
      ),
    ).toBe(0);
    expect(await page.evaluate((name) => !!customElements.get(name), `primitiv-${id}`)).toBe(false);
  });
}

test("the Button icon examples render real glyphs, not placeholders", async ({
  page,
}) => {
  await page.goto("/components/button/");
  await expect(cell(page, "with-icons").locator(".docs-elements-preview svg path")).toHaveCount(4);
});

test("React mode renders the React component, not the elements", async ({ page }) => {
  await page.addInitScript(
    ([key]) => localStorage.setItem(key, JSON.stringify("react")),
    [FRAMEWORK_KEY],
  );
  await page.goto("/components/tabs/");
  await expect(page.getByRole("tab").first()).toBeVisible();
  await expect(page.locator("primitiv-tabs")).toHaveCount(0);
});

test("the Checkbox tri-state preview derives the parent from its children", async ({ page }) => {
  await page.goto("/components/checkbox/");
  const example = cell(page, "indeterminate");
  const all = example.locator("#notify-all");
  // One of three starts checked, so the parent is mixed.
  await expect.poll(() => all.evaluate((el: HTMLInputElement) => el.indeterminate)).toBe(true);
  // Click the label, as a user does: the native input is clipped to an sr-only
  // 1px box, and a forced click at its centre lands on whatever WebKit
  // hit-tests there instead.
  await example.locator(".docs-elements-preview").getByText("Notifications", { exact: true }).click();
  await expect(example.locator('input[name="notify"]:checked')).toHaveCount(3);
  expect(await all.evaluate((el: HTMLInputElement) => el.indeterminate)).toBe(false);
});

test("the Radio value preview follows the selection", async ({ page }) => {
  await page.goto("/components/radio/");
  const example = cell(page, "controlled");
  await example.locator(".docs-elements-preview").getByText("Team", { exact: true }).click();
  await expect(example.getByRole("radio", { name: "Team" })).toBeChecked();
  await expect(example.locator("#subscription-value")).toHaveText("team");
});

test("the Switch script preview sets the switch", async ({ page }) => {
  await page.goto("/components/switch/");
  const example = cell(page, "controlled");
  await example.getByRole("button", { name: "Turn on" }).click();
  await expect(example.getByRole("switch", { name: "Email notifications" })).toBeChecked();
  await example.getByRole("button", { name: "Turn off" }).click();
  await expect(example.getByRole("switch", { name: "Email notifications" })).not.toBeChecked();
});

test("the Progress live preview moves the bar", async ({ page }) => {
  await page.goto("/components/progress/");
  const bar = cell(page, "live").getByRole("progressbar", { name: "Uploading files" });
  const first = await bar.getAttribute("aria-valuenow");
  await expect.poll(() => bar.getAttribute("aria-valuenow")).not.toBe(first);
});

test("a broken Avatar image falls back to its initials", async ({ page }) => {
  await page.goto("/components/avatar/");
  const example = cell(page, "missing-or-broken");
  await expect(example.locator(".docs-elements-preview img")).toHaveCount(0);
  await expect(example.locator(".primitiv-avatar__fallback-label")).toHaveText("GH");
});

test("the Alert dismiss button removes the alert", async ({ page }) => {
  await page.goto("/components/alert/");
  const example = cell(page, "dismissible");
  await example.getByRole("button", { name: "Dismiss" }).click();
  await expect(example.locator(".docs-elements-preview .primitiv-alert")).toHaveCount(0);
});

test("removing a Chip filter hands focus to its neighbour", async ({ page }) => {
  await page.goto("/components/chip/");
  const example = cell(page, "removable-filters");
  await example.getByRole("button", { name: "Remove Status: Active" }).click();
  await expect(example.locator(".primitiv-chip")).toHaveCount(2);
  await expect(example.getByRole("button", { name: "Remove Owner: You" })).toBeFocused();
});

for (const framework of ["elements", "react"]) {
  test(`the Context Menu region (${framework}) is a full-width dashed drop zone`, async ({ page }) => {
    await page.addInitScript(
      ([key, value]) => localStorage.setItem(key, JSON.stringify(value)),
      [FRAMEWORK_KEY, framework],
    );
    await page.goto("/components/context-menu/");
    const example = cell(page, "actions");
    // Wait for the stored framework to take over from the default render.
    await expect(example.locator("primitiv-context-menu")).toHaveCount(framework === "react" ? 0 : 1);
    const region = example.locator(".docs-context-region");
    await expect(region).toBeVisible();
    const [r, e] = await Promise.all([region.boundingBox(), example.boundingBox()]);
    // Spans the preview, less its padding, and is tall enough to read as a zone.
    expect(r!.width).toBeGreaterThan(e!.width * 0.75);
    expect(r!.height).toBeGreaterThanOrEqual(160);
    expect(await region.evaluate((el) => getComputedStyle(el).borderTopStyle)).toBe("dashed");
  });
}

test("the Toggle Group previews are <primitiv-toggle-group> elements, and the readout follows the change", async ({ page }) => {
  await page.goto("/components/toggle-group/");
  await expect(page.getByText(/dist\/cdn\/toggle-group\.js/).first()).toBeVisible();
  const example = cell(page, "multiple");
  const group = example.locator("primitiv-toggle-group");
  await expect(group).toHaveClass(/primitiv-toggle-group/);
  // The definition loads on demand: wait for the element to have wired its buttons.
  const bold = example.getByRole("button", { name: "Bold" });
  await expect(bold).toHaveAttribute("aria-pressed", "true");
  await example.getByRole("button", { name: "Italic" }).click();
  await expect(example.getByRole("button", { name: "Italic" })).toHaveAttribute("aria-pressed", "true");
  await expect(example.locator("[data-pressed-items]")).toHaveText('["bold", "italic"]');
});

test("the Toggle Group single example clears, and the readout says so", async ({ page }) => {
  await page.goto("/components/toggle-group/");
  const example = cell(page, "single");
  const grid = example.getByRole("button", { name: "Grid" });
  await expect(grid).toHaveAttribute("aria-pressed", "true");
  await grid.click();
  await expect(grid).toHaveAttribute("aria-pressed", "false");
  await expect(example.locator("[data-pressed-items]")).toHaveText("nothing (cleared)");
});

test("the Segmented Control previews are <primitiv-segmented-control> elements, and the readout follows the change", async ({ page }) => {
  await page.goto("/components/segmented-control/");
  await expect(page.getByText(/dist\/cdn\/segmented-control\.js/).first()).toBeVisible();
  const example = cell(page, "controlled");
  const control = example.locator("primitiv-segmented-control");
  await expect(control).toHaveClass(/primitiv-segmented-control/);
  // The definition loads on demand: wait for the element to have wired its buttons.
  const grid = example.getByRole("radio", { name: "Grid" });
  await expect(grid).toHaveAttribute("aria-checked", "true");
  await example.getByRole("radio", { name: "Board" }).click();
  await expect(example.getByRole("radio", { name: "Board" })).toHaveAttribute("aria-checked", "true");
  await expect(example.locator("[data-selected-segment]")).toHaveText("board");
  // A selected segment never lets go.
  await example.getByRole("radio", { name: "Board" }).click();
  await expect(control).toHaveAttribute("value", "board");
});

test("the Segmented Control's segment wrappers take no box, so justified segments share the track", async ({ page }) => {
  await page.goto("/components/segmented-control/");
  const example = cell(page, "justify");
  const justified = example.getByRole("radiogroup", { name: "Period, justified" });
  await expect(justified.getByRole("radio", { name: "Day" })).toHaveAttribute("aria-checked", "true");
  const [day, quarter] = await Promise.all([
    justified.getByRole("radio", { name: "Day" }).boundingBox(),
    justified.getByRole("radio", { name: "This quarter" }).boundingBox(),
  ]);
  expect(Math.abs(day!.width - quarter!.width)).toBeLessThan(1);
});

test("the Radio Card previews are <primitiv-radio-card> elements, and the readout follows the change", async ({ page }) => {
  await page.goto("/components/radio-card/");
  await expect(page.getByText(/dist\/cdn\/radio-card\.js/).first()).toBeVisible();
  const example = cell(page, "controlled");
  const group = example.locator("primitiv-radio-card");
  // The definition loads on demand: wait for the element to have wired its buttons.
  const pro = example.getByRole("radio", { name: /Pro/ });
  await expect(pro).toHaveAttribute("aria-checked", "true");
  await example.getByRole("radio", { name: /Team/ }).click();
  await expect(group).toHaveAttribute("value", "team");
  await expect(example.locator("[data-selected-plan]")).toHaveText("team");
  await expect(example.locator(".primitiv-radio-card__dot").nth(2)).toHaveAttribute("data-state", "checked");
});

test("the Checkbox Card select-all example keeps the parent in step with its children", async ({ page }) => {
  await page.goto("/components/checkbox-card/");
  await expect(page.getByText(/dist\/cdn\/checkbox-card\.js/).first()).toBeVisible();
  const example = cell(page, "indeterminate");
  const parent = example.getByRole("checkbox", { name: /All features/ });
  await expect(parent).toHaveAttribute("aria-checked", "mixed");
  await parent.click();
  await expect(example.getByRole("checkbox", { name: "Exports" })).toHaveAttribute("aria-checked", "true");
  await expect(parent).toHaveAttribute("aria-checked", "true");
  await example.getByRole("checkbox", { name: "Alerts" }).click();
  await expect(parent).toHaveAttribute("aria-checked", "mixed");
  await expect(parent).toContainText("2 of 3 selected");
});

test("the Slider previews are <primitiv-slider> elements, positioned and following the keys", async ({ page }) => {
  await page.goto("/components/slider/");
  await expect(page.getByText(/dist\/cdn\/slider\.js/).first()).toBeVisible();
  const example = cell(page, "range");
  const max = example.getByRole("slider", { name: "Maximum" });
  await expect(max).toHaveAttribute("aria-valuenow", "60");
  await expect(max).toHaveCSS("position", "absolute");
  await max.focus();
  await page.keyboard.press("ArrowRight");
  await expect(example.locator("[data-slider-value]")).toHaveText("[20, 61]");
  await page.keyboard.press("Home");
  await expect(max).toHaveAttribute("aria-valuenow", "30");
});

test("the Slider commit example counts each change and one commit per key press", async ({ page }) => {
  await page.goto("/components/slider/");
  const example = cell(page, "commit");
  const thumb = example.getByRole("slider", { name: "Quality" });
  await expect(thumb).toHaveAttribute("aria-valuenow", "40");
  await thumb.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(example.locator("[data-changes]")).toHaveText("2");
  await expect(example.locator("[data-commits]")).toHaveText("2");
});

test("the Breadcrumb Overflow previews are Dropdown elements in the trail, opening a menu of the hidden links", async ({ page }) => {
  await page.goto("/components/breadcrumb-overflow/");
  await expect(page.getByText(/dist\/cdn\/dropdown\.js/).first()).toBeVisible();
  const example = cell(page, "collapsing");
  await expect(example.locator("nav primitiv-dropdown")).toHaveCount(1);
  const trigger = example.getByRole("button", { name: "Show hidden pages" });
  // The definition loads on demand: wait for the element to have wired its trigger.
  await expect(trigger).toHaveAttribute("aria-haspopup", "menu");
  await trigger.click();
  await expect(example.getByRole("menuitem")).toHaveText(["Library", "Fiction", "Mystery"]);
});

test("the Split Button previews are <primitiv-split-button> elements, and a chosen row becomes the action", async ({ page }) => {
  await page.goto("/components/split-button/");
  await expect(page.getByText(/dist\/cdn\/split-button\.js/).first()).toBeVisible();
  const example = cell(page, "menu-of-actions");
  await expect(example.locator("primitiv-split-button")).toHaveCount(1);
  const action = example.getByRole("button", { name: "Save", exact: true });
  // The definition loads on demand: wait for the group to have decorated its action.
  await expect(action).toHaveAttribute("data-split-button-action", "");
  await action.focus();
  await page.keyboard.press("ArrowDown");
  await expect(example.getByRole("menuitem", { name: "Save", exact: true })).toBeFocused();
  await example.getByRole("menuitem", { name: "Save as draft" }).click();
  await expect(example.getByRole("button", { name: "Save as draft", exact: true })).toBeVisible();
  await expect(example.locator("primitiv-split-button")).toHaveAttribute("data-state", "closed");
});

test("the Listbox previews are <primitiv-listbox> elements, and the readout follows the change", async ({ page }) => {
  await page.goto("/components/listbox/");
  await expect(page.getByText(/dist\/cdn\/listbox\.js/).first()).toBeVisible();
  const example = cell(page, "multiple");
  const list = example.locator("primitiv-listbox");
  // The definition loads on demand: wait for the element to have wired its options.
  await expect(example.getByRole("option", { name: "Paris" })).toHaveAttribute("aria-selected", "true");
  // Styled even under Headless (the default), as React mode's preview is.
  await expect(list).toHaveAttribute("class", /primitiv-listbox/);
  await example.getByRole("option", { name: "Berlin" }).click();
  await expect(list).toHaveAttribute("value", "ams par ber");
  await expect(example.locator("[data-selected-cities]")).toHaveText("ams, par, ber");
});

test("the Listbox search example filters the list and drives it from the input", async ({ page }) => {
  await page.goto("/components/listbox/");
  const example = cell(page, "search-driven");
  const input = example.getByRole("searchbox", { name: "Search cities" });
  await expect(example.getByRole("option", { name: "Rome" })).toHaveAttribute("aria-selected", "false");
  await input.fill("ro");
  await expect(example.getByRole("option")).toHaveCount(1);
  await input.press("ArrowDown");
  await input.press("Enter");
  await expect(example.locator("primitiv-listbox")).toHaveAttribute("value", "rom");
  await expect(input).toBeFocused();
});

test("the Select previews are <primitiv-select> elements: the list opens, and a choice reaches the readout", async ({ page }) => {
  await page.goto("/components/select/");
  await expect(page.getByText(/dist\/cdn\/select\.js/).first()).toBeVisible();
  const example = cell(page, "controlled");
  const trigger = example.getByRole("button", { name: "React" });
  // The definition loads on demand: wait for the element to have wired its button.
  await expect(trigger).toHaveAttribute("aria-haspopup", "listbox");
  await trigger.click();
  await expect(example.getByRole("option", { name: "React" })).toBeFocused();
  await example.getByRole("option", { name: "Solid" }).click();
  await expect(example.locator("primitiv-select")).toHaveAttribute("value", "solid");
  await expect(example.locator("[data-select-value]")).toHaveText("solid");
  await expect(example.getByRole("button", { name: "Solid" })).toBeFocused();
});

test("the Combobox previews are <primitiv-combobox> elements: the page's filter narrows the list, and a commit reaches the readout", async ({ page }) => {
  await page.goto("/components/combobox/");
  await expect(page.getByText(/dist\/cdn\/combobox\.js/).first()).toBeVisible();
  const basic = cell(page, "basic");
  const field = basic.getByRole("combobox", { name: "Framework" });
  // The definition loads on demand: wait for the element to have wired its input.
  await expect(field).toHaveAttribute("aria-autocomplete", "list");
  await field.click();
  await page.keyboard.type("sv");
  await expect(basic.getByRole("option")).toHaveText(["Svelte"]);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(field).toHaveValue("Svelte");
  await expect(field).toBeFocused();

  const controlled = cell(page, "controlled");
  const input = controlled.getByRole("combobox", { name: "Framework" });
  await expect(input).toHaveAttribute("aria-autocomplete", "list");
  await input.click();
  await page.keyboard.type("vu");
  await controlled.getByRole("option", { name: "Vue" }).click();
  await expect(controlled.locator("primitiv-combobox")).toHaveAttribute("value", "vue");
  await expect(controlled.locator("[data-combobox-value]")).toHaveText("vue");
});

test("the Tree previews are <primitiv-tree> elements: a click selects, and the controlled buttons drive expansion", async ({ page }) => {
  await page.goto("/components/tree/");
  await expect(page.getByText(/dist\/cdn\/tree\.js/).first()).toBeVisible();
  const path = cell(page, "selection-path");
  // The definition loads on demand: wait for the element to have wired its rows.
  await expect(path.getByRole("treeitem", { name: "Button.tsx" })).toHaveAttribute("aria-selected", "true");
  await expect(path.locator("primitiv-tree")).toHaveAttribute("class", /primitiv-tree/);
  await path.getByRole("treeitem", { name: "Card.tsx" }).click();
  await expect(path.locator("[aria-current=page]")).toHaveText("Card.tsx");

  const controlled = cell(page, "controlled");
  await expect(controlled.getByRole("treeitem", { name: "favicon.ico" })).toHaveCount(0);
  await controlled.getByRole("button", { name: "Expand all" }).click();
  await expect(controlled.getByRole("treeitem", { name: "favicon.ico" })).toBeVisible();
  await controlled.getByRole("treeitem", { name: "app.tsx" }).click();
  await expect(controlled.locator("[data-selected-node]")).toHaveText("app.tsx");
  await controlled.getByRole("button", { name: "Collapse all" }).click();
  await expect(controlled.getByRole("treeitem", { name: "app.tsx" })).toHaveCount(0);
});

test("the Data Table previews load table.js, and the expandable rows are <primitiv-table-expand-trigger> elements", async ({ page }) => {
  await page.goto("/components/data-table/");
  await expect(page.getByText(/dist\/cdn\/table\.js/).first()).toBeVisible();
  const example = cell(page, "expandable").locator(".docs-elements-preview");
  const trigger = example.getByRole("button", { name: "Show details for harmoni-engine" });
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  expect(await page.evaluate(() => !!customElements.get("primitiv-table-expand-trigger"))).toBe(true);
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(example.getByText("finished in 142ms")).toBeVisible();
  // The row the markup starts open is open.
  await expect(example.getByRole("button", { name: "Show details for registry-api" })).toHaveAttribute("aria-expanded", "true");
});

test("the Data Table selection example's script keeps the header box and the count in step", async ({ page }) => {
  await page.goto("/components/data-table/");
  const example = cell(page, "selection").locator(".docs-elements-preview");
  const all = example.getByRole("checkbox", { name: "Select all rows" });
  await expect(all).toHaveJSProperty("indeterminate", true);
  // The native box sits under the drawn control, so press the control, as a user does.
  await all.locator("..").click();
  await expect(example.getByText("5 of 5 selected")).toBeVisible();
  await example.getByRole("checkbox", { name: "Select docs-site" }).locator("..").click();
  await expect(all).toHaveJSProperty("indeterminate", true);
  await expect(example.getByText("4 of 5 selected")).toBeVisible();
});

test.describe("the Code Block previews", () => {
  test.use({ permissions: ["clipboard-read", "clipboard-write"] });

  test("load code-block.js, and the copy control copies the block as shown", async ({ page }) => {
    await page.goto("/components/code-block/");
    await expect(page.getByText(/dist\/cdn\/code-block\.js/).first()).toBeVisible();
    const example = cell(page, "line-numbers").locator(".docs-elements-preview");
    // Highlighted at build time: the token spans are already in the markup.
    await expect(example.locator(".token.keyword").first()).toBeAttached();
    // Previews load the definitions on demand: press only once the element is defined.
    await page.waitForFunction(() => customElements.get("primitiv-code-block-copy"));
    const header = cell(page, "header").locator(".docs-elements-preview");
    const copy = header.locator(".primitiv-code-block__copy");
    await copy.click();
    await expect(copy).toHaveAccessibleName("Copied");
    const text = await page.evaluate(() => navigator.clipboard.readText());
    expect(text.startsWith('import { Button } from "@primitiv-ui/react";\n\nexport function Save() {')).toBe(true);
    expect(text.endsWith("}")).toBe(true);
  });

  test("the tabbed preview copies the panel that is shown", async ({ page }) => {
    await page.goto("/components/code-block/");
    await page.waitForFunction(() => customElements.get("primitiv-code-block-copy"));
    const example = cell(page, "tabbed").locator(".docs-elements-preview");
    await example.getByRole("tab", { name: "pnpm" }).click();
    await example.locator(".primitiv-code-block__copy").click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe("pnpm dlx primitiv add button");
  });
});
