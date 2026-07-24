// @ts-check
/**
 * Stryker mutation testing for the framework-agnostic core — one component at a
 * time, mirroring `packages/react/stryker.config.mjs`.
 *
 * The gate is the same hard 100%: a survivor is a missing assertion, not a
 * threshold to relax. Logic that migrates out of an adapter and into core must
 * arrive under the same gate it left, or the extraction has quietly weakened
 * the suite.
 */

import { readFileSync } from "node:fs";

/**
 * Components whose core logic is mutation-clean (the ratchet). Shared with the
 * CI matrix via `mutation-allowlist.json`, exactly as the React package does.
 */
const ALLOWLIST = JSON.parse(
  readFileSync(new URL("./mutation-allowlist.json", import.meta.url), "utf8"),
);

const component = process.env.STRYKER_COMPONENT;
const targets = component ? [component] : ALLOWLIST;

/**
 * Mutate only the target component(s), mirroring the coverage-exclude list in
 * `vite.config.ts`: test files, pure-type modules, and barrels never mutate.
 */
const mutate = [
  ...targets.map((name) => `src/${name}/**/*.ts`),
  "!src/**/*.test.ts",
  "!src/**/__tests__/**",
  "!src/**/types.ts",
  "!src/**/index.ts",
];

// Per-component report path so scoped runs don't clobber each other.
const reportName = component ?? "allowlist";

/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  // Name the plugin explicitly: Stryker's default `@stryker-mutator/*` glob
  // doesn't resolve through pnpm's symlinked node_modules, so auto-discovery
  // finds no test runner.
  plugins: ["@stryker-mutator/vitest-runner"],
  testRunner: "vitest",
  coverageAnalysis: "perTest",
  reporters: ["html", "json", "clear-text", "progress"],
  htmlReporter: { fileName: `reports/mutation/${reportName}.html` },
  jsonReporter: { fileName: `reports/mutation/${reportName}.json` },
  clearTextReporter: { reportMutants: false },
  mutate,
  // Hard gate: any surviving mutant on an allowlisted component fails the run.
  thresholds: { high: 100, low: 100, break: 100 },
};
