// @ts-check
/**
 * Stryker for @primitiv-ui/core. Unlike packages/react there is no per-component
 * allowlist: core is pure functions, so the whole package is held at a hard 100%
 * from its first commit (RFC 0033 §4).
 */

/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  // Named explicitly: Stryker's default plugin glob doesn't resolve through
  // pnpm's symlinked node_modules.
  plugins: ["@stryker-mutator/vitest-runner"],
  testRunner: "vitest",
  coverageAnalysis: "perTest",
  reporters: ["html", "json", "clear-text", "progress"],
  htmlReporter: { fileName: "reports/mutation/core.html" },
  jsonReporter: { fileName: "reports/mutation/core.json" },
  clearTextReporter: { reportMutants: false },
  mutate: ["src/**/*.ts", "!src/**/*.test.ts", "!src/**/__tests__/**", "!src/**/types.ts", "!src/**/index.ts"],
  thresholds: { high: 100, low: 100, break: 100 },
};
