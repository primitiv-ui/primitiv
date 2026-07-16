import { existsSync, readdirSync } from "node:fs";

import { defineConfig, devices, type Project } from "@playwright/test";

// Prefer the sandbox's pre-installed Chromium (its build differs from the one
// @playwright/test pins); fall back to Playwright's managed resolver elsewhere.
// Use the headless-shell binary: pinned Playwright 1.46 launches `--headless=old`,
// which the full Chromium 1194 removed — the headless-shell is the standalone
// old-headless implementation Chrome now points to for exactly this.
const SANDBOX_CHROMIUM =
  "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const CHROMIUM_PATH = existsSync(SANDBOX_CHROMIUM) ? SANDBOX_CHROMIUM : undefined;

// WebKit (iOS Safari's engine core) is the closest reproduction of the iOS-only
// snap quirks, but it isn't installable in every sandbox (egress policy can block
// Playwright's browser CDN). Only register the WebKit projects when the browser
// is actually available (or under CI, which installs it) so a bare run here still
// passes on Chromium alone instead of failing to launch a missing engine.
const browsersDir = process.env.PLAYWRIGHT_BROWSERS_PATH ?? "";
const hasWebkit =
  !!browsersDir &&
  existsSync(browsersDir) &&
  readdirSync(browsersDir).some((name) => name.startsWith("webkit"));
const webkitProjects: Project[] =
  hasWebkit || process.env.CI
    ? [
        { name: "webkit", use: { ...devices["Desktop Safari"] } },
        { name: "mobile-safari", use: { ...devices["iPhone 13"] } },
      ]
    : [];

// E2E harness for the kitchen-sink registry surface — the real-browser layer the
// jsdom unit tests can't reach. The Carousel infinite loop is geometry-driven
// (clone buffer, teleport-then-glide, scrollend recentre); jsdom reports zeroed
// layout, so those paths are only control-flow-tested there. These specs drive
// the *built* behaviour in a real engine with real scroll-snap.
//
// Run from the repo root (uses the root @playwright/test):
//   npx playwright test -c apps/kitchen-sink/playwright.config.ts --project=chromium
//
// The `webkit` / `mobile-safari` projects share iOS Safari's engine core and are
// the closest reproduction of the iOS-only snap quirks we hit on device (a plain
// Chromium can't surface them). WebKit isn't downloadable in every sandbox
// (egress policy may block Playwright's CDN); install it where it is —
// `npx playwright install webkit` — or run those projects in CI. NOTE: no engine
// simulates real touch *momentum/inertia*, so the fast-fling overshoot is not
// reproducible here — that stays a real-device check.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  webServer: {
    // The kitchen-sink is excluded from the pnpm workspace, so run its own vite
    // binary directly (a bare `pnpm exec vite` recurses into the workspace).
    // Base "/" → BrowserRouter, so /carousel/loop is a real deep link.
    command: "./node_modules/.bin/vite --port 5173 --strictPort",
    url: "http://localhost:5173/carousel/loop",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // This repo's sandbox pre-installs a Chromium whose build differs from
        // the one @playwright/test pins, and its CDN is egress-blocked (so
        // `playwright install` can't fetch the pinned build). Point at the
        // pre-installed binary when present; elsewhere Playwright's own resolver
        // (undefined → managed build) takes over.
        launchOptions: { executablePath: CHROMIUM_PATH },
      },
    },
    ...webkitProjects,
  ],
});
