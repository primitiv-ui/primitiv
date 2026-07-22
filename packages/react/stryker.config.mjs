// @ts-check
/**
 * Stryker mutation testing for the headless library — one component at a time.
 *
 * See `docs/mutation-testing-plan.md` and the `mutation-testing` skill for the
 * full rationale. In short: mutation is scoped per component via the
 * `STRYKER_COMPONENT` env var; whole-list runs mutate the ALLOWLIST below. The
 * gate is a hard 100% — a survivor is a missing assertion, not a threshold to
 * relax.
 */

import { readFileSync } from "node:fs";

/**
 * Components whose mutants are all killed (the ratchet). The list lives in
 * `mutation-allowlist.json` so the CI matrix and this config share one source
 * of truth. A component joins it ONLY once it holds a 100% mutation score. A
 * whole-list run (`mutate`) mutates exactly these; a scoped run
 * (`mutate:component <Name>`, which sets `STRYKER_COMPONENT`) overrides to that
 * single component.
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
  ...targets.map((name) => `src/${name}/**/*.{ts,tsx}`),
  "!src/**/*.test.{ts,tsx}",
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
