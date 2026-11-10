// The Modal element on a plain HTML page, in a real browser: what jsdom cannot
// vouch for — a real top-layer modal dialog, the inert page behind it, Escape,
// focus moving in and back out, and Tab escaping to the browser chrome.
import { expect, test } from "./fixtures";

type Page = import("@playwright/test").Page;

const open = async (page: Page, query = "") => {
  await page.goto(`/modal.html${query}`);
  await page.waitForFunction(() => customElements.get("primitiv-modal"));
};

const trigger = (page: Page) => page.getByRole("button", { name: "Edit profile", exact: true });
const dialog = (page: Page) => page.getByRole("dialog", { name: "Edit profile" });
const isModal = (page: Page) => page.evaluate(() => document.querySelector("dialog")?.matches(":modal"));

test("adopts the server's markup: the trigger points at the closed dialog", async ({ page }) => {
  await open(page);
  await expect(trigger(page)).toHaveAttribute("aria-haspopup", "dialog");
  await expect(trigger(page)).toHaveAttribute("aria-expanded", "false");
  await expect(trigger(page)).toHaveAttribute("aria-controls", "modal-content");
  await expect(page.locator("dialog")).toBeHidden();
});

test("a click opens it as a real modal dialog and moves focus inside", async ({ page }) => {
  await open(page);
  await trigger(page).click();
  await expect(dialog(page)).toBeVisible();
  expect(await isModal(page)).toBe(true);
  await expect(page.locator("#modal")).toHaveAttribute("open", "");
  await expect(page.getByRole("textbox", { name: "Name" })).toBeFocused();
  // The page behind is inert, under the backdrop: a press there lands on the dialog.
  const hit = await page.evaluate(() => {
    const outside = document.getElementById("outside") as HTMLElement;
    const { x, y } = outside.getBoundingClientRect();
    return document.elementFromPoint(x + 2, y + 2)?.localName;
  });
  expect(hit).toBe("dialog");
});

test("Escape closes it and hands focus back to the trigger", async ({ page }) => {
  await open(page);
  await trigger(page).click();
  await page.keyboard.press("Escape");
  await expect(page.locator("#modal")).not.toHaveAttribute("open");
  await expect(page.locator("dialog")).toBeHidden();
  await expect(trigger(page)).toBeFocused();
});

test("the close button closes it", async ({ page }) => {
  await open(page);
  await trigger(page).click();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.locator("#modal")).not.toHaveAttribute("open");
  await expect(trigger(page)).toBeFocused();
});

test("Tab wraps inside the dialog rather than escaping to the browser chrome", async ({ page }) => {
  await open(page, "?open");
  await page.getByRole("button", { name: "Cancel" }).focus();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("textbox", { name: "Name" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.getByRole("button", { name: "Cancel" })).toBeFocused();
});

test("a press on the backdrop closes it, and one inside does not", async ({ page }) => {
  await open(page, "?open");
  await dialog(page).click({ position: { x: 5, y: 5 } });
  await expect(page.locator("#modal")).toHaveAttribute("open", "");
  await page.mouse.click(2, 2);
  await expect(page.locator("#modal")).not.toHaveAttribute("open");
});

test("a server-rendered open modal opens modally on upgrade", async ({ page }) => {
  await open(page, "?open");
  await expect(dialog(page)).toBeVisible();
  expect(await isModal(page)).toBe(true);
  await expect(trigger(page)).toHaveAttribute("aria-expanded", "true");
});

test("a <form method=\"dialog\"> closes it and the state follows", async ({ page }) => {
  await open(page, "?open");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.locator("#modal")).not.toHaveAttribute("open");
  await expect(page.locator("dialog")).toBeHidden();
});

test("a cancelled change event keeps it open on Escape", async ({ page }) => {
  await open(page);
  await page.evaluate(() =>
    document.getElementById("modal")?.addEventListener("primitiv-modal-change", (e) => {
      if (!(e as CustomEvent<{ open: boolean }>).detail.open) e.preventDefault();
    }),
  );
  await trigger(page).click();
  await page.keyboard.press("Escape");
  await expect(page.locator("#modal")).toHaveAttribute("open", "");
  await expect(dialog(page)).toBeVisible();
  expect(await isModal(page)).toBe(true);
});
