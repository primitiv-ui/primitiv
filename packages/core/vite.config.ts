import { defineConfig, configDefaults } from "vitest/config";

// Mirrors packages/react: when Stryker runs a scoped mutation pass it sets
// STRYKER_COMPONENT, so narrow the test files to that component and the dry-run
// only loads its suite. Absent the env var — every normal run — the full suite
// runs unchanged.
const strykerComponent = process.env.STRYKER_COMPONENT;

export default defineConfig({
  test: {
    globals: true,
    // No jsdom: core is pure logic over plain data, so its tests need no DOM.
    environment: "node",
    // Never collect tests from Stryker's sandbox copies; a lingering
    // .stryker-tmp would otherwise double every test file into a normal run.
    exclude: [...configDefaults.exclude, "**/.stryker-tmp/**"],
    ...(strykerComponent
      ? { include: [`src/${strykerComponent}/**/*.test.ts`] }
      : {}),
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      thresholds: { lines: 100, branches: 100, functions: 100, statements: 100 },
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.test.ts",
        "src/**/__tests__/**",
        "src/index.ts",
        "src/**/index.ts",
        "src/**/types.ts",
      ],
    },
  },
});
