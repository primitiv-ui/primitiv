import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import wasm from "vite-plugin-wasm";
import { viteSingleFile } from "vite-plugin-singlefile";

// UI build. Figma's plugin UI is an <iframe> that can only load a single
// self-contained HTML file, so viteSingleFile inlines every JS/CSS chunk
// and assetsInlineLimit forces the harmoni-wasm binary to be inlined as a
// data URI rather than emitted as a sibling asset Figma could never fetch.
export default defineConfig({
  plugins: [react(), wasm(), viteSingleFile()],
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
