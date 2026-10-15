/// <reference types="vitest/config" />
import { fileURLToPath, URL } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const path = (p: string) => fileURLToPath(new URL(p, import.meta.url));
const REPO = path("../../");
const DOCS = path("../docs-site/");

// The docs site's installed registry components (the canonical copies) over the
// headless source, so every density change in the video is the real token
// layer doing its job — nothing is mocked or restyled for the camera.
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: { cssMinify: "esbuild", chunkSizeWarningLimit: 4000 },
  server: { fs: { allow: [REPO] } },
  test: { include: ["src/**/*.test.ts", "scripts/**/*.test.mjs"] },
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      "@components": `${DOCS}src/components`,
      "@tokens": `${DOCS}src/styles/primitiv/tokens.css`,
      "@docs-content": `${DOCS}src/content`,
      "@docs-public": `${DOCS}public`,
      "@primitiv-ui/react": `${REPO}packages/react/src/index.ts`,
      "@primitiv-ui/icons": `${REPO}packages/icons/src/index.ts`,
      "class-variance-authority": path("./node_modules/class-variance-authority"),
    },
  },
});
