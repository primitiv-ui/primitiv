import { test as base, expect } from "@playwright/test";

/** Every test fails on an uncaught page error: a broken element throws long before it renders wrongly. */
export const test = base.extend<{ errors: string[] }>({
  errors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      await use(errors);
      expect(errors, "uncaught errors on the page").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
