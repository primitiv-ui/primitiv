// @ts-check
/**
 * Stryker for @primitiv-ui/web. Like core, the whole package is held at a hard
 * 100% from its first commit rather than ratcheted per component (RFC 0033 §6).
 */

/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  // Named explicitly: Stryker's default plugin glob doesn't resolve through
  // pnpm's symlinked node_modules.
  plugins: ["@stryker-mutator/vitest-runner"],
  testRunner: "vitest",
  coverageAnalysis: "perTest",
  reporters: ["html", "json", "clear-text", "progress"],
  htmlReporter: { fileName: "reports/mutation/web.html" },
  jsonReporter: { fileName: "reports/mutation/web.json" },
  clearTextReporter: { reportMutants: false },
  mutate: ["src/**/*.ts", "!src/**/*.test.ts", "!src/**/__tests__/**", "!src/**/types.ts", "!src/**/index.ts"],
  thresholds: { high: 100, low: 100, break: 100 },
};
