import { defineConfig, configDefaults } from "vitest/config";
import react from "@vitejs/plugin-react";

// When Stryker runs a scoped mutation pass it sets STRYKER_COMPONENT; narrow the
// test files to that component so the dry-run only loads its suite (the big
// per-component time saver). Absent the env var — every normal run — the full
// suite runs unchanged.
const strykerComponent = process.env.STRYKER_COMPONENT;

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["vitest.setup.ts"],
    // Never collect tests from Stryker's sandbox copies; a lingering
    // .stryker-tmp would otherwise double every test file into a normal run.
    exclude: [...configDefaults.exclude, "**/.stryker-tmp/**"],
    ...(strykerComponent
      ? { include: [`src/${strykerComponent}/**/*.test.{ts,tsx}`] }
      : {}),
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      thresholds: { lines: 100, branches: 100, functions: 100, statements: 100 },
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/**/__tests__/**",
        "src/test/**",
        "src/index.ts",
        "src/**/index.ts",
        "src/**/types.ts",
      ],
    },
  },
});
