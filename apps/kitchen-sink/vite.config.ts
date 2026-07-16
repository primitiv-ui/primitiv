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
    // The @primitiv-ui/react alias points at the workspace *source*, which lives
    // outside this app's install (the kitchen-sink is excluded from the pnpm
    // workspace). Its `import "react"` therefore resolves upward to a *second*
    // React copy (packages/react/node_modules in dev, the root workspace copy in
    // CI) distinct from the app's own react — two React instances share no hook
    // dispatcher, so every hook throws "Cannot read properties of null (reading
    // 'useContext')" and the app white-pages. Dedupe collapses every react /
    // react-dom request onto this app's single copy.
    dedupe: ['react', 'react-dom'],
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
