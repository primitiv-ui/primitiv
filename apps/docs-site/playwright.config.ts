import { defineConfig, devices, type Project } from "@playwright/test";

/*
 * Real-browser tests against the built docs site (moved from the kitchen-sink,
 * which is going away). The docs site links `@primitiv-ui/react` to the
 * workspace source, so a build exercises the CURRENT branch's headless code.
 *
 * The Carousel's infinite loop is geometry-driven (clone strip, glide, re-base
 * onto the real slide), which jsdom cannot lay out, so these are the only tests
 * that check it settles correctly. WebKit is the point of running them in CI:
 * it is iOS Safari's engine core, the closest reproduction of the iOS-only
 * scroll quirks. No engine reproduces real touch momentum, so fling distance
 * stays a real-device check.
 *
 * Build first, then: pnpm test:e2e (Chromium only unless WebKit is installed).
 */

const webkit: Project[] = process.env.CI
  ? [
      { name: "webkit", use: { ...devices["Desktop Safari"] } },
      { name: "mobile-safari", use: { ...devices["iPhone 13"] } },
    ]
  : [];

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: { baseURL: "http://localhost:4180", trace: "on-first-retry" },
  webServer: {
    command: "node e2e/serve.mjs 4180",
    url: "http://localhost:4180/components/carousel/",
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    ...webkit,
  ],
});
