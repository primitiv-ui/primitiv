import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// UI build. Figma's plugin UI is an <iframe> that can only load a single
// self-contained HTML file, so viteSingleFile inlines every JS/CSS chunk.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    target: "esnext",
    outDir: "dist",
    emptyOutDir: false,
    assetsInlineLimit: () => true,
    rollupOptions: {
      input: "index.html",
    },
  },
});
