import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// The workbench is an iteration surface, not a tested package — only the
// portable OklchPicker (RFC 0010) ships with tests, so coverage is scoped to
// its directory and held at 100% by discipline. wasm and canvas are mocked in
// the tests, so the wasm Vite plugin is deliberately absent here.
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["vitest.setup.ts"],
    include: ["src/OklchPicker/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      thresholds: { lines: 100, branches: 100, functions: 100, statements: 100 },
      include: ["src/OklchPicker/**/*.{ts,tsx}"],
      exclude: [
        "src/OklchPicker/**/*.test.{ts,tsx}",
        "src/OklchPicker/**/__tests__/**",
        "src/OklchPicker/**/*.fixtures.ts",
        "src/OklchPicker/index.ts",
      ],
    },
  },
});
