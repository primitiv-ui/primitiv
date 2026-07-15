import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The kitchen-sink is a real consumer (excluded from the pnpm workspace, it
// depends on the *published* @primitiv-ui packages). These dev aliases point
// the two packages under active development at the workspace source instead, so
// example pages can exercise headless changes that haven't been published yet
// (e.g. Carousel `orientation`). Drop an alias once its change ships to npm.
export default defineConfig({
  // Dev stays at "/"; the GitHub Pages docs build sets KITCHEN_SINK_BASE so the
  // app is served under the docs site at /primitiv/kitchen-sink/ (mirrors the
  // workbench). The sub-path base also switches the app to a hash router (see
  // src/main.tsx) so deep links survive a hard refresh on GitHub Pages.
  base: process.env.KITCHEN_SINK_BASE ?? '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@primitiv-ui/react': fileURLToPath(
        new URL('../../packages/react/src/index.ts', import.meta.url),
      ),
      '@primitiv-ui/icons': fileURLToPath(
        new URL('../../packages/icons/src/index.ts', import.meta.url),
      ),
    },
  },
})
