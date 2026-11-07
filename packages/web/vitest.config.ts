import { defineConfig, configDefaults } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    // jsdom implements customElements, which is what the element hosts need.
    // Real-browser behaviour jsdom cannot prove (`:dir()`, focus-visible,
    // upgrade timing against parsing) is the interop lab's job (RFC 0033 §7.4).
    environment: "jsdom",
    exclude: [...configDefaults.exclude, "**/.stryker-tmp/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      thresholds: { lines: 100, branches: 100, functions: 100, statements: 100 },
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/**/__tests__/**", "src/**/index.ts", "src/**/types.ts"],
    },
  },
});
