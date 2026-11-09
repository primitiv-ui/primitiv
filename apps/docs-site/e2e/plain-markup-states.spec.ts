import { test, expect, type Page } from "@playwright/test";

// Hand-written markup (the Elements surface for a markup-only component) has no
// React primitive to set the `data-*` state hooks, so the stylesheets must read
// the native state too: `disabled`, `required`. Each case mounts plain HTML on
// the component's page, where its stylesheet is loaded, and reads the result.

const mount = async (page: Page, path: string, html: string) => {
  await page.goto(path);
  await page.evaluate((markup) => {
    const host = document.createElement("div");
    host.id = "plain-markup";
    host.innerHTML = markup;
    document.body.append(host);
  }, html);
  return page.locator("#plain-markup");
};

const opacity = (page: Page, selector: string) =>
  page.locator(selector).evaluate((el) => getComputedStyle(el).opacity);

test("a natively disabled input is dimmed", async ({ page }) => {
  await mount(page, "/components/input/", `<input class="primitiv-input primitiv-input--md" disabled>`);
  expect(await opacity(page, "#plain-markup input")).toBe("0.5");
});

test("a natively disabled textarea is dimmed", async ({ page }) => {
  await mount(
    page,
    "/components/textarea/",
    `<textarea class="primitiv-textarea primitiv-textarea--md" disabled></textarea>`,
  );
  expect(await opacity(page, "#plain-markup textarea")).toBe("0.5");
});

const field = (attr: string) =>
  [
    `<div class="primitiv-field primitiv-field--md">`,
    `  <label class="primitiv-field__label" for="plain-email">Email</label>`,
    `  <input class="primitiv-input primitiv-input--md" id="plain-email" ${attr}>`,
    `</div>`,
  ].join("\n");

test("a field whose control is required marks its label", async ({ page }) => {
  await mount(page, "/components/field/", field("required"));
  const marker = await page
    .locator("#plain-markup .primitiv-field__label")
    .evaluate((el) => getComputedStyle(el, "::after").content);
  expect(marker).toBe('"*"');
});

test("a field whose control is disabled is dimmed", async ({ page }) => {
  await mount(page, "/components/field/", field("disabled"));
  expect(await opacity(page, "#plain-markup .primitiv-field")).toBe("0.5");
});
