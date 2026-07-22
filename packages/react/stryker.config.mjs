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
 * Shared modules that physically live under one component's directory but are
 * *consumed* — and therefore naturally exercised — by other components. We test
 * behaviour through the real component that uses it, never a hook in isolation,
 * so such a module is mutation-tested under its consumer(s), not the directory
 * it happens to sit in. Map each to the component(s) whose own tests drive it.
 */
const SHARED_MODULES = {
  // The button-based tri-state hook for menu checkbox-items. Checkbox itself is
  // input-based (useCheckboxInput); this is used by Dropdown / ContextMenu.
  "src/Checkbox/hooks/useCheckboxRoot.ts": ["Dropdown", "ContextMenu"],
};

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

// Re-home shared modules onto their consumer(s): pull one into a consumer's run,
// and exclude it from the run of the directory it merely lives in.
for (const [path, owners] of Object.entries(SHARED_MODULES)) {
  if (targets.some((t) => owners.includes(t))) {
    mutate.push(path);
  } else if (targets.some((t) => path.startsWith(`src/${t}/`))) {
    mutate.push(`!${path}`);
  }
}

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
