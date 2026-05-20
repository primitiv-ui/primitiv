import { defineConfig } from 'vite'

// Sandbox build. code.ts runs in Figma's plugin sandbox (the `figma` global,
// no DOM). It must be a single non-split script, so it is built in library
// mode as one IIFE alongside the UI output in dist/.
export default defineConfig({
  build: {
    target: 'es2017',
    outDir: 'dist',
    emptyOutDir: false,
    lib: {
      entry: 'src/code/code.ts',
      formats: ['iife'],
      name: 'primitivSyncPlugin',
      fileName: () => 'code.js',
    },
  },
})
