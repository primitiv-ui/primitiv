import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import wasm from "vite-plugin-wasm"

export default defineConfig({
  // Dev stays at "/"; the GitHub Pages build sets WORKBENCH_BASE so the app
  // is served under the docs site at /primitiv/workbench/.
  base: process.env.WORKBENCH_BASE ?? '/',
  plugins: [
    react(),
    wasm()
  ],
  build: {
    // Required by vite-plugin-wasm so top-level-await isn't downlevelled.
    // Drops the need for vite-plugin-top-level-await on Vite >= 8.
    target: 'esnext'
  }
})
