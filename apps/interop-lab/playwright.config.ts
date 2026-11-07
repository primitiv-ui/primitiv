import { existsSync } from "node:fs";

import { defineConfig } from "@playwright/test";

// In the cloud sandbox, use its pre-installed Chromium (its build differs from
// the one this pinned @playwright/test expects); in CI and anywhere else, use
// Playwright's managed browser.
const SANDBOX_CHROMIUM = "/opt/pw-browsers/chromium";
const executablePath = existsSync(SANDBOX_CHROMIUM) ? SANDBOX_CHROMIUM : undefined;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:4320",
    trace: "off",
    launchOptions: { executablePath },
  },
  projects: [{ name: "chromium" }],
  webServer: {
    command: "pnpm exec vite --port 4320 --strictPort",
    url: "http://localhost:4320/html.html",
    reuseExistingServer: !process.env.CI,
  },
});
