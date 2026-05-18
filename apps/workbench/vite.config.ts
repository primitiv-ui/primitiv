import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import wasm from "vite-plugin-wasm"

export default defineConfig({
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
